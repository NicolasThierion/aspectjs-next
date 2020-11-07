import { PointcutExpression } from '../../advice/pointcut';
import { ASPECTJS_ANNOTATION_FACTORY } from '../../utils/aspectjs.annotation.factory';

import { AnnotationRef } from '../../annotation/annotation.types';
// TODO remove when https://github.com/microsoft/rushstack/issues/1050 is resolved
AnnotationRef;

/**
 * @public
 */
export const Compile = ASPECTJS_ANNOTATION_FACTORY.create(function Compile(
    pointcutExp: PointcutExpression,
): MethodDecorator {
    return;
});