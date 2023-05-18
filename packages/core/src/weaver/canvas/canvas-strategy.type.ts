import type { ConstructorType } from '@aspectjs/common/utils';
import { MutableAdviceContext } from '../../advice/mutable-advice.context';
import { AdvicesSelection } from '../../advice/registry/advices-selection.model';

import { MethodPropertyDescriptor } from '@aspectjs/common';
import type { JoinPoint } from '../../advice/joinpoint';
import type { PointcutTargetType } from '../../pointcut/pointcut-target.type';

export type CompiledSymbol<
  T extends PointcutTargetType = PointcutTargetType,
  X = unknown,
> = T extends PointcutTargetType.CLASS
  ? ConstructorType<X>
  : T extends PointcutTargetType.METHOD | PointcutTargetType.PARAMETER
  ? MethodPropertyDescriptor
  : T extends PointcutTargetType.GET_PROPERTY | PointcutTargetType.SET_PROPERTY
  ? PropertyDescriptor
  : never;

export interface WeaverCanvasStrategy<
  T extends PointcutTargetType = PointcutTargetType,
  X = unknown,
> {
  compile(
    ctxt: MutableAdviceContext<T, X>,
    advicesEntries: AdvicesSelection,
  ): CompiledSymbol<T, X> | undefined;

  before(
    ctxt: MutableAdviceContext<T, X>,
    advicesEntries: AdvicesSelection,
  ): void;

  callJoinpoint(
    ctxt: MutableAdviceContext<T, X>,
    originalSymbol: CompiledSymbol<T, X>,
  ): unknown;

  afterReturn(
    ctxt: MutableAdviceContext<T, X>,
    advicesEntries: AdvicesSelection,
  ): T;

  afterThrow(
    ctxt: MutableAdviceContext<T, X>,
    advicesEntries: AdvicesSelection,
  ): T;

  after(
    ctxt: MutableAdviceContext<T, X>,
    afteradvicesEntries: AdvicesSelection,
  ): void;

  around(
    ctxt: MutableAdviceContext<T, X>,
    advicesEntries: AdvicesSelection,
  ): JoinPoint;

  link?(
    ctxt: MutableAdviceContext<T, X>,
    compiledSymbol: CompiledSymbol<T, X>,
    joinpoint: (...args: any[]) => T,
  ): CompiledSymbol<T, X>;
}
