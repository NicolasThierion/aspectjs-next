import { MemoFrame } from '../drivers';
import { MemoKey } from '../memo.types';

/**
 * @public
 */
export interface MarshallingContext<T = unknown> extends PromiseLike<MemoFrame<T>> {
    readonly frame: MemoFrame<T>;
}

/**
 * @public
 */
export interface UnmarshallingContext<T = unknown> {
    readonly blacklist?: Map<MemoFrame, any>;
}
