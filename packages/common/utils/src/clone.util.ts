import { assert } from './assert.util';
import { defineMetadata, getMetadata, getMetadataKeys } from './meta.util';

/**
 * @internal
 */
export const _copyPropsAndMeta = <T extends {} = any>(
  target: T,
  source: T,
  propertyKeys: (string | symbol)[] = [],
) => {
  const valueType = typeof source;

  if (valueType === 'object' || valueType === 'function') {
    // copy static props
    Object.keys(source).forEach((k) => {
      (target as any)[k] = (source as any)[k];
    });

    getMetadataKeys(source)
      .map((key) => [key, getMetadata(key, source)] as [string, any])
      .forEach(([key, value]) => {
        defineMetadata(key, value, target);
      });

    propertyKeys.forEach((pk) => {
      getMetadataKeys(source, pk)
        .map((key) => [key, getMetadata(key, source, pk)] as [string, any])
        .forEach(([key, value]) => {
          defineMetadata(key, value, target, pk);
        });
    });
  } else {
    assert(false);
  }
};
