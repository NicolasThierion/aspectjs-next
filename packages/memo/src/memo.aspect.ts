import { MemoDriver } from './drivers/memo.driver';
import { MemoKey } from './memo.types';
import { Memo, MemoOptions } from './memo.annotation';
import { Around, AroundContext, Aspect, Before, BeforeContext, JoinPoint, on } from '@aspectjs/core';
import { getMetaOrDefault, isFunction, isString, isUndefined, provider } from './utils/utils';
import { stringify } from 'flatted';
import { VersionConflictError } from './errors';
import { x86 } from 'murmurhash3js';
import { AspectError } from '@aspectjs/core/src/weaver/errors/aspect-error';
import Timeout = NodeJS.Timeout;

const MEMO_ID_REFLECT_KEY = '@aspectjs:memo/id';
let internalId = 0;

export interface MemoAspectOptions {
    namespace?: string | (() => string);
    expiration?: Date | number | (() => Date | number);
    id?: string | number | ((ctxt: BeforeContext<any, any>) => string | number);
    contextKey?: (ctxt: BeforeContext<any, any>) => MemoKey | string;
}

export const DEFAULT_MEMO_ASPECT_OPTIONS: Required<MemoAspectOptions> = {
    id: (ctxt: BeforeContext<any, any>) => {
        const { id, _id, hashcode, _hashcode } = ctxt.instance;
        const result = id ?? _id ?? hashcode ?? _hashcode;
        if (isUndefined(result)) {
            return getMetaOrDefault(MEMO_ID_REFLECT_KEY, ctxt.instance, () => internalId++);
        }
        return result;
    },
    namespace: '',
    contextKey: (ctxt: BeforeContext<any, any>) => {
        return new MemoKey({
            namespace: ctxt.data.namespace,
            instanceId: ctxt.data.instanceId,
            argsKey: x86.hash128(stringify(ctxt.args)),
            targetKey: ctxt.target.ref,
        });
    },
    expiration: undefined,
};

@Aspect('@aspectjs/memo')
export class MemoAspect {
    protected _params: MemoAspectOptions;
    private readonly _drivers: Record<string, MemoDriver> = {};
    /** maps memo keys with its unregister function for garbage collector timeouts */
    private readonly _entriesGc: Record<string, number | Timeout> = {};

    constructor(params?: MemoAspectOptions) {
        this._params = { ...params, ...DEFAULT_MEMO_ASPECT_OPTIONS };
    }

    getDrivers() {
        return this._drivers;
    }

    public drivers(...drivers: MemoDriver[]): this {
        drivers.forEach((d) => {
            if (this._drivers[d.NAME] === d) {
                return;
            }
            if (this._drivers[d.NAME]) {
                throw new Error(
                    `both ${d.constructor?.name} & ${this._drivers[d.NAME].constructor?.name} configured for name ${
                        d.NAME
                    }`,
                );
            }
            this._drivers[d.NAME] = d;
            this._initGc(d);
        });
        return this;
    }

    /**
     * Generate the key to be used to get/store the memoized result for this execution context
     * @param ctxt
     */
    @Before(on.method.withAnnotations(Memo))
    protected createKey(ctxt: BeforeContext<any, any>): void {
        const memoParams = ctxt.annotation.args[0] as MemoOptions;

        ctxt.data.namespace = provider(memoParams?.namespace)() ?? provider(this._params?.namespace)();
        ctxt.data.instanceId = `${provider(memoParams?.id)(ctxt) ?? provider(this._params?.id)(ctxt)}`;
        ctxt.data.contextKey = this._params.contextKey(ctxt);
    }

    /**
     * Apply the memo pattern. That is, get the result from cache if any, or call the original method and store the result otherwise.
     */
    @Around(on.method.withAnnotations(Memo))
    applyMemo(ctxt: AroundContext<any, any>, jp: JoinPoint): any {
        const key = ctxt.data.contextKey as MemoKey;
        if (!key) {
            throw new Error('memo key is not defined');
        }

        const options = ctxt.annotation.args[0] as MemoOptions;
        const expiry = this.getExpiry(ctxt, options);
        const drivers = _selectCandidateDrivers(this._drivers, ctxt);

        const proceedJoinpoint = () => {
            // value not cached. Call the original method
            const value = jp();
            const driver = drivers
                .map((d) => [d, d.getPriority(value)])
                .filter((dp) => dp[1] > 0)
                .sort((dp1: any, dp2: any) => dp2[1] - dp1[1])
                .map((dp) => dp[0])[0] as MemoDriver;

            if (!driver) {
                throw new AspectError(
                    ctxt,
                    `Driver ${drivers[0].NAME} does not accept value ${value} returned by memoized method`,
                );
            }
            /*value =  */ driver.setValue({
                key,
                expiry,
                value,
            });
            if (expiry) {
                this._scheduleCleaner(driver, key, expiry);
            }
            return value;
        };

        for (const d of drivers) {
            try {
                const memo = d.getValue(key);
                if (memo) {
                    if (memo.expiry && memo.expiry < new Date()) {
                        // remove data if expired
                        this._removeValue(d, key);
                    } else {
                        // getting value may trigger lazy deserialize that may produce errors.
                        return memo.value;
                    }
                }
            } catch (e) {
                // mute errors in ase of version mismatch, & just remove old version
                if (e instanceof VersionConflictError) {
                    this._removeValue(d, e.context.key);
                } else {
                    throw e;
                }
            }
        }
        // found no driver for this value. Call the real method
        return proceedJoinpoint();
    }

    private _removeValue(driver: MemoDriver, key: MemoKey): void {
        driver.remove(key);
        // get gc timeout handle
        const t = this._entriesGc[key.toString()];

        if (t !== undefined) {
            // this entry is not eligible for gc
            delete this._entriesGc[key.toString()];

            // remove gc timeout
            clearTimeout(t as number);
        }
    }

    private _scheduleCleaner(driver: MemoDriver, key: MemoKey, expiration: Date): void {
        const ttl = expiration.getTime() - new Date().getTime();
        if (ttl <= 0) {
            this._removeValue(driver, key);
        } else {
            this._entriesGc[key.toString()] = setTimeout(() => this._removeValue(driver, key), ttl) as any;
        }
    }

    private _initGc(driver: MemoDriver): void {
        driver.getKeys().then((keys) => {
            keys.forEach((k) => {
                Promise.resolve(driver.getValue(k)).then((memo) => {
                    this._scheduleCleaner(driver, k, memo.expiry);
                });
            });
        });
    }

    private getExpiry(ctxt: AroundContext<any, any>, options: MemoOptions): Date | undefined {
        const exp = provider(options?.expiration)();
        if (exp) {
            if (exp instanceof Date) {
                return exp;
            } else if (typeof exp === 'number' && exp > 0) {
                return new Date(new Date().getTime() + exp * 1000);
            } else if (exp === 0) {
                return;
            }

            throw new AspectError(ctxt, `expiration should be either a Date or a positive number. Got: ${exp}`);
        }
    }
}

function _selectCandidateDrivers(drivers: Record<string, MemoDriver>, ctxt: AroundContext<any, any>): MemoDriver[] {
    const annotationOptions = (ctxt.annotation.args[0] ?? {}) as MemoOptions;
    if (!annotationOptions.driver) {
        // return all drivers
        return Object.values(drivers);
    } else {
        if (isString(annotationOptions.driver)) {
            const candidates = Object.values(drivers).filter((d) => d.NAME === annotationOptions.driver);
            if (!candidates.length) {
                throw new AspectError(
                    ctxt,
                    `No candidate driver available for driver name "${annotationOptions.driver}"`,
                );
            }

            return candidates;
        } else if (isFunction(annotationOptions.driver)) {
            const candidates = Object.values(drivers).filter((d) => d.constructor === annotationOptions.driver);
            if (!candidates.length) {
                throw new AspectError(
                    ctxt,
                    `No candidate driver available for driver "${annotationOptions.driver?.name}"`,
                );
            }
            return candidates;
        } else {
            throw new AspectError(
                ctxt,
                `driver option should be a string or a Driver constructor. Got: ${annotationOptions.driver}`,
            );
        }
    }
}