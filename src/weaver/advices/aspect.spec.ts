import { Before } from './before/before.decorator';
import { on } from './pointcut';
import { AClass } from '../../tests/a';
import { AfterContext, AfterReturnContext, AfterThrowContext, AroundContext, BeforeContext } from './advice-context';
import { AProperty, Labeled, setupWeaver } from '../../tests/helpers';
import { Around } from './around/around.decorator';
import { After } from './after/after.decorator';
import { AfterReturn } from './after-return/after-return.decorator';
import { AfterThrow } from './after-throw/after-throw.decorator';
import { AnnotationType } from '../..';
import { Aspect } from './aspect';

describe('given several aspects', () => {
    let labels: string[];

    beforeEach(() => {
        labels = [];
        setupWeaver(new LabelAspect('A'));
    });

    @Aspect()
    class LabelAspect {
        constructor(public id: string) {}

        @Before(on.class.annotations(AClass))
        beforeClass(ctxt: BeforeContext<Labeled, AnnotationType.CLASS>) {
            labels.push(`${this.id}_beforeClass`);
        }

        @Around(on.class.annotations(AClass))
        aroundClass(ctxt: AroundContext<Labeled, AnnotationType.CLASS>) {
            labels.push(`${this.id}_AroundClass`);
            return ctxt.joinpoint();
        }

        @After(on.class.annotations(AClass))
        afterClass(ctxt: AfterContext<Labeled, AnnotationType.CLASS>) {
            labels.push(`${this.id}_AfterClass`);
        }

        @AfterReturn(on.class.annotations(AClass))
        afterReturnClass(ctxt: AfterReturnContext<Labeled, AnnotationType.CLASS>) {
            labels.push(`${this.id}_AfterReturnClass`);
            return ctxt.value;
        }

        @AfterThrow(on.class.annotations(AClass))
        afterThrowClass(ctxt: AfterThrowContext<Labeled, AnnotationType.CLASS>) {
            labels.push(`${this.id}_AfterThrowClass`);
            throw ctxt.error;
        }

        @Before(on.property.annotations(AProperty))
        beforeProperty(ctxt: BeforeContext<Labeled, AnnotationType.PROPERTY>) {
            labels.push(`${this.id}_beforeProperty`);
        }

        @Around(on.property.annotations(AProperty))
        aroundProperty(ctxt: AroundContext<Labeled, AnnotationType.PROPERTY>) {
            labels.push(`${this.id}_AroundProperty`);
            return ctxt.joinpoint();
        }

        @After(on.property.annotations(AProperty))
        afterProperty(ctxt: AfterContext<Labeled, AnnotationType.PROPERTY>) {
            labels.push(`${this.id}_AfterProperty`);
        }

        @AfterReturn(on.property.annotations(AProperty))
        afterReturnProperty(ctxt: AfterReturnContext<Labeled, AnnotationType.PROPERTY>) {
            labels.push(`${this.id}_AfterReturnProperty`);
            return ctxt.value;
        }

        @AfterThrow(on.property.annotations(AProperty))
        afterThrowProperty(ctxt: AfterThrowContext<Labeled, AnnotationType.PROPERTY>) {
            labels.push(`${this.id}_AfterThrowProperty`);
            throw ctxt.error;
        }

        @Before(on.property.setter.annotations(AProperty))
        beforePropertySet(ctxt: BeforeContext<Labeled, AnnotationType.PROPERTY>) {
            labels.push(`${this.id}_beforeProperty`);
        }

        @Around(on.property.setter.annotations(AProperty))
        aroundPropertySet(ctxt: AroundContext<Labeled, AnnotationType.PROPERTY>) {
            labels.push(`${this.id}_AroundProperty`);
            return ctxt.joinpoint();
        }

        @After(on.property.setter.annotations(AProperty))
        afterPropertySet(ctxt: AfterContext<Labeled, AnnotationType.PROPERTY>) {
            labels.push(`${this.id}_AfterProperty`);
        }

        @AfterReturn(on.property.setter.annotations(AProperty))
        afterReturnPropertySet(ctxt: AfterReturnContext<Labeled, AnnotationType.PROPERTY>) {
            labels.push(`${this.id}_AfterReturnProperty`);
        }

        @AfterThrow(on.property.setter.annotations(AProperty))
        afterThrowPropertySet(ctxt: AfterThrowContext<Labeled, AnnotationType.PROPERTY>) {
            labels.push(`${this.id}_AfterThrowProperty`);
            throw ctxt.error;
        }
    }

    describe('constructing a class instance', () => {
        let A: any;

        beforeEach(() => {
            // eslint-disable-next-line @typescript-eslint/class-name-casing
            class A_ {}

            A = A_;
        });

        it('should advices across all aspects in order', () => {
            expect(labels).toEqual([]);
            const a = new A();
        });
    });
});