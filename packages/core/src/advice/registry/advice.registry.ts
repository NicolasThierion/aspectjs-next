import { AnnotationRef, AnnotationRegistry } from '@aspectjs/common';
import { ConstructorType, assert, getPrototype } from '@aspectjs/common/utils';

import { AfterReturn } from '../../advices/after-return/after-return.annotation';
import { AfterThrow } from '../../advices/after-throw/after-throw.annotation';
import { After } from '../../advices/after/after.annotation';
import { Around } from '../../advices/around/around.annotation';
import { Compile } from '../../advices/around/compile.annotation';
import { Before } from '../../advices/before/before.annotation';
import { WeavingError } from '../../errors/weaving.error';
import { Pointcut } from '../../pointcut/pointcut';
import { PointcutExpression } from '../../pointcut/pointcut-expression.type';
import { WeaverContext } from '../../weaver/context/weaver.context';
import { AdvicesSelection } from './advices-selection.model';

import { Order } from '../../annotations/order.annotation';
import { Aspect } from '../../aspect/aspect.annotation';
import type { AspectType } from '../../aspect/aspect.type';
import { AdviceSorter } from '../advice-sort';
import { Advice, AdviceType } from '../advice.type';
import type { AdviceEntry, AdviceRegBuckets } from './advice-entry.model';
const KNOWN_ADVICE_ANNOTATION_REFS = new Set([
  Compile.ref,
  Before.ref,
  Around.ref,
  AfterReturn.ref,
  AfterThrow.ref,
  After.ref,
]);

const KNOWN_ADVICE_TYPES = {
  [Compile.name]: AdviceType.COMPILE,
  [Before.name]: AdviceType.BEFORE,
  [Around.name]: AdviceType.AROUND,
  [AfterReturn.name]: AdviceType.AFTER_RETURN,
  [AfterThrow.name]: AdviceType.AFTER_THROW,
  [After.name]: AdviceType.AFTER,
};

export interface AdviceRegistryFilters {
  aspects?: ConstructorType<AspectType>[];
  annotations?: AnnotationRef[];
}

/**
 * Registry to store all registered advices by aspects.
 */
export class AdviceRegistry {
  private readonly buckets: AdviceRegBuckets = {};

  constructor(
    private readonly weaverContext: WeaverContext,
    private readonly adviceSorter: AdviceSorter,
  ) {}

  register(aspect: AspectType) {
    const aspectCtor = getPrototype(aspect).constructor;

    const pointcutAnnotations = new Set<AnnotationRef>();

    const advices: Advice[] = [];
    const processedAdvices = new Map<string, Pointcut[]>();
    // find advices annotations
    this.weaverContext
      .get(AnnotationRegistry)
      .select(...KNOWN_ADVICE_ANNOTATION_REFS)
      .onMethod(aspectCtor)
      .find({ searchParents: true })
      .forEach((adviceAnnotation) => {
        const advice: Advice = adviceAnnotation.target.descriptor
          .value as Advice;

        const expression = adviceAnnotation.args[0] as PointcutExpression;
        const type = KNOWN_ADVICE_TYPES[adviceAnnotation.ref.name]!;
        assert(!!type);
        const pointcut = new Pointcut({
          type: type,
          expression,
        });

        advice.pointcuts ??= [];

        // do not process advice if it has been processed on a child class already
        let processedPointcuts = processedAdvices.get(advice.name);
        if (!processedPointcuts) {
          processedPointcuts = [];
          processedAdvices.set(advice.name, processedPointcuts);
          Reflect.defineProperty(advice, Symbol.toPrimitive, {
            value: () =>
              [...advice.pointcuts]
                .map((p) => `@${p.adviceType}(${p.annotations.join(',')})`)
                .join('|') +
              ` ${aspect.constructor.name}.${String(advice.name)}()`,
          });

          Reflect.defineProperty(advice, 'name', {
            value: advice.name,
          });

          advices.push(advice);
        }

        // dedupe same advices found on child classes for a similar poitncut
        const simmilarPointcut = processedPointcuts.filter((p) =>
          p.isAssignableFrom(pointcut),
        )[0];
        if (simmilarPointcut) {
          simmilarPointcut.merge(pointcut);
        } else {
          advice.pointcuts.push(pointcut);
          processedPointcuts.push(pointcut);
          this.registerAdvice(aspect, pointcut, advice);
        }
        pointcut.annotations.forEach((a) => pointcutAnnotations.add(a));
      });

    advices.forEach(Object.seal);

    this.assertAnnotationsNotprocessed(aspect, [...pointcutAnnotations]);
  }

  select(filters: AdviceRegistryFilters): AdvicesSelection {
    return new AdvicesSelection(this.buckets, filters, this.adviceSorter);
  }

  private registerAdvice(
    aspect: AspectType,
    pointcut: Pointcut,
    advice: Advice,
  ) {
    const aspectCtor = getPrototype(aspect).constructor;

    const byTarget = (this.buckets[pointcut.targetType] ??= {});
    const byPointcutType = (byTarget[pointcut.adviceType] ??= new Map<
      ConstructorType<AspectType>,
      AdviceEntry[]
    >());

    const byAspect = byPointcutType.get(aspectCtor) ?? [];
    byPointcutType.set(aspectCtor, byAspect);

    byAspect.push({
      advice,
      aspect,
    });
  }

  private assertAnnotationsNotprocessed(
    aspect: AspectType,
    annotations: AnnotationRef[],
  ) {
    const adviceEntries = this.select(aspect).find();
    if (!adviceEntries.next()) {
      return;
    }
    const processedAnnotations = new Set(
      this.weaverContext
        .get(AnnotationRegistry)
        .select(...annotations)
        .all()
        .find()
        .map((a) => a.ref),
    );

    // Allow @Aspect a advice annotations to be processed already
    if (processedAnnotations.size) {
      [Aspect.ref, Order.ref, ...KNOWN_ADVICE_ANNOTATION_REFS].forEach((ref) =>
        processedAnnotations.delete(ref),
      );
    }

    if (processedAnnotations.size) {
      throw new WeavingError(
        `Could not enable aspect ${
          Object.getPrototypeOf(aspect).constructor.name
        }: Annotations have already been processed: ${[
          ...processedAnnotations,
        ].join(',')}`,
      );
    }
  }
}
