import { JoinpointType } from '../../pointcut/pointcut-target.type';
import { JitWeaverCanvasStrategy } from './jit-canvas.strategy';

import {
  MethodPropertyDescriptor,
  assert,
  defineMetadata,
  getMetadata,
} from '@aspectjs/common/utils';
import { AdviceType } from '../../advice/advice-type.type';
import { JoinPoint } from '../../advice/joinpoint';
import { MutableAdviceContext } from '../../advice/mutable-advice.context';
import { AdviceEntry } from '../../advice/registry/advice-entry.model';
import { AdvicesSelection } from '../../advice/registry/advices-selection.model';
import { CompiledSymbol } from '../../weaver/canvas/canvas-strategy.type';
import type { WeaverContext } from '../../weaver/context/weaver.context';
import { renameFunction } from './canvas.utils';
import { CompileAdviceEntry } from '../../advice/registry/compile-advice-entry.model';
import { AdviceError } from '../../errors/advice.error';

/**
 * Canvas to advise method and parameters
 */
export abstract class AbstractJitMethodCanvasStrategy<
  T extends JoinpointType.METHOD | JoinpointType.PARAMETER,
  X = unknown,
> extends JitWeaverCanvasStrategy<T, X> {
  protected abstract getAdviceEntries<P extends AdviceType>(
    selection: AdvicesSelection,
    pointcutType: P,
  ): AdviceEntry<T, X, P>[];

  compile(
    ctxt: MutableAdviceContext<T, X>,
    selection: AdvicesSelection,
  ): CompiledSymbol<T, X> {
    //  if no method compile advices, return method is
    const adviceEntries = this.getAdviceEntries(selection, AdviceType.COMPILE);

    assert(!!ctxt.target.propertyKey);
    if (!adviceEntries.length) {
      return Reflect.getOwnPropertyDescriptor(
        ctxt.target.proto,
        ctxt.target.propertyKey,
      ) as CompiledSymbol<T, X>;
    }

    // if another @Compile advice has been applied
    // replace wrapped method by original method before it gets wrapped again

    let methodDescriptor = getMetadata(
      '@aspectjs:jitMethodCanvas',
      ctxt.target.proto,
      ctxt.target.propertyKey,
      () =>
        Reflect.getOwnPropertyDescriptor(
          ctxt.target.proto,
          ctxt.target.propertyKey,
        ) as CompiledSymbol<T, X>,
      true,
    );
    (adviceEntries as CompileAdviceEntry<T, X, AdviceType.COMPILE>[])
      .filter((e) => !e.called)
      .forEach((entry) => {
        assert(typeof entry.advice === 'function');
        Object.defineProperty(
          ctxt.target.proto,
          ctxt.target.propertyKey,
          methodDescriptor,
        );

        methodDescriptor = (entry.advice.call(
          entry.aspect,
          ctxt.asCompileContext(),
        ) ?? methodDescriptor) as CompiledSymbol<T, X>;

        if (typeof methodDescriptor === 'function') {
          const surrogate = {
            fn: methodDescriptor,
          };
          methodDescriptor = Object.getOwnPropertyDescriptor(
            surrogate,
            'fn',
          )! as CompiledSymbol<T, X>;
        }

        if (typeof methodDescriptor.value !== 'function') {
          throw new AdviceError(
            entry.advice,
            ctxt.target,
            'should return void, a function, or a Method property descriptor',
          );
        }

        entry.called = true;
      });
    return methodDescriptor;
  }

  override callJoinpoint(
    ctxt: MutableAdviceContext<T, X>,
    originalSymbol: MethodPropertyDescriptor,
  ): unknown {
    return (ctxt.value = originalSymbol.value.call(
      ctxt.instance,
      ...ctxt.args!,
    ));
  }

  link(
    ctxt: MutableAdviceContext<T, X>,
    compiledSymbol: MethodPropertyDescriptor,
    joinpoint: (...args: any[]) => unknown,
  ): CompiledSymbol<T, X> {
    compiledSymbol = wrapMethodDescriptor(ctxt, compiledSymbol, joinpoint);

    defineMetadata(
      '@aspectjs:jitMethodCanvas',
      compiledSymbol,
      ctxt.target.proto,
      ctxt.target.propertyKey,
    );

    return compiledSymbol as CompiledSymbol<T, X>;
  }
}

export class JitMethodCanvasStrategy<
  X = unknown,
> extends AbstractJitMethodCanvasStrategy<
  JoinpointType.METHOD | JoinpointType.PARAMETER,
  X
> {
  constructor(weaverContext: WeaverContext) {
    super(weaverContext, [JoinpointType.METHOD, JoinpointType.PARAMETER]);
  }

  protected override getAdviceEntries<P extends AdviceType>(
    selection: AdvicesSelection,
    pointcutType: P,
  ): AdviceEntry<JoinpointType.METHOD | JoinpointType.PARAMETER, X, P>[] {
    return [
      ...selection.find(
        [JoinpointType.METHOD, JoinpointType.PARAMETER],
        [pointcutType],
      ),
    ];
  }

  override compile(
    ctxt: MutableAdviceContext<
      JoinpointType.METHOD | JoinpointType.PARAMETER,
      X
    >,
    selection: AdvicesSelection,
  ): MethodPropertyDescriptor {
    return super.compile(ctxt, selection) as MethodPropertyDescriptor;
  }

  override link(
    ctxt: MutableAdviceContext<
      JoinpointType.METHOD | JoinpointType.PARAMETER,
      X
    >,
    compiledSymbol: MethodPropertyDescriptor,
    joinpoint: (...args: any[]) => unknown,
  ): MethodPropertyDescriptor {
    return super.link(
      ctxt,
      compiledSymbol,
      joinpoint,
    ) as MethodPropertyDescriptor;
  }
}

function wrapMethodDescriptor<X>(
  ctxt: MutableAdviceContext<JoinpointType.METHOD | JoinpointType.PARAMETER, X>,
  descriptor: MethodPropertyDescriptor,
  joinpoint: JoinPoint,
): CompiledSymbol<JoinpointType.METHOD | JoinpointType.PARAMETER, X> {
  return {
    ...descriptor,
    value: renameFunction(
      joinpoint,
      (ctxt.target.proto as any)[ctxt.target.propertyKey]!,
      `function ${ctxt.target.propertyKey}$$advised`,
    ),
  };
}
