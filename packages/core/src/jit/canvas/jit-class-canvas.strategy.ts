import {
  assert,
  ConstructorType,
  defineMetadata,
  getMetadata,
} from '@aspectjs/common/utils';
import { AdviceEntry } from './../../advice/registry/advice-entry.model';

import { JoinpointType } from './../../pointcut/pointcut-target.type';
import { JitWeaverCanvasStrategy } from './jit-canvas.strategy';

import { AdviceType } from '../../advice/advice-type.type';
import type { AdvicesSelection } from '../../advice/registry/advices-selection.model';
import { CompiledSymbol } from '../../weaver/canvas/canvas-strategy.type';
import type { WeaverContext } from '../../weaver/context/weaver.context';
import { MutableAdviceContext } from './../../advice/mutable-advice.context';
import { renameFunction } from './canvas.utils';
import { AdviceError } from '../../errors/advice.error';
import { CompileAdviceEntry } from '../../advice/registry/compile-advice-entry.model';

/**
 * Canvas to advise classes
 */
export class JitClassCanvasStrategy<
  X = unknown,
> extends JitWeaverCanvasStrategy<JoinpointType.CLASS, X> {
  constructor(weaverContext: WeaverContext) {
    super(weaverContext, [JoinpointType.CLASS]);
  }

  compile(
    ctxt: MutableAdviceContext<JoinpointType.CLASS, X>,
    selection: AdvicesSelection,
  ): ConstructorType<X> {
    //  if no class compile advices, return ctor as is
    const adviceEntries = [
      ...selection.find([JoinpointType.CLASS], [AdviceType.COMPILE]),
    ];

    // if another @Compile advice has been applied
    // replace wrapped ctor by original ctor before it gets wrapped again
    let constructor = getMetadata(
      '@aspectjs:jitClassCanvas',
      ctxt.target.proto,
      () => ctxt.target.proto.constructor,
      true,
    ) as ConstructorType<X>;

    if (!adviceEntries.length) {
      return constructor;
    }

    (
      adviceEntries as CompileAdviceEntry<
        JoinpointType.CLASS,
        X,
        AdviceType.COMPILE
      >[]
    )
      .filter((e) => !e.called)
      .forEach((entry) => {
        assert(typeof entry.advice === 'function');
        ctxt.target.proto.constructor = constructor;

        constructor = (entry.advice.call(
          entry.aspect,
          ctxt.asCompileContext(),
        ) ?? constructor) as ConstructorType<X>;
        if (typeof constructor !== 'function') {
          throw new AdviceError(
            entry.advice,
            ctxt.target,
            'should return void or a class constructor',
          );
        }
        entry.called = true;
      });
    return constructor;
  }

  override before(
    ctxt: MutableAdviceContext<JoinpointType.CLASS, X>,
    selection: AdvicesSelection,
  ): void {
    super.before(withNullInstance(ctxt), selection);
  }

  override callJoinpoint(
    ctxt: MutableAdviceContext<JoinpointType.CLASS, X>,
    originalSymbol: ConstructorType<X>,
  ): unknown {
    assert(!!ctxt.args);
    assert(!!ctxt.instance);
    const newInstance = new originalSymbol(...ctxt.args!);
    Object.assign(ctxt.instance as any, newInstance);
    return (ctxt.value = ctxt.instance);
  }

  override link(
    ctxt: MutableAdviceContext<JoinpointType.CLASS, X>,
    compiledConstructor: CompiledSymbol<JoinpointType.CLASS, X>,
    joinpoint: (...args: any[]) => unknown,
  ): ConstructorType<X> {
    assert(!!ctxt.target?.proto);
    defineMetadata(
      '@aspectjs:jitClassCanvas',
      compiledConstructor,
      ctxt.target.proto,
    );
    const ctorName = compiledConstructor.name;

    joinpoint = renameFunction(
      joinpoint,
      compiledConstructor,
      `class ${ctorName}$$advised {}`,
      compiledConstructor.toString.bind(compiledConstructor),
    );
    joinpoint.prototype = ctxt.target.proto;
    joinpoint.prototype.constructor = joinpoint;

    return joinpoint as any;
  }

  protected override callAdvice(
    adviceEntry: AdviceEntry<JoinpointType.CLASS>,
    ctxt: MutableAdviceContext<JoinpointType.CLASS>,
    args: unknown[],
    allowReturn = true,
  ): unknown {
    const val = super.callAdvice(adviceEntry, ctxt, args, allowReturn);

    if (val !== undefined) {
      ctxt.instance = val;
    }
    return (ctxt.value = ctxt.instance);
  }
}

/**
 * Void instance, as instance is not reliable before the actual call of the constructor
 */
function withNullInstance<X>(
  ctxt: MutableAdviceContext<JoinpointType.CLASS, X>,
): MutableAdviceContext<JoinpointType.CLASS, X> {
  return new MutableAdviceContext<JoinpointType.CLASS, X>({
    ...ctxt,
    instance: null,
  });
}
