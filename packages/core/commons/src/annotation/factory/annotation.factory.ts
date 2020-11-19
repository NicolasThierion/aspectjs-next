import { assert, getOrComputeMetadata, isFunction } from '@aspectjs/core/utils';
import { MutableAdviceContext } from '../../advices';
import { Advice, AdviceType } from '../../advices/types';
import { JoinPoint } from '../../types';
import { _getWeaverContext, WeaverContext } from '../../weaver';

import {
    Annotation,
    AnnotationRef,
    ClassAnnotationStub,
    Decorator,
    MethodAnnotationStub,
    ParameterAnnotationStub,
    PropertyAnnotationStub,
} from '../annotation.types';
import { AnnotationContext } from '../context/annotation.context';
import { AdviceTarget, AnnotationTarget } from '../target/annotation-target';

let generatedId = 0;
/**
 * Factory to create some {@link Annotation}.
 * @public
 */
export class AnnotationFactory {
    private readonly _groupId: string;

    constructor(groupId: string) {
        this._groupId = groupId;
    }
    create<A extends ClassAnnotationStub>(name: string, annotationStub?: A): A & AnnotationRef;
    create<A extends MethodAnnotationStub>(name: string, annotationStub?: A): A & AnnotationRef;
    create<A extends PropertyAnnotationStub>(name: string, annotationStub?: A): A & AnnotationRef;
    create<A extends ParameterAnnotationStub>(name: string, annotationStub?: A): A & AnnotationRef;
    create<A extends Decorator>(name: string, annotationStub?: A): A & AnnotationRef;
    create<A extends Annotation>(name: string, annotationStub?: A): A & AnnotationRef;
    create<A extends ClassAnnotationStub>(annotationStub?: A): A & AnnotationRef;
    create<A extends MethodAnnotationStub>(annotationStub?: A): A & AnnotationRef;
    create<A extends PropertyAnnotationStub>(annotationStub?: A): A & AnnotationRef;
    create<A extends ParameterAnnotationStub>(annotationStub?: A): A & AnnotationRef;
    create<A extends Decorator>(annotationStub?: A): A & AnnotationRef;
    create<A extends Annotation>(annotationStub?: A): A & AnnotationRef;
    create<A extends Annotation<AdviceType>>(name?: string | A, annotationStub?: A): A & AnnotationRef {
        const groupId = this._groupId;

        if (isFunction(name)) {
            annotationStub = name as A;
            name = undefined;
        }
        if (!annotationStub) {
            annotationStub = function () {} as any;
        }
        if (name) {
            (annotationStub as any).name = name;
        }
        // create the annotation (ie: decorator provider)
        const annotation = function (...annotationArgs: any[]): Decorator {
            const decorator = _createRegisterAnnotationDecorator(annotation as any, annotationStub, annotationArgs);
            _createAnnotation(decorator, annotationStub, groupId);

            return decorator;
        };

        // turn the stub into an annotation
        return _createAnnotation(annotation, annotationStub, groupId);
    }
}

function _createAnnotation<A extends Annotation<AdviceType>, D extends Decorator>(
    fn: Function & D,
    annotationStub: A,
    groupId: string,
): A {
    assert(typeof fn === 'function');

    // ensure annotation has a name.
    annotationStub = annotationStub ?? (function () {} as A);
    if (!annotationStub.name) {
        Reflect.defineProperty(annotationStub, 'name', {
            value: `anonymousAnnotation#${generatedId++}`,
        });
    }

    const annotationRef = new AnnotationRef(groupId, annotationStub.name);
    const annotation = Object.defineProperties(fn, Object.getOwnPropertyDescriptors(annotationRef)) as AnnotationRef &
        A;
    Object.defineProperties(annotation, Object.getOwnPropertyDescriptors(annotationStub));
    assert(Object.getOwnPropertySymbols(annotation).indexOf(Symbol.toPrimitive) >= 0);

    getOrComputeMetadata('aspectjs.referenceAnnotation', annotationStub, () => {
        Reflect.defineMetadata('aspectjs.referenceAnnotation', annotationStub, fn);
        return annotationStub;
    });

    return annotation;
}

function _createRegisterAnnotationDecorator<A extends AdviceType, S extends Annotation<AdviceType>>(
    annotation: Annotation<A>,
    annotationStub: S,
    annotationArgs: any[],
): Decorator {
    const GENERATORS = {
        [AdviceType.CLASS]: _createClassDecoration,
        [AdviceType.PROPERTY]: _createPropertyDecoration,
        [AdviceType.METHOD]: _createMethodDecoration,
        [AdviceType.PARAMETER]: _createParameterDecoration,
    };

    return function (...targetArgs: any[]): Function | PropertyDescriptor | void {
        annotationStub(...annotationArgs)?.apply(null, targetArgs);

        // assert the weaver is loaded before invoking the underlying decorator
        const weaverContext = _getWeaverContext();
        if (!weaverContext) {
            throw new Error(
                `Cannot invoke annotation ${annotation.name ?? ''} before "setWeaverContext()" has been called`,
            );
        }

        const target = weaverContext.annotations.targetFactory.of(targetArgs) as AnnotationTarget<any, A>;
        const annotationContext = new AnnotationContextImpl(target, annotationArgs, annotation);
        weaverContext.annotations.registry.register(annotationContext);

        const ctxt = new AdviceContextImpl(annotationContext);

        const generator = GENERATORS[ctxt.target.type];
        return generator(weaverContext, ctxt as AdviceContextImpl<any, any>);
    };
}

class AdviceContextImpl<T, A extends AdviceType> implements MutableAdviceContext<unknown, A> {
    public error: Error;
    public instance: T;
    public value: T | unknown;
    public args: any[];
    public joinpoint: JoinPoint;
    public target: AdviceTarget<T, A>;
    public data: Record<string, any>;
    public advices: Advice[];

    constructor(public annotation: AnnotationContext<T, A>) {
        this.target = annotation.target;
        this.data = {};
    }

    clone(): this {
        return Object.assign(Object.create(Reflect.getPrototypeOf(this)) as MutableAdviceContext<unknown, A>, this);
    }

    toString(): string {
        return `${this.annotation} ${this.target}`;
    }
}

class AnnotationContextImpl<T, D extends AdviceType> extends AnnotationContext<T, D> {
    constructor(public readonly target: AdviceTarget<T, D>, public readonly args: any[], annotation: AnnotationRef) {
        super(annotation.groupId, annotation.name);
    }
}

function _createClassDecoration<T>(
    weaverContext: WeaverContext,
    ctxt: AdviceContextImpl<any, AdviceType.CLASS>,
): Function {
    return weaverContext.getWeaver().enhanceClass(ctxt);
}

function _createPropertyDecoration(
    weaverContext: WeaverContext,
    ctxt: AdviceContextImpl<any, AdviceType.PROPERTY>,
): PropertyDescriptor {
    return weaverContext.getWeaver().enhanceProperty(ctxt);
}

function _createMethodDecoration(
    weaverContext: WeaverContext,
    ctxt: AdviceContextImpl<any, AdviceType.METHOD>,
): PropertyDescriptor {
    return weaverContext.getWeaver().enhanceMethod(ctxt);
}

function _createParameterDecoration(
    weaverContext: WeaverContext,
    ctxt: AdviceContextImpl<any, AdviceType.METHOD>,
): PropertyDescriptor {
    return weaverContext.getWeaver().enhanceParameter(ctxt);
}
