import {
  AnnotationByTargetSelector,
  AnnotationFactory,
  AnnotationRef,
} from '@aspectjs/common';
import { configureTesting } from '@aspectjs/common/testing';

import { AnnotationContextRegistry } from './annotation-context.registry';

describe('AnnotationContextRegistry', () => {
  let annotationContextRegistry: AnnotationContextRegistry;

  let A = class A {
    prop1!: string;
    prop2!: string;
    fn1(..._args: any[]): any {}
    fn2(..._args: any[]): any {}
  };
  let B = class B {};
  let X = class X {};

  // represents annotations on class A
  let A_ANNOTATIONS: AnnotationRef[] = [];
  let A_CLASS_ANNOTATIONS: AnnotationRef[] = [];
  let A_PROPERTY_ANNOTATIONS: AnnotationRef[] = [];
  let A_METHOD_ANNOTATIONS: AnnotationRef[] = [];
  let A_PARAMETER_ANNOTATIONS: AnnotationRef[] = [];
  // represents annotations on class B
  let B_ANNOTATIONS: AnnotationRef[] = [];
  let B_CLASS_ANNOTATIONS: AnnotationRef[] = [];
  let B_PROPERTY_ANNOTATIONS: AnnotationRef[] = [];
  let B_METHOD_ANNOTATIONS: AnnotationRef[] = [];
  let B_PARAMETER_ANNOTATIONS: AnnotationRef[] = [];

  let A1Annotation: any;
  let A2Annotation: any;
  let B1Annotation: any;
  let B2Annotation: any;
  let A1ClassAnnotation: any;
  let A2ClassAnnotation: any;
  let B1ClassAnnotation: any;
  let B2ClassAnnotation: any;
  let A1PropertyAnnotation: any;
  let A2PropertyAnnotation: any;
  let B1PropertyAnnotation: any;
  let B2PropertyAnnotation: any;
  let A1MethodAnnotation: any;
  let A2MethodAnnotation: any;
  let B1MethodAnnotation: any;
  let B2MethodAnnotation: any;
  let A1ParameterAnnotation: any;
  let A2ParameterAnnotation: any;
  let B1ParameterAnnotation: any;
  let B2ParameterAnnotation: any;
  let XAnnotation: any;
  let annotationFactory: AnnotationFactory;
  function setup() {
    A = class A {} as any;
    B = class B {} as any;
    X = class X {} as any;
    annotationContextRegistry = configureTesting().get(
      AnnotationContextRegistry,
    );

    annotationFactory = new AnnotationFactory('test');
    A1Annotation = annotationFactory.create('A1Annotation');
    A2Annotation = annotationFactory.create('A2Annotation');
    B1Annotation = annotationFactory.create('B1Annotation');
    B2Annotation = annotationFactory.create('B2Annotation');
    A1ClassAnnotation = annotationFactory.create('A1ClassAnnotation');
    A2ClassAnnotation = annotationFactory.create('A2ClassAnnotation');
    B1ClassAnnotation = annotationFactory.create('B1ClassAnnotation');
    B2ClassAnnotation = annotationFactory.create('B2ClassAnnotation');
    A1PropertyAnnotation = annotationFactory.create('A1PropertyAnnotation');
    A2PropertyAnnotation = annotationFactory.create('A2PropertyAnnotation');
    B1PropertyAnnotation = annotationFactory.create('B1PropertyAnnotation');
    B2PropertyAnnotation = annotationFactory.create('B2PropertyAnnotation');
    A1MethodAnnotation = annotationFactory.create('A1MethodAnnotation');
    A2MethodAnnotation = annotationFactory.create('A2MethodAnnotation');
    B1MethodAnnotation = annotationFactory.create('B1MethodAnnotation');
    B2MethodAnnotation = annotationFactory.create('B2MethodAnnotation');
    A1ParameterAnnotation = annotationFactory.create('A1ParameterAnnotation');
    A2ParameterAnnotation = annotationFactory.create('A2ParameterAnnotation');
    B1ParameterAnnotation = annotationFactory.create('B1ParameterAnnotation');
    B2ParameterAnnotation = annotationFactory.create('B2ParameterAnnotation');
    XAnnotation = annotationFactory.create('XAnnotation');

    @A1Annotation('A1')
    @A2Annotation('A2')
    @A1ClassAnnotation('A1class')
    @A2ClassAnnotation('A2class')
    class _A extends A {
      @A1Annotation('A1')
      @A1PropertyAnnotation('A1prop')
      override prop1 = 'propA1';

      @A2Annotation('A2')
      @A2PropertyAnnotation('A2prop')
      override prop2 = 'propA2';

      @A1Annotation('A1')
      @A1MethodAnnotation('A1method')
      override fn1(
        @A1Annotation('A1')
        @A1ParameterAnnotation('A1parameter')
        _arg: string,
        @A2ParameterAnnotation('A2parameter')
        _arg2: string,
      ) {}

      @A2Annotation('A2')
      @A2MethodAnnotation('A2method')
      override fn2(
        @A2Annotation('A2')
        @A2ParameterAnnotation('A2parameter')
        _arg: string,
      ) {}

      fnX() {}
    }
    A = _A;
    A_CLASS_ANNOTATIONS = [
      A1Annotation.ref,
      A2Annotation.ref,
      A1ClassAnnotation.ref,
      A2ClassAnnotation.ref,
    ];
    A_PROPERTY_ANNOTATIONS = [
      A1Annotation.ref,
      A1PropertyAnnotation.ref,
      A2Annotation.ref,
      A2PropertyAnnotation.ref,
    ];
    A_METHOD_ANNOTATIONS = [
      A1Annotation.ref,
      A1MethodAnnotation.ref,
      A2Annotation.ref,
      A2MethodAnnotation.ref,
    ];
    A_PARAMETER_ANNOTATIONS = [
      A1Annotation.ref,
      A1ParameterAnnotation.ref,
      A2Annotation.ref,
      A2ParameterAnnotation.ref,
    ];
    A_ANNOTATIONS = [
      ...A_CLASS_ANNOTATIONS,
      ...A_PROPERTY_ANNOTATIONS,
      ...A_METHOD_ANNOTATIONS,
      ...A_PARAMETER_ANNOTATIONS,
    ];

    @B1Annotation('B1')
    @B2Annotation('B2')
    @B1ClassAnnotation('B1class')
    @B2ClassAnnotation('B2class')
    class _B extends B {
      @B1Annotation('B1')
      @B1PropertyAnnotation('B1prop')
      prop1: string = 'propB1';

      @B2Annotation('B2')
      @B2PropertyAnnotation('B2prop')
      prop2: string = 'propB2';

      @B1Annotation('B1')
      @B1MethodAnnotation('B1method')
      fn1(
        @B1Annotation('B1')
        @B1ParameterAnnotation('B1parameter')
        _arg: string,
      ) {}

      @B2Annotation('B2')
      @B2MethodAnnotation('B2method')
      fn2(
        @B2Annotation('B2')
        @B2ParameterAnnotation('B2parameter')
        _arg: string,
      ) {}

      fnX() {}
    }
    B = _B;
    B_CLASS_ANNOTATIONS = [
      B1Annotation.ref,
      B2Annotation.ref,
      B1ClassAnnotation.ref,
      B2ClassAnnotation.ref,
    ];
    B_PROPERTY_ANNOTATIONS = [
      B1Annotation.ref,
      B1PropertyAnnotation.ref,
      B2Annotation.ref,
      B2PropertyAnnotation.ref,
    ];
    B_METHOD_ANNOTATIONS = [
      B1Annotation.ref,
      B1MethodAnnotation.ref,
      B2Annotation.ref,
      B2MethodAnnotation.ref,
    ];
    B_PARAMETER_ANNOTATIONS = [
      B1Annotation.ref,
      B1ParameterAnnotation.ref,
      B2Annotation.ref,
      B2ParameterAnnotation.ref,
    ];
    B_ANNOTATIONS = [
      ...B_CLASS_ANNOTATIONS,
      ...B_PROPERTY_ANNOTATIONS,
      ...B_METHOD_ANNOTATIONS,
      ...B_PARAMETER_ANNOTATIONS,
    ];

    class _X extends X {
      prop!: string;

      fn(_arg: string) {}
    }
    X = _X;
    annotationContextRegistry.select = jest.fn(
      annotationContextRegistry.select,
    );
  }

  beforeEach(setup);

  describe('.select()', () => {
    let s: AnnotationByTargetSelector;
    beforeEach(() => (s = annotationContextRegistry.select()));
    it('returns an AnnotationSelector', () => {
      expect(s).toBeInstanceOf(AnnotationByTargetSelector);
    });

    describe('.all().find()', () => {
      it('returns all annotations found all over the code', () => {
        expect(
          s
            .all()
            .find()
            .map((a) => a.ref),
        ).toEqual(expect.arrayContaining([...A_ANNOTATIONS, ...B_ANNOTATIONS]));
      });
    });

    describe(`.all(SomeClass)`, () => {
      describe('.find()', () => {
        describe(`if "SomeClass" has annotations`, () => {
          it('returns all annotations found within class SomeClass', () => {
            expect(
              s
                .all(A)
                .find()
                .map((a) => a.ref),
            ).toEqual(expect.arrayContaining(A_ANNOTATIONS));
          });
        });
      });

      describe(`if "SomeClass" has no annotation`, () => {
        it('returns empty array', () => {
          expect(s.all(X).find().length).toEqual(0);
        });
      });
    });

    describe(`.onClass()`, () => {
      describe('.find()', () => {
        it('returns all annotations found on all classes', () => {
          expect(
            s
              .onClass()
              .find()
              .map((a) => a.ref),
          ).toEqual(
            expect.arrayContaining([
              ...A_CLASS_ANNOTATIONS,
              ...B_CLASS_ANNOTATIONS,
            ]),
          );
        });
      });
    });

    describe(`.onClass(A)`, () => {
      describe('.find()', () => {
        it('returns all annotations found on class A', () => {
          expect(
            s
              .onClass(A)
              .find()
              .map((a) => a.ref),
          ).toEqual(expect.arrayContaining(A_CLASS_ANNOTATIONS));
        });

        it('returns all annotations with their respective args', () => {
          expect(
            s
              .onClass(A)
              .find()
              .map((a) => a.args),
          ).toEqual(
            expect.arrayContaining([['A1'], ['A2'], ['A1class'], ['A2class']]),
          );
        });
      });
    });

    describe(`.onClass(someClassInstance).find();`, () => {
      describe(`if "someClassInstance" has annotations`, () => {
        it('returns annotations that bound to someClassInstance', () => {
          const a = new A();
          const annotations = s.onClass(a).find();
          expect(annotations.map((a) => a.ref)).toEqual(
            expect.arrayContaining(A_CLASS_ANNOTATIONS),
          );
          expect(annotations.map((a) => a.target.eval())).toEqual(
            expect.arrayContaining(A_CLASS_ANNOTATIONS.map(() => a)),
          );
        });
      });
    });
    describe(`.onMethod()`, () => {
      describe('.find()', () => {
        it('returns all annotations found on all methods', () => {
          expect(
            s
              .onMethod()
              .find()
              .map((a) => a.ref),
          ).toEqual(
            expect.arrayContaining([
              ...A_METHOD_ANNOTATIONS,
              ...B_METHOD_ANNOTATIONS,
            ]),
          );
        });
      });
    });
    describe(`.onMethod(A)`, () => {
      describe('find()', () => {
        describe('if methods on A have annotations', () => {
          it('returns all annotations found methods of class A', () => {
            expect(
              s
                .onMethod(A)
                .find()
                .map((a) => a.ref),
            ).toEqual(expect.arrayContaining(A_METHOD_ANNOTATIONS));
          });
          it('returns all annotations with their respective args', () => {
            expect(
              s
                .onMethod(A)
                .find()
                .map((a) => a.args),
            ).toEqual(
              expect.arrayContaining([
                ['A1'],
                ['A2'],
                ['A1method'],
                ['A2method'],
              ]),
            );
          });
        });
      });
      describe('if methods on A do not have annotations', () => {
        it('returns all annotations found methods of class A', () => {
          expect(s.onMethod(X).find()).toEqual([]);
        });
      });
    });
    describe(`.onMethod(A, 'fn').find()`, () => {
      describe('if "fn" method exists', () => {
        it('returns all annotations found on method "A.fn"', () => {
          expect(
            s
              .onMethod(A as any, 'fn1')
              .find()
              .map((a) => a.ref),
          ).toEqual(
            expect.arrayContaining([A1MethodAnnotation.ref, A1Annotation.ref]),
          );
        });
      });

      describe('if "fn" method does not exist', () => {
        it('returns an empty array', () => {
          expect(s.onMethod(A as any, 'fnX').find()).toEqual([]);
        });
      });
    });
    describe(`.onProperty().find()`, () => {
      it('returns all annotations found on properties', () => {
        expect(
          s
            .onProperty()
            .find()
            .map((a) => a.ref),
        ).toEqual(
          expect.arrayContaining([
            ...A_PROPERTY_ANNOTATIONS,
            ...B_PROPERTY_ANNOTATIONS,
          ]),
        );
      });
    });
    describe(`.onProperty(A).find()`, () => {
      describe('if properties on A have annotations', () => {
        it('returns all annotations found on properties', () => {
          expect(
            s
              .onProperty(A)
              .find()
              .map((a) => a.ref),
          ).toEqual(expect.arrayContaining([...A_PROPERTY_ANNOTATIONS]));
        });
      });

      describe('if properties on A do not have annotations', () => {
        it('returns empty array', () => {
          expect(s.onProperty(X).find()).toEqual([]);
        });
      });
    });
    describe(`.onProperty(classInstance).find()`, () => {
      describe('if properties on classInstance have annotations', () => {
        it('returns annotations bound to classInstance["property"]', () => {
          expect(
            s
              .onProperty(new A())
              .find()
              .map((a) => a.target.eval()),
          ).toEqual(expect.arrayContaining(['propA1', 'propA2']));
        });
      });

      describe('if properties on A do not have annotations', () => {
        it('returns empty array', () => {
          expect(s.onProperty(X).find()).toEqual([]);
        });
      });
    });

    describe(`.onProperty(A, 'prop')`, () => {
      describe('.find()', () => {
        describe('if "prop" property exists', () => {
          it('returns all annotations found on property "A.prop"', () => {
            expect(
              s
                .onProperty(A, 'prop1')
                .find()
                .map((a) => a.ref),
            ).toEqual(
              expect.arrayContaining([
                A1PropertyAnnotation.ref,
                A1Annotation.ref,
              ]),
            );
          });
          it('returns all annotations with their respective args', () => {
            expect(
              s
                .onProperty(A, 'prop1')
                .find()
                .map((a) => a.args),
            ).toEqual(expect.arrayContaining([['A1'], ['A1prop']]));
          });
        });
      });

      describe('if "prop" property does not exist', () => {
        it('returns an empty array', () => {
          expect(s.onProperty(A, 'propX' as any).find()).toEqual([]);
        });
      });
    });
    describe(`.onArgs().find()`, () => {
      it('returns all annotations found on methods arguments', () => {
        expect(
          s
            .onArgs()
            .find()
            .map((a) => a.ref),
        ).toEqual(
          expect.arrayContaining([
            ...A_PARAMETER_ANNOTATIONS,
            ...B_PARAMETER_ANNOTATIONS,
          ]),
        );
      });
    });
    describe(`.onArgs(A).find()`, () => {
      describe('if arguments on A have annotations', () => {
        it('returns all annotations found on any argument of a method of class A', () => {
          expect(
            s
              .onArgs(A)
              .find()
              .map((a) => a.ref),
          ).toEqual(expect.arrayContaining([...A_PARAMETER_ANNOTATIONS]));
        });
      });

      describe('if arguments on A do not have annotations', () => {
        it('returns an empty array', () => {
          expect(s.onArgs(X).find()).toEqual([]);
        });
      });
    });

    describe(`.onArgs(A, 'fn')`, () => {
      describe('.find()', () => {
        describe('if method "fn" exists on class A', () => {
          it('returns all annotations found on any argument of method "A.fn"', () => {
            expect(
              s
                .onArgs(A, 'fn1' as any)
                .find()
                .map((a) => a.ref),
            ).toEqual(
              expect.arrayContaining([
                A1Annotation.ref,
                A1ParameterAnnotation.ref,
              ]),
            );
          });
        });
      });
      describe('if method "fn" does not exist on class A', () => {
        it('returns an empty array', () => {
          expect(s.onArgs(A, 'fnX' as any)).toEqual(expect.arrayContaining([]));
        });
      });
    });
  });

  describe('.select(AAnnotation)', () => {
    let s: AnnotationByTargetSelector;

    describe('.all().find', () => {
      describe('with "AAnnotation" not being used', () => {
        beforeEach(() => (s = annotationContextRegistry.select(XAnnotation)));

        it('returns an empty array', () => {
          expect(s.all().find()).toEqual([]);
        });
      });
    });

    describe('.all().find()', () => {
      beforeEach(() => (s = annotationContextRegistry.select(A1Annotation)));
      describe('if "AAnnotation" is used', () => {
        it('returns all "AAnnotation" annotations found all over the code', () => {
          expect(
            s
              .all()
              .find()
              .map((a) => a.ref),
          ).toEqual(
            expect.arrayContaining(
              A_ANNOTATIONS.filter((a) => a === A1Annotation.ref),
            ),
          );
        });
      });

      describe(`.all(SomeClass).find();`, () => {
        describe(`if "SomeClass" has annotations`, () => {
          it('returns all "AAnnotation" annotations found within class SomeClass', () => {
            expect(
              s
                .all(A)
                .find()
                .map((a) => a.ref),
            ).toEqual(
              expect.arrayContaining(
                A_ANNOTATIONS.filter((a) => a === A1Annotation.ref),
              ),
            );
          });
        });
        describe(`if "SomeClass" has no "AAnnotation" annotation`, () => {
          it('returns empty array', () => {
            expect(s.all(B).find()).toEqual([]);
          });
        });
      });

      // describe(`.all(someClassInstance);`, () => {
      //   describe(`if "SomeClass" has "AAnnotation" annotations`, () => {
      //     it('returns all annotations found within class SomeClass', () => {
      //       expect(s.all(new A()).find().map((a) => a.annotation)).toEqual(
      //         expect.arrayContaining(
      //           A_ANNOTATIONS.filter((a) => a === A1Annotation.ref),
      //         ),
      //       );
      //     });
      //   });
      //   describe(`if "SomeClass" has no "AAnnotation" annotation`, () => {
      //     it('returns empty array', () => {
      //       expect(s.all(new B())).toEqual([]);
      //     });
      //   });
      // });
      describe(`.onMethod().find()`, () => {
        it('returns all "AAnnotation" annotations found on all methods', () => {
          expect(
            s
              .onMethod()
              .find()
              .map((a) => a.ref),
          ).toEqual(
            expect.arrayContaining(
              A_METHOD_ANNOTATIONS.filter((a) => a === A1Annotation.ref),
            ),
          );
        });
      });
      describe(`.onMethod(A).find()`, () => {
        describe('if methods on A have "AAnnotation" annotations', () => {
          it('returns all annotations found methods of class A', () => {
            expect(
              s
                .onMethod(A)
                .find()
                .map((a) => a.ref),
            ).toEqual(
              expect.arrayContaining(
                A_METHOD_ANNOTATIONS.filter((a) => a === A1Annotation.ref),
              ),
            );
          });
        });
        describe('if methods on A do not have "AAnnotation" annotations', () => {
          it('returns all annotations found methods of class A', () => {
            expect(s.onMethod(B).find()).toEqual([]);
          });
        });
      });
      describe(`.onMethod(A, 'fn').find()`, () => {
        describe('if "fn" method exists', () => {
          it('returns all "AAnnotation" annotations found on method "A.fn"', () => {
            expect(
              s
                .onMethod(A as any, 'fn1')
                .find()
                .map((a) => a.ref),
            ).toEqual(expect.arrayContaining([A1Annotation.ref]));
          });
        });

        describe('if "fn" method does not have "AAnnotation" annotations', () => {
          it('returns an empty array', () => {
            expect(s.onMethod(A as any, 'fn2').find()).toEqual([]);
          });
        });
      });
      describe(`.onProperty().find()`, () => {
        it('returns all "AAnnotation" annotations found on properties', () => {
          expect(
            s
              .onProperty()
              .find()
              .map((a) => a.ref),
          ).toEqual(
            expect.arrayContaining(
              A_PROPERTY_ANNOTATIONS.filter((a) => a === A1Annotation.ref),
            ),
          );
        });
      });
      describe(`.onProperty(A).find()`, () => {
        describe('if properties on A have "AAnnotation" annotations', () => {
          it('returns all annotations found on properties', () => {
            expect(
              s
                .onProperty(A)
                .find()
                .map((a) => a.ref),
            ).toEqual(
              expect.arrayContaining(
                A_PROPERTY_ANNOTATIONS.filter((a) => a === A1Annotation.ref),
              ),
            );
          });
        });

        describe('if properties on A do not have "AAnnotation" annotations', () => {
          it('returns empty array', () => {
            expect(s.onProperty(B).find()).toEqual([]);
          });
        });
      });
      describe(`.onProperty(A, 'prop').find()`, () => {
        describe('if "prop" property exists', () => {
          it('returns all "AAnnotation" annotations found on property "A.prop"', () => {
            expect(
              s
                .onProperty(A, 'prop1' as any)
                .find()
                .map((a) => a.ref),
            ).toEqual(expect.arrayContaining([A1Annotation.ref]));
          });
        });

        describe('if "prop" property does not have "AAnnotation" annotation', () => {
          it('returns an empty array', () => {
            expect(s.onProperty(A, 'prop2' as any).find()).toEqual([]);
          });
        });
      });
      describe(`.onArgs().find()`, () => {
        it('returns all "AAnnotation" annotations found on methods arguments', () => {
          expect(
            s
              .onArgs()
              .find()
              .map((a) => a.ref),
          ).toEqual(
            expect.arrayContaining(
              A_PARAMETER_ANNOTATIONS.filter((a) => a === A1Annotation.ref),
            ),
          );
        });
      });
      describe(`.onArgs(A).find()`, () => {
        describe('if arguments on A have "AAnnotation" annotations', () => {
          it('returns all annotations found on any argument of a method of class A', () => {
            expect(
              s
                .onArgs(A)
                .find()
                .map((a) => a.ref),
            ).toEqual(
              expect.arrayContaining(
                A_PARAMETER_ANNOTATIONS.filter((a) => a === A1Annotation.ref),
              ),
            );
          });
        });

        describe('if arguments on A do not have "AAnnotation" annotations', () => {
          it('returns an empty array', () => {
            expect(s.onArgs(B).find()).toEqual([]);
          });
        });
      });

      describe(`.onArgs(A, 'fn').find()`, () => {
        describe('if method "fn" exists on class A', () => {
          it('returns all "AAnnotation" annotations found on any argument of method "A.fn"', () => {
            expect(
              s
                .onArgs(A, 'fn1' as any)
                .find()
                .map((a) => a.ref),
            ).toEqual(expect.arrayContaining([A1Annotation.ref]));
          });
        });
        describe('if method "fn" does not have AAnnotation annotations', () => {
          it('returns an empty array', () => {
            expect(s.onArgs(B, 'fnX' as any)).toEqual(
              expect.arrayContaining([]),
            );
          });
        });
      });
    });
  });

  describe('.select(ref: string)', () => {
    describe('if ref is a represents an existing annotation ref', () => {
      it('returns annotations registered with this ref', () => {
        expect(
          [
            ...annotationContextRegistry
              .select(`${annotationFactory.groupId}:${A1Annotation.name}`)
              .all()
              .find(),
          ].map((a) => a.ref),
        ).toContain(A1Annotation.ref);
      });
    });
  });
  describe('.select(ref: AnnotationRef)', () => {
    describe('if ref is a represents an existing annotation ref', () => {
      it('returns annotations registered with this ref', () => {
        expect(
          [
            ...annotationContextRegistry
              .select({
                groupId: annotationFactory.groupId,
                name: A1Annotation.name,
              })
              .all()
              .find(),
          ].map((a) => a.ref),
        ).toContain(A1Annotation.ref);
      });
    });
  });
});
