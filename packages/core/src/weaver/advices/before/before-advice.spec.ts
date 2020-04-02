import { AdviceContext, BeforeContext } from '../advice-context';
import { Before } from './before.decorator';
import { on } from '../pointcut';
import { AClass, AMethod, AProperty, Labeled, setupWeaver } from '../../../../tests/helpers';
import Spy = jasmine.Spy;
import { Aspect } from '../aspect';
import { AnnotationType } from '../../../annotation/annotation.types';

describe('@Before advice', () => {
    let advice: Spy;

    beforeEach(() => {
        advice = jasmine.createSpy('advice');
    });

    describe('applied on a class', () => {
        const ctor = jasmine.createSpy('ctor');
        let thisInstance: any;

        beforeEach(() => {
            @Aspect('AClassLabel')
            class AAspect {
                @Before(on.class.withAnnotations(AClass))
                applyBefore(ctxt: BeforeContext<any, AnnotationType.CLASS>): void {
                    expect(this).toEqual(jasmine.any(AAspect));
                    thisInstance = ctxt.instance;

                    advice(ctxt);
                }
            }

            setupWeaver(new AAspect());
        });
        it('should call the aspect before the constructor', () => {
            @AClass()
            class A {
                constructor() {
                    ctor();
                }
            }

            new A();
            expect(advice).toHaveBeenCalled();
            expect(ctor).toHaveBeenCalled();
            expect(advice).toHaveBeenCalledBefore(ctor);
        });

        it('should have a "null" context.instance', () => {
            @AClass()
            class A {
                constructor() {}
            }
            new A();

            expect(thisInstance).toBeUndefined();
        });
    });

    describe('applied on a property', () => {
        let a: Labeled;

        beforeEach(() => {
            @Aspect('AClassLabel')
            class AAspect {
                @Before(on.property.withAnnotations(AProperty))
                applyBefore(ctxt: AdviceContext<any, AnnotationType.PROPERTY>): void {
                    expect(this).toEqual(jasmine.any(AAspect));

                    advice(ctxt);
                }
            }

            setupWeaver(new AAspect());

            class A implements Labeled {
                @AProperty()
                labels: string[] = [];
            }

            a = new A();
        });

        it('should call the aspect before the property is get', () => {
            expect(advice).not.toHaveBeenCalled();
            const labels = a.labels;
            expect(advice).toHaveBeenCalled();
        });

        it('should have a non null context.instance', () => {
            let thisInstance: any;
            advice = jasmine
                .createSpy('beforeAdvice', (ctxt: BeforeContext<any, any>) => {
                    thisInstance = ctxt.instance;
                })
                .and.callThrough();
            const labels = a.labels;
            expect(thisInstance).toEqual(a);
        });
    });

    describe('applied on a property setter', () => {
        let a: Labeled;

        beforeEach(() => {
            @Aspect('AClassLabel')
            class AAspect {
                @Before(on.property.setter.withAnnotations(AProperty))
                applyBefore(ctxt: AdviceContext<any, AnnotationType.PROPERTY>): void {
                    expect(this).toEqual(jasmine.any(AAspect));

                    advice(ctxt);
                }
            }

            setupWeaver(new AAspect());

            class A implements Labeled {
                @AProperty()
                labels: string[] = [];
            }

            a = new A();
            advice = jasmine.createSpy('beforeAdvice', (ctxt: BeforeContext<any, any>) => {}).and.callThrough();
        });

        it('should call the aspect before the property is set', () => {
            expect(advice).not.toHaveBeenCalled();
            a.labels = ['set'];
            expect(advice).toHaveBeenCalled();
        });

        it('should have a non null context.instance', () => {
            let thisInstance: any;
            advice = jasmine
                .createSpy('beforeAdvice', (ctxt: BeforeContext<any, any>) => {
                    thisInstance = ctxt.instance;
                })
                .and.callThrough();
            a.labels = [];
            expect(thisInstance).toEqual(a);
        });
    });

    describe('applied on a method', () => {
        let a: any;

        beforeEach(() => {
            @Aspect('AClassLabel')
            class AAspect {
                @Before(on.method.withAnnotations(AMethod))
                applyBefore(ctxt: AdviceContext<any, AnnotationType.METHOD>): void {
                    expect(this).toEqual(jasmine.any(AAspect));

                    advice(ctxt);
                }
            }

            setupWeaver(new AAspect());

            class A {
                @AMethod()
                addLabel(): any {}
            }

            a = new A();
            advice = jasmine
                .createSpy('beforeAdvice', (ctxt: BeforeContext<any, AnnotationType.METHOD>) => {})
                .and.callThrough();
        });

        it('should call the aspect before the method is called', () => {
            expect(advice).not.toHaveBeenCalled();
            a.addLabel();
            expect(advice).toHaveBeenCalled();
        });

        it('should have a non null context.instance', () => {
            let thisInstance: any;
            advice = jasmine
                .createSpy('beforeAdvice', (ctxt: BeforeContext<any, any>) => {
                    thisInstance = ctxt.instance;
                })
                .and.callThrough();
            a.addLabel();
            expect(thisInstance).toEqual(a);
        });
    });

    xdescribe('applied on a method parameter', () => {
        it('should call the aspect before the method is called', () => {});

        it('should have a non null context.instance', () => {});
    });
});
