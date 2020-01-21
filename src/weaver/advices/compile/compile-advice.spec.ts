import { Aspect } from '../../types';
import { AdviceType, CompileAdvice } from '../types';
import { Compile } from './compile.decorator';
import { AdviceContext } from '../advice-context';
import { AdviceTarget } from '../../../annotation/target/advice-target';
import { on } from '../pointcut';
import { AClass, AProperty, Labeled, setupWeaver } from '../../../tests/helpers';
import { WeavingError } from '../../weaving-error';

let compileAdvice = jasmine.createSpy('compileAdvice');

describe('@Compile advice', () => {
    let target: AdviceTarget<any, AdviceType>;
    let instance: any;

    describe('applied on a class', () => {
        beforeEach(() => {
            class CompileAspect extends Aspect {
                id = 'AClassLabel';

                @Compile(on.class.annotations(AClass))
                apply(ctxt: AdviceContext<any, AdviceType.CLASS>): any {
                    expect(this).toEqual(jasmine.any(CompileAspect));

                    return compileAdvice(ctxt);
                }
            }

            compileAdvice = jasmine
                .createSpy('compileAdvice', function(ctxt: AdviceContext<any, AdviceType.CLASS>) {
                    target = ctxt.target;
                    instance = (ctxt as any).instance;
                })
                .and.callThrough();

            setupWeaver(new CompileAspect());
        });

        it('should call the aspect upon compilation of annotated class', () => {
            @AClass()
            class A {}
            expect(compileAdvice).toHaveBeenCalled();
        });

        it('should pass annotation target', () => {
            @AClass()
            class A {}
            expect(target).toBeDefined();
            expect(target.proto.constructor.name).toEqual(A.name);
        });

        it('should not pass context instance', () => {
            @AClass()
            class A {}
            expect(instance).toBeUndefined();
        });

        describe('when the advice returns a new constructor', () => {
            let ctor: Function;
            beforeEach(() => {
                ctor = jasmine.createSpy('ctor');
                compileAdvice = jasmine
                    .createSpy('compileAdvice', function(ctxt: AdviceContext<any, AdviceType.CLASS>) {
                        target = ctxt.target;
                        instance = (ctxt as any).instance;

                        return function() {
                            ctor();
                            this.labels = ['replacedCtor'];
                        };
                    })
                    .and.callThrough();
            });
            it('should use the new constructor', () => {
                @AClass()
                class A implements Labeled {
                    labels?: string[];
                }

                const a = new A();
                expect(ctor).toHaveBeenCalled();
                expect(a.labels).toEqual(['replacedCtor']);
            });
        });
    });

    describe('applied on a property', () => {
        beforeEach(() => {
            class CompileAspect extends Aspect {
                id = 'APropertyLabel';

                @Compile(on.property.annotations(AProperty))
                apply(ctxt: AdviceContext<any, AdviceType.PROPERTY>): any {
                    expect(this).toEqual(jasmine.any(CompileAspect));

                    return compileAdvice(ctxt);
                }
            }

            compileAdvice = jasmine
                .createSpy('compileAdvice', function(ctxt: AdviceContext<any, AdviceType.PROPERTY>) {
                    target = ctxt.target;
                    instance = (ctxt as any).instance;
                })
                .and.callThrough();

            setupWeaver(new CompileAspect());
        });

        it('should call the aspect upon compilation of annotated property', () => {
            class A {
                @AProperty()
                labels: string[];
            }
            expect(compileAdvice).toHaveBeenCalled();
        });

        it('should pass advice target', () => {
            class A {
                @AProperty()
                labels: string[];
            }
            expect(target).toBeDefined();
            expect(target.proto.constructor.name).toEqual(A.name);
        });

        it('should not pass context instance', () => {
            class A {
                @AProperty()
                labels: string[];
            }
            expect(instance).toBeUndefined();
        });

        describe('when the advice returns a new property descriptor', () => {
            describe('and the descriptor is invalid', () => {
                beforeEach(() => {
                    compileAdvice = jasmine
                        .createSpy('compileAdvice', function(ctxt: AdviceContext<any, AdviceType.PROPERTY>) {
                            return ({
                                get: '',
                            } as any) as PropertyDescriptor;
                        })
                        .and.callThrough();
                });

                it('should throw an error', () => {
                    expect(() => {
                        class X {
                            @AProperty()
                            labels: string[];
                        }
                    }).toThrow(new TypeError('Getter must be a function: '));
                });
            });

            describe('that sets "value = any"', () => {
                let a: Labeled;
                beforeEach(() => {
                    compileAdvice = jasmine
                        .createSpy('compileAdvice', function(ctxt: AdviceContext<any, AdviceType.PROPERTY>) {
                            return {
                                value: ['propAspect'],
                            };
                        })
                        .and.callThrough();
                    class A implements Labeled {
                        @AProperty()
                        labels?: string[];
                    }
                    a = new A();
                });
                it('should use the new property', () => {
                    expect(a.labels).toEqual(['propAspect']);
                });

                it('should disallow setting the value', () => {
                    expect(() => {
                        a.labels = [];
                    }).toThrow(new Error('Cannot set property labels of #<A> which has only a getter'));
                });
            });

            describe('that sets "get = () => any"', () => {
                let a: Labeled;

                beforeEach(() => {
                    compileAdvice = jasmine
                        .createSpy('compileAdvice', function(ctxt: AdviceContext<any, AdviceType.PROPERTY>) {
                            return {
                                get: () => ['propAspect'],
                            };
                        })
                        .and.callThrough();

                    class A implements Labeled {
                        @AProperty()
                        labels?: string[];
                    }
                    a = new A();
                });
                it('should use the new property', () => {
                    expect(a.labels).toEqual(['propAspect']);
                });

                it('should disallow setting the value', () => {
                    expect(() => {
                        a.labels = [];
                    }).toThrow(new Error('Cannot set property labels of #<A> which has only a getter'));
                });
            });

            describe('that sets "get = () => any" along with set = () => any', () => {
                let a: Labeled;
                beforeEach(() => {
                    compileAdvice = jasmine
                        .createSpy('compileAdvice', function(ctxt: AdviceContext<any, AdviceType.PROPERTY>) {
                            let val = ['propAspect'];
                            return {
                                get: () => val,
                                set: (_val: any) => (val = _val),
                            };
                        })
                        .and.callThrough();

                    class A implements Labeled {
                        @AProperty()
                        labels?: string[];
                    }

                    a = new A();
                });

                it('should allow getting the property', () => {
                    expect(a.labels).toEqual(['propAspect']);
                });

                it('should allow setting the property', () => {
                    a.labels = ['newProp'];
                    expect(a.labels).toEqual(['newProp']);
                });
            });
        });
    });

    describe('applied on a property setter', () => {
        it('should throw an error', () => {
            expect(() => {
                class BadAspect extends Aspect {
                    @Compile(on.property.setter.annotations(AProperty))
                    apply() {}
                }
            }).toThrow(
                new WeavingError(
                    'Advice "@Compile(@AProperty) BadAspect.apply()" cannot be applied on property setter',
                ),
            );
        });
    });
});