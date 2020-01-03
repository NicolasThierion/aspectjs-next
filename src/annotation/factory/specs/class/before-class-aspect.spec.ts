import { Aspect, AspectHooks } from '../../../../weaver/types';
import { AClass } from '../../../../tests/a';
import { AnnotationContext } from '../../../context/context';
import { WeavingError } from '../../../../weaver/weaving-error';
import { Weaver } from '../../../../weaver/load-time/load-time-weaver';
import { ClassAnnotation, setWeaver } from '../../../../index';
import { AnnotationAdviceContext } from '../../../../weaver/annotation-advice-context';

function setupWeaver(...aspects: Aspect[]) {
    const weaver = new Weaver().enable(...aspects);
    setWeaver(weaver);
    weaver.load();
}

describe('given a class configured with some class-annotation aspect', () => {
    describe('that leverage "before" pointcut', () => {
        const advice = jest.fn();
        const ctor = jest.fn();
        beforeEach(() => {
            class AAspect extends Aspect {
                name = 'AClassLabel';

                apply(hooks: AspectHooks): void {
                    hooks.annotations(AClass).class.before(advice);
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

        describe('and the aspect requires "this"', () => {
            beforeEach(() => {
                class AAspect extends Aspect {
                    name = 'AClassLabel';

                    apply(hooks: AspectHooks): void {
                        hooks
                            .annotations(AClass)
                            .class.before((ctxt: AnnotationAdviceContext<unknown, ClassAnnotation>) => {
                                console.log(ctxt.instance.get());
                            });
                    }
                }

                setupWeaver(new AAspect());
            });
            it('should throw an error', () => {
                expect(() => {
                    @AClass()
                    class A {
                        constructor() {}
                    }

                    new A();
                }).toThrow(new WeavingError('Cannot get "this" instance before constructor joinpoint has been called'));
            });
        });
    });
});
