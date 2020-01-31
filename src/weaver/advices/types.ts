import { AnnotationType, JoinPoint } from '../..';
import { AdviceContext } from './advice-context';
import {
    AfterPointcut,
    AfterReturnPointcut,
    AfterThrowPointcut,
    AroundPointcut,
    BeforePointcut,
    CompilePointcut,
} from './pointcut';

export type CompileAdvice<T, A extends AnnotationType> = {
    pointcut?: CompilePointcut;
} & ((ctxt: AdviceContext<T, A>) => void | Function | PropertyDescriptor);

export type BeforeAdvice<T> = {
    pointcut?: BeforePointcut;
} & ((ctxt: AdviceContext<T, AnnotationType>) => void);
export type BeforeClassAdvice<T> = {
    pointcut?: BeforePointcut;
} & ((ctxt: Omit<AdviceContext<T, AnnotationType>, 'instance'>) => void);
export type AfterAdvice<T> = {
    pointcut?: AfterPointcut;
} & ((ctxt: AdviceContext<T, AnnotationType>) => void);
export type AfterReturnAdvice<T> = {
    pointcut?: AfterReturnPointcut;
} & ((ctxt: AdviceContext<T, AnnotationType>, returnValue: any) => T | null | undefined);
export type AfterThrowAdvice<T> = {
    pointcut?: AfterThrowPointcut;
} & ((ctxt: AdviceContext<T, AnnotationType>, thrownError: Error) => T | null | undefined);
export type AroundAdvice<T> = {
    pointcut?: AroundPointcut;
} & ((ctxt: AdviceContext<T, AnnotationType>, joinPoint: JoinPoint, args: any[]) => any);

export type Advice =
    | CompileAdvice<any, AnnotationType>
    | BeforeAdvice<any>
    | AfterAdvice<any>
    | AfterReturnAdvice<any>
    | AfterThrowAdvice<any>
    | AroundAdvice<any>;
