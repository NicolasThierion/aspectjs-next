import { ConstructorType } from '@aspectjs/common/utils';
import { TypeHintType } from './type-hint.type';

export interface MapperContext {
  readonly mappers: MappersRegistry;
  readonly data: Record<string, unknown>;
}
export interface Mapper<T = unknown, U = unknown> {
  typeHint: TypeHintType | TypeHintType[];
  map(obj: T, context: MapperContext): U;
}

export class MappersRegistry {
  private readonly mappers: Map<TypeHintType, Mapper> = new Map();

  constructor(mappersReg?: MappersRegistry) {
    if (mappersReg) {
      this.mappers = new Map(mappersReg.mappers);
    }
  }

  add(...mappers: Mapper[]) {
    mappers.forEach((mapper) => {
      [mapper.typeHint].flat().forEach((typeHint) => {
        this.mappers.set(typeHint, mapper);
        if (typeof typeHint === 'function') {
          this.mappers.set(typeHint.name, mapper);
        }
      });
    });

    return this;
  }

  [Symbol.iterator]() {
    return this.mappers[Symbol.iterator]();
  }

  findMapper<T, U extends T>(typeHint: TypeHintType<U>): Mapper<T> | undefined {
    let mapper = this.mappers.get(typeHint);
    if (!mapper && typeof (typeHint as Function) === 'function') {
      // try to lookup mappers by type name
      mapper = this._findMapperByCtor<T, U>(typeHint as ConstructorType<T>);
    }

    return mapper;
  }

  private _findMapperByCtor<T, U extends T>(
    ctor: ConstructorType<T>,
  ): Mapper<U> | undefined {
    let mapper =
      this.mappers.get(ctor) ?? (this.mappers.get(ctor.name) as Mapper<U>);

    if (!mapper) {
      const parent = ctor.prototype
        ? Object.getPrototypeOf(ctor.prototype)?.constructor
        : null;
      if (parent && parent !== Object) {
        return this._findMapperByCtor(parent);
      }
    }

    return mapper;
  }
}
