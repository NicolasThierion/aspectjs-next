import { configureTesting } from '@aspectjs/common/testing';
import { DecoratorProviderRegistry } from './decorator-provider.registry';
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-function */
import { ReflectProvider } from '../../reflect/reflect-provider.type';
import { ReflectModule } from '../../reflect/reflect.module';
import { AnnotationType } from '../annotation.types';
import { AnnotationFactory } from './annotation.factory';

const af = new AnnotationFactory('test');

describe('DecoratorProviderRegistry', () => {
  describe('when configured as a ReflectProvider', () => {
    let hookedDecorator = jest.fn();
    beforeEach(() => {
      hookedDecorator = jest.fn();
      class TestingModule implements ReflectModule {
        providers = [
          {
            provide: DecoratorProviderRegistry,
            deps: [DecoratorProviderRegistry],
            factory: (reg: DecoratorProviderRegistry) => {
              reg.add({
                name: '@aspectjs::test',
                createDecorator: function () {
                  return function (...args: any) {
                    return hookedDecorator(...args);
                  };
                },
              });

              return reg;
            },
          } satisfies ReflectProvider,
        ];
      }

      configureTesting().addModules(TestingModule);
    });

    describe('calling a class annotation', () => {
      it('calls the configured hooks', () => {
        const AClass = af.create(AnnotationType.CLASS, 'AClass');
        expect(hookedDecorator).not.toHaveBeenCalled();
        @AClass()
        class X {
          // static prop = 'staticProp'
        }
        expect(hookedDecorator).toHaveBeenCalled();
      });

      it('preserve static class properties', () => {
        hookedDecorator = jest.fn(() => function () {});

        const AClass = af.create(AnnotationType.CLASS, 'AClass');
        expect(hookedDecorator).not.toHaveBeenCalled();
        @AClass()
        class X {
          static prop = 'staticProp';
        }
        expect(X.prop).toEqual('staticProp');
      });
    });
  });
});