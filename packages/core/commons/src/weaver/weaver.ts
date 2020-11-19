import { AspectType } from '../aspect';
import { WeaverProfile } from './profile';
import { AdviceType } from '../advices/types';
import { MutableAdviceContext } from '../advices';

/**
 * A Weaver is some sort of processor that invoke the advices according to the enabled aspects
 * @public
 */
export interface Weaver extends WeaverProfile {
    /**
     * Enable some aspects.
     * @param aspects - the aspects to enable
     */
    enable(...aspects: AspectType[]): this;

    /**
     * Disable some aspects.
     * @param aspects - the aspects to disable
     */
    disable(...aspects: (AspectType | string)[]): this;

    /**
     * Disable all aspects.
     */
    reset(): this;

    enhanceClass<T>(ctxt: MutableAdviceContext<T, AdviceType.CLASS>): new () => T;

    enhanceProperty<T>(ctxt: MutableAdviceContext<T, AdviceType.PROPERTY>): PropertyDescriptor;

    enhanceMethod<T>(ctxt: MutableAdviceContext<T, AdviceType.METHOD>): PropertyDescriptor;

    enhanceParameter<T>(ctxt: MutableAdviceContext<T, AdviceType.METHOD>): PropertyDescriptor;
}
