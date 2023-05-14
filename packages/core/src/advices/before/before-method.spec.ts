import 'jest-extended';
import 'jest-extended/all';

import { AnnotationFactory, AnnotationType } from '@aspectjs/common';
import { configureTesting } from '@aspectjs/common/testing';

import { Aspect } from '../../aspect/aspect.annotation';
import { JitWeaver } from '../../jit/jit-weaver';
import { on } from '../../pointcut/pointcut-expression.factory';
import { weaverContext } from '../../weaver/context/weaver.context.global';
import { Before } from './before.annotation';

import { AdviceError } from '../../errors/advice.error';
import type { PointcutTargetType } from '../../pointcut/pointcut-target.type';
import type { BeforeContext } from './before.context';

describe('method advice', () => {
  let advice: ReturnType<typeof jest.fn>;
  let aaspect: any;
  let baspect: any;
  let mImpl: any;

  const AMethod = new AnnotationFactory('test').create(
    AnnotationType.METHOD,
    'AMethod',
  );
  const BMethod = new AnnotationFactory('test').create(
    AnnotationType.METHOD,
    'BMethod',
  );
  let weaver: JitWeaver;
  beforeEach(() => {
    const context = configureTesting(weaverContext());
    weaver = context.get(JitWeaver);

    advice = jest.fn();
    mImpl = jest.fn();
  });

  function setupAspects(aanotations: any[] = [], bannotations: any[] = []) {
    @Aspect('AMethodLabel')
    class AAspect {
      @Before(on.methods.withAnnotations(...aanotations))
      applyBefore(
        ctxt: BeforeContext<PointcutTargetType.METHOD>,
        ...args: unknown[]
      ): void {
        return advice.bind(this)(ctxt, ...args);
      }
    }

    @Aspect('BMethodLabel')
    class BAspect {
      @Before(on.methods.withAnnotations(...bannotations))
      applyBefore(
        ctxt: BeforeContext<PointcutTargetType.METHOD>,
        ...args: unknown[]
      ): void {
        return advice.bind(this)(ctxt, ...args);
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

      expect(advice).not.toHaveBeenCalled();
      advice = jest.fn(function (this: any) {
        expect(this).toEqual(aaspect);
      });

      new A().m();
      expect(advice).toBeCalled();
    });

    it('calls each matching advice once', () => {
      const mImpl = jest.fn();
      class A {
        @AMethod()
        m(..._args: any[]) {
          mImpl(this, ..._args);
        }
      }

      expect(advice).not.toHaveBeenCalled();
      advice = jest.fn(function (this: any) {});

      new A().m();
      expect(advice).toHaveBeenCalledTimes(2);
      expect(mImpl).toHaveBeenCalledTimes(1);
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

      expect(advice).not.toHaveBeenCalled();
      advice = jest.fn(function (this: any) {
        expect(this).toEqual(aaspect);
      });

      new A().m();
      expect(advice).toBeCalled();
    });

    it('calls through the method once', () => {
      const mImpl = jest.fn();
      class A {
        @AMethod()
        m(..._args: any[]) {
          mImpl(this, ..._args);
        }
      }

      expect(advice).not.toHaveBeenCalled();
      advice = jest.fn(function (this: any) {});

      new A().m();
      expect(advice).toHaveBeenCalledTimes(1);
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

      expect(advice).not.toHaveBeenCalled();
      advice = jest.fn(function (
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
      expect(advice).not.toHaveBeenCalled();
      a.m();
      expect(mImpl).toHaveBeenCalled();
      expect(advice).toHaveBeenCalledBefore(mImpl);
    });

    it('is not allowed to return', () => {
      class A {
        @AMethod()
        m(...args: any[]) {
          mImpl(this, ...args);
        }
      }

      expect(advice).not.toHaveBeenCalled();
      advice = jest.fn(function (this: any) {
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
        advice = jest.fn((ctxt) => {
          thisInstance = ctxt.instance;
        });
        const a = new A();
        a.m();
        expect(advice).toHaveBeenCalled();
        expect(thisInstance).toBe(a);
      });

      it('has context.annotation that contains the proper annotations context', () => {
        class A {
          @AMethod('annotationArg')
          @BMethod()
          m(...args: any[]) {
            mImpl(this, ...args);
          }
        }
        advice = jest.fn((ctxt: BeforeContext) => {
          expect(ctxt.annotations.length).toEqual(2);
          const AMethodAnnotationContext = ctxt.annotations.filter(
            (an) => an.annotation === AMethod,
          )[0];
          expect(AMethodAnnotationContext).toBeTruthy();
          expect(AMethodAnnotationContext?.args).toEqual(['annotationArg']);
        });
        new A().m();

        expect(advice).toHaveBeenCalled();
      });
    });
  });
});