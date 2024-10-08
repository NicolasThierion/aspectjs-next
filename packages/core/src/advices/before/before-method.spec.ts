import 'jest-extended';
import 'jest-extended/all';

import { AnnotationFactory, AnnotationKind } from '@aspectjs/common';
import { configureTesting } from '@aspectjs/common/testing';

import { Aspect } from '../../aspect/aspect.annotation';
import { JitWeaver } from '../../jit/jit-weaver';
import { on } from '../../pointcut/pointcut-expression.factory';
import { Before } from './before.annotation';

import { AdviceError } from '../../errors/advice.error';
import type { PointcutKind } from '../../pointcut/pointcut-kind.type';
import { WeaverModule } from '../../weaver/weaver.module';
import type { BeforeContext } from './before.context';

describe('method advice', () => {
  let aadvice: ReturnType<typeof jest.fn>;
  let badvice: ReturnType<typeof jest.fn>;
  let aaspect: any;
  let baspect: any;
  let mImpl: any;

  const AMethod = new AnnotationFactory('test').create(
    AnnotationKind.METHOD,
    'AMethod',
  );
  const BMethod = new AnnotationFactory('test').create(
    AnnotationKind.METHOD,
    'BMethod',
  );
  let weaver: JitWeaver;
  beforeEach(() => {
    const context = configureTesting(WeaverModule);
    weaver = context.get(JitWeaver);

    aadvice = jest.fn();
    badvice = jest.fn();
    mImpl = jest.fn();
  });

  function setupAspects(aannotations: any[] = [], bannotations: any[] = []) {
    @Aspect('AMethodLabel')
    class AAspect {
      @Before(on.methods.withAnnotations(...aannotations))
      applyBefore(
        ctxt: BeforeContext<PointcutKind.METHOD>,
        ...args: unknown[]
      ): void {
        return aadvice.bind(this)(ctxt, ...args);
      }
    }

    @Aspect('BMethodLabel')
    class BAspect {
      @Before(on.methods.withAnnotations(...bannotations))
      applyBefore(
        ctxt: BeforeContext<PointcutKind.METHOD>,
        ...args: unknown[]
      ): void {
        return badvice.bind(this)(ctxt, ...args);
      }
    }

    aaspect = new AAspect();
    baspect = new BAspect();
    weaver.enable(aaspect, baspect);
  }
  describe('on pointcut @Before(on.methods.withAnnotations()', () => {
    beforeEach(() => setupAspects());

    it('has a "this"  bound to the aspect instance', () => {
      const mImpl = jest.fn();
      class A {
        @AMethod()
        @BMethod()
        m(...args: any[]) {
          mImpl(this, ...args);
        }
      }

      expect(aadvice).not.toHaveBeenCalled();
      aadvice = jest.fn(function (this: any) {
        expect(this).toEqual(aaspect);
      });

      new A().m();
      expect(aadvice).toBeCalled();
    });

    it('calls each matching advice once', () => {
      const mImpl = jest.fn();
      class A {
        @AMethod()
        @BMethod()
        m(..._args: any[]) {
          mImpl(this, ..._args);
        }
      }

      expect(aadvice).not.toHaveBeenCalled();
      expect(badvice).not.toHaveBeenCalled();
      aadvice = jest.fn(function (this: any) {});

      new A().m();
      expect(aadvice).toHaveBeenCalledTimes(1);
      expect(badvice).toHaveBeenCalledTimes(1);
      expect(mImpl).toHaveBeenCalledTimes(1);
    });

    describe('if the method calls itself', () => {
      it('calls the advice twice', () => {
        let firstCall = true;
        class A {
          @AMethod()
          @BMethod()
          m(...args: any[]) {
            mImpl(...args);
            if (firstCall) {
              firstCall = false;
              this.m(...args);
            }
          }
        }

        expect(aadvice).not.toHaveBeenCalled();
        expect(badvice).not.toHaveBeenCalled();
        aadvice = jest.fn(function (this: any) {});

        new A().m();
        expect(aadvice).toHaveBeenCalledTimes(2);
        expect(badvice).toHaveBeenCalledTimes(2);
        expect(mImpl).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('on pointcut @Before(on.methods.withAnnotations(<CLASS_ANNOTATION>)', () => {
    beforeEach(() => setupAspects([AMethod], [BMethod]));

    it('has a "this"  bound to the aspect instance', () => {
      const mImpl = jest.fn();
      class A {
        @AMethod()
        m(...args: any[]) {
          mImpl(this, ...args);
        }
      }

      expect(aadvice).not.toHaveBeenCalled();
      aadvice = jest.fn(function (this: any) {
        expect(this).toEqual(aaspect);
      });

      new A().m();
      expect(aadvice).toBeCalled();
    });

    it('calls through the method once', () => {
      const mImpl = jest.fn();
      class A {
        @AMethod()
        m(..._args: any[]) {
          mImpl(this, ..._args);
        }
      }

      expect(aadvice).not.toHaveBeenCalled();
      aadvice = jest.fn(function (this: any) {});

      new A().m();
      expect(aadvice).toHaveBeenCalledTimes(1);
      expect(mImpl).toHaveBeenCalledTimes(1);
    });
    it('receives method arguments', () => {
      class A {
        labels: any;
        @AMethod()
        m(...args: any[]) {
          mImpl(this, ...args);
          expect(this).toEqual(a);
          this.labels = args;
          return this;
        }
      }

      expect(aadvice).not.toHaveBeenCalled();
      aadvice = jest.fn(function (
        this: any,
        ctxt: BeforeContext,
        args: unknown[],
      ) {
        expect(ctxt.args).toEqual(['b', 'c']);
        expect(args).toEqual(['b', 'c']);
      });

      let a = new A();
      a = a.m('b', 'c');
      expect(a.labels).toEqual(['b', 'c']);
    });

    it('is called before the method', () => {
      class A {
        @AMethod()
        m(...args: any[]) {
          mImpl(this, ...args);
        }
      }

      const a = new A();
      expect(aadvice).not.toHaveBeenCalled();
      a.m();
      expect(mImpl).toHaveBeenCalled();
      expect(aadvice).toHaveBeenCalledBefore(mImpl);
    });

    it('is not allowed to return', () => {
      class A {
        @AMethod()
        m(...args: any[]) {
          mImpl(this, ...args);
        }
      }

      expect(aadvice).not.toHaveBeenCalled();
      aadvice = jest.fn(function (this: any) {
        return 'x';
      });

      expect(() => new A().m()).toThrowError(AdviceError);

      try {
        new A().m();
      } catch (e: any) {
        expect(
          e.message.indexOf('Returning from advice is not supported'),
        ).toBeGreaterThanOrEqual(0);
      }
    });

    describe('is called with a context that ', () => {
      let thisInstance: any;

      it(`has context.instance = the annotated class's instance`, () => {
        class A {
          @AMethod()
          m(...args: any[]) {
            mImpl(this, ...args);
          }
        }
        aadvice = jest.fn((ctxt) => {
          thisInstance = ctxt.instance;
        });
        const a = new A();
        a.m();
        expect(aadvice).toHaveBeenCalled();
        expect(thisInstance).toBe(a);
      });

      it('has context.target.eval() = the annotated method', () => {
        class A {
          @AMethod()
          m(...args: any[]) {
            mImpl(this, ...args);
          }
        }
        aadvice = jest.fn((ctxt: BeforeContext) => {
          expect(ctxt.target.eval()).toEqual(a.m);
        });
        const a = new A();
        a.m();
        expect(aadvice).toHaveBeenCalled();
      });

      it('has context.annotations that contains the annotations for that joinpoint', () => {
        class A {
          @AMethod('annotationArg')
          @BMethod()
          m(...args: any[]) {
            mImpl(this, ...args);
          }
        }
        aadvice = jest.fn((ctxt: BeforeContext) => {
          expect(ctxt.annotations().find().length).toEqual(2);
          const aMethodAnnotationContext = ctxt.annotations(AMethod).find()[0];
          expect(aMethodAnnotationContext).toBeTruthy();
          expect(aMethodAnnotationContext?.args).toEqual(['annotationArg']);
          expect(aMethodAnnotationContext?.target.eval()).toBe(A.prototype.m);
        });
        new A().m();

        expect(aadvice).toHaveBeenCalled();
      });
    });
  });
});
