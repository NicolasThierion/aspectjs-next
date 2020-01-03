import { AfterReturnAdvice, Aspect, AspectHooks } from '../../../../weaver/types';
import { AClass } from '../../../../tests/a';
import { Weaver } from '../../../../weaver/load-time/load-time-weaver';
import { ClassAnnotation, setWeaver } from '../../../../index';
import { AnnotationAdviceContext } from '../../../../weaver/annotation-advice-context';

interface Labeled {
    labels?: string[];
}

function setupWeaver(...aspects: Aspect[]): void {
    const weaver = new Weaver().enable(...aspects);
    setWeaver(weaver);
    weaver.load();
}

let afterReturn: AfterReturnAdvice<any> = (ctxt, retVal) => {
    throw new Error('should configure afterThrowAdvice');
};

describe('given a class configured with some class-annotation aspect', () => {
    describe('that leverage "afterReturn" pointcut', () => {
        beforeEach(() => {
            class AfterReturnAspect extends Aspect {
                name = 'AClassLabel';

                apply(hooks: AspectHooks): void {
                    hooks.annotations(AClass).class.afterReturn((ctxt, retVal) => afterReturn(ctxt, retVal));
                }
            }

            afterReturn = jest.fn().mockImplementation(function(ctxt) {
                ctxt.instance.labels = ctxt.instance.get().labels ?? [];
                ctxt.instance.labels.push('AClass');
            });

            setupWeaver(new AfterReturnAspect());
        });

        describe('creating an instance of this class', () => {
            describe('with a constructor that throws', () => {
                it('should not call the aspect', () => {
                    @AClass()
                    class A implements Labeled {
                        constructor(label: string) {
                            throw new Error('expected');
                        }
                    }

                    expect(() => {
                        new A('ctor');
                    }).toThrow();
                    expect(afterReturn).not.toHaveBeenCalled();
                });
            });

            describe('with a constructor that do not throws', () => {
                it('should call the aspect', () => {
                    @AClass()
                    class A implements Labeled {
                        public labels: string[];
                        constructor(label: string) {
                            this.labels = [label];
                        }
                    }

                    const labels = new A('ctor').labels;
                    expect(afterReturn).toHaveBeenCalled();
                    expect(labels).toEqual(['ctor', 'AClass']);
                });

                describe('and the aspect returns a new value', () => {
                    beforeEach(() => {
                        afterReturn = (ctxt: AnnotationAdviceContext<Labeled, ClassAnnotation>) => {
                            return Object.assign(Object.create(ctxt.annotation.target.proto), {
                                labels: ['ABis'],
                            });
                        };
                        afterReturn = jest.fn().mockImplementation(afterReturn);
                    });

                    it('should assign "this" instance to the returned value', () => {
                        @AClass()
                        class A implements Labeled {
                            public labels: string[];
                            constructor(label: string) {
                                this.labels = [label];
                            }
                        }
                        const a = new A('test');
                        expect(a.labels).toEqual(['ABis']);
                    });
                });
            });
        });
    });
});
