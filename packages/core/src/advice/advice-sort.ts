import {
  AnnotationRegistry,
  AnnotationTargetFactory,
  TargetType,
} from '@aspectjs/common';
import { getPrototype } from '@aspectjs/common/utils';
import { Order } from '../annotations/order.annotation';
import { AdviceEntry } from './registry/advice-entry.model';

export class AdviceSorter {
  constructor(
    private readonly annotationRegistry: AnnotationRegistry,
    private readonly annotationTargetFactory: AnnotationTargetFactory,
  ) {}

  sort(adviceEntry1: AdviceEntry, adviceEntry2: AdviceEntry) {
    const orderAnnotations1 = this.getOrderAnnotation(adviceEntry1);
    const orderAnnotations2 = this.getOrderAnnotation(adviceEntry2);

    const [order1, order2] = [
      orderAnnotations1?.args[0],
      orderAnnotations2?.args[0],
    ];
    if ((order1 === undefined && order2) === undefined) {
      return 0;
    }

    if (
      order1 === Order.HIGHEST_PRECEDENCE ||
      order2 === undefined ||
      order2 === Order.LOWEST_PRECEDENCE
    ) {
      return -1;
    } else if (
      order2 === Order.HIGHEST_PRECEDENCE ||
      order1 === undefined ||
      order1 === Order.LOWEST_PRECEDENCE
    ) {
      return 1;
    }

    return order1 - order2;
  }

  private getOrderAnnotation(entry: AdviceEntry) {
    const adviceTarget = this.annotationTargetFactory.of(
      getPrototype(entry.aspect).constructor,
      entry.advice.name,
    );

    return this.annotationRegistry
      .select()
      .on({
        target: adviceTarget,
        types: [TargetType.CLASS, TargetType.METHOD],
      })
      .filter(Order)
      .find({
        searchParents: true,
      })
      .reverse()[0];
  }
}
