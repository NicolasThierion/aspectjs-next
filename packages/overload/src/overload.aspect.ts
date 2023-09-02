import 'reflect-metadata';

import { Prototype, getMetadata } from '@aspectjs/common/utils';
import {
  Around,
  AroundContext,
  Aspect,
  AspectError,
  Compile,
  JoinPoint,
  JoinpointType,
  on,
} from '@aspectjs/core';
import { Overload } from './overload.annotation';
import { MethodAnnotationTarget } from '@aspectjs/common';

type Signature = string;
type Method = (...args: any[]) => any;

@Aspect('overload')
export class OverloadAspect {
  private static readonly VTABLE_SYMBOL = Symbol.for('overload:vtable');

  constructor() {
    this.assertEmitDecoratorMetadataEnabled();
  }

  @Compile(on.methods.withAnnotations(Overload))
  registerForOverload(
    ctxt: AroundContext<JoinpointType.METHOD>,
    jp: JoinPoint,
    args: unknown[],
  ) {
    const signature = this.getSignature(ctxt.target);
    const vtable = this.getVTable(ctxt.target.proto, ctxt.target.propertyKey);
    const methods = vtable.get(signature) ?? [];
    methods.push();
    vtable.set(signature, methods);
  }

  private getSignature(target: MethodAnnotationTarget) {
    const meta = this.getDecoratorMetadata();
    return `${target.ref}(${meta.paramtypes})`;
  }

  private assertEmitDecoratorMetadataEnabled() {
    if (!Reflect.getMetadata('design:type', Function)) {
      throw new AspectError(
        `Cannot enable ${
          Object.getPrototypeOf(OverloadAspect).constructor.name
        }: Please add the following flag to your "tsconfig.json":
"compilerOptions.emitDecoratorMetadata = true"`,
      );
    }
  }

  private getVTable(
    proto: Prototype,
    propertyKey: string | symbol,
  ): Map<Signature, Method[]> {
    return getMetadata(
      OverloadAspect.VTABLE_SYMBOL,
      proto,
      propertyKey,
      () => new Map<Signature, Method[]>(),
    );
  }

  private getDecoratorMetadata() {
    const [type, paramtypes, returntype] = [
      Reflect.getMetadata('design:type', Function),
      Reflect.getMetadata('design:paramtypes', [String]),
      Reflect.getMetadata('design:returntype', String),
    ];

    return { type, paramtypes, returntype };
  }
}
