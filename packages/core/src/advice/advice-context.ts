import { AnnotationContext } from '../annotation/context/context';
import { AnnotationTarget } from '../annotation/target/annotation-target';
import { AnnotationType } from '../annotation/annotation.types';
import { JoinPoint } from '../weaver/types';
import { AfterContext } from './after/after-context';
import { BeforeContext } from './before/before-context';
import { AfterReturnContext } from './after-return/after-return-context';
import { AfterThrowContext } from './after-throw/after-throw-context';
import { AroundContext } from './around/around-context';
import { CompileContext } from './compile/compile-context';
import { Advice } from './types';

/**
 * @public
 */
export type AdviceContext<T = unknown, A extends AnnotationType = any> =
    | AfterContext<T, A>
    | BeforeContext<T, A>
    | AfterReturnContext<T, A>
    | AfterThrowContext<T, A>
    | AroundContext<T, A>
    | CompileContext<T, A>;

export interface MutableAdviceContext<T = unknown, A extends AnnotationType = any> {
    annotation?: AnnotationContext<T, A>;
    instance?: T;
    value?: unknown;
    args?: unknown[];
    error?: Error;
    joinpoint?: JoinPoint;
    target: AnnotationTarget<T, A>;
    /** any data set by the advices, shared across all advice going through  this execution context **/
    data: Record<string, any>;
    /** The list of pending advices for the same phase. Change this list to change all the advices that are going to get applied after the currently applied advice **/
    advices: Advice[];

    clone(): this;
}

export { AfterContext, BeforeContext, AfterReturnContext, AfterThrowContext, AroundContext, CompileContext };
