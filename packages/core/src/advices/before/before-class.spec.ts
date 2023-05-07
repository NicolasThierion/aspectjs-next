import 'jest-extended';
import 'jest-extended/all';

import { AnnotationFactory, AnnotationType } from '@aspectjs/common';
import { configureTesting } from '@aspectjs/common/testing';

import { JitWeaver } from '../../jit/jit-weaver';
import { Aspect } from './../../aspect/aspect.annotation';
import { on } from './../../pointcut/pointcut-expression.factory';
import { weaverContext } from './../../weaver/context/weaver.context.global';
import { Before } from './before.annotation';

import { AdviceError } from '../../errors/advice.error';
import type { PointcutTargetType } from '../../pointcut/pointcut-target.type';
import type { BeforeContext } from './before.context';

describe('@Before(on.classes.withAnotations(<CLASS_ANOMATION>) advice', () => {
  let advice: ReturnType<typeof jest.fn>;
  let aspect: any;
  const AClass = new AnnotationFactory('test').create(
    AnnotationType.CLASS,
    'AClass',
  );
  const A2Class = new AnnotationFactory('test').create(
    AnnotationType.CLASS,
    'A2Class',
  );
  let weaver: JitWeaver;
  beforeEach(() => {
    const context = configureTesting(weaverContext());
    weaver = context.get(JitWeaver);

    advice = jest.fn();

    @Aspect('AClassLabel')
    class AAspect {
      @Before(on.classes.withAnnotations(AClass))
      applyBefore(
        ctxt: BeforeContext<PointcutTargetType.CLASS>,
        ...args: unknown[]
      ): void {
        return advice.bind(this)(ctxt, ...args);
      }
    }

    aspect = new AAspect();
    weaver.enable(aspect);
  });

  it('has a "this"  bound to the aspect instance', () => {
    @AClass()
    class A {}

    expect(advice).not.toHaveBeenCalled();
    advice = jest.fn(function (this: any) {
      expect(this).toEqual(aspect);
    });

    new A();
    expect(advice).toBeCalled();
  });

  it('calls through the class constructor once', () => {
    @AClass()
    class A {
      constructor() {}
    }

    expect(advice).not.toHaveBeenCalled();
    advice = jest.fn(function (this: any) {});

    new A();
    expect(advice).toHaveBeenCalledTimes(1);
  });
  it('receives constructor arguments', () => {
    @AClass()
    class A {
      constructor(public labels = ['A']) {}
    }

    expect(advice).not.toHaveBeenCalled();
    advice = jest.fn(function (
      this: any,
      ctxt: BeforeContext,
      args: unknown[],
    ) {
      expect(ctxt.args).toEqual([['X']]);
      expect(args).toEqual([['X']]);
    });

    const a = new A(['X']);
    expect(a.labels).toEqual(['X']);
  });

  it('is called before the constructor', () => {
    const ctor = jest.fn();
    @AClass()
    class A {
      constructor() {
        ctor();
      }
    }

    new A();
    expect(advice).toHaveBeenCalled();
    expect(ctor).toHaveBeenCalled();
    expect(advice).toHaveBeenCalledBefore(ctor);
  });

  it('is not allowed to return', () => {
    @AClass()
    class A {}

    expect(advice).not.toHaveBeenCalled();
    advice = jest.fn(function (this: any) {
      return 'x';
    });

    expect(() => {
      new A();
    }).toThrowError(AdviceError);

    try {
      new A();
    } catch (e: any) {
      expect(
        e.message.indexOf('Returning from advice is not supported'),
      ).toBeGreaterThanOrEqual(0);
    }
  });

  describe('is called with a context ', () => {
    let thisInstance: any;

    it('with context.instance = null', () => {
      @AClass()
      class A {
        constructor(public labels = ['X']) {}
      }
      advice = jest.fn((ctxt) => {
        thisInstance = ctxt.instance;
      });
      new A();

      expect(thisInstance).toBeNull();
    });

    it('with context.annotation that contains the proper annotations context', () => {
      @AClass('annotationArg')
      @A2Class()
      class A {
        constructor() {}
      }
      advice = jest.fn((ctxt: BeforeContext) => {
        expect(ctxt.annotations.length).toEqual(2);
        const aclassAnnotationContext = ctxt.annotations.filter(
          (an) => an.annotation === AClass,
        )[0];
        expect(aclassAnnotationContext).toBeTruthy();
        expect(aclassAnnotationContext?.args).toEqual(['annotationArg']);
      });
      new A();
    });
  });
});
