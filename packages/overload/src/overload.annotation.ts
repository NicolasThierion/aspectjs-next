import { AnnotationType } from '@aspectjs/common';
import { overloadAnnotationFactory } from './overload-annotation-factory';

export const Overload = overloadAnnotationFactory.create(
  AnnotationType.METHOD,
  function Overload() {},
);
