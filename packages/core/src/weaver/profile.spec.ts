import { WeaverProfile } from './profile';
import { Aspect } from '../advice/aspect';

describe('WeaverProfile', function () {
    @Aspect('test')
    class TestAspect {}
    const testAspect = new TestAspect();

    describe('method "getAspect"', () => {
        describe('given an aspect id', () => {
            describe('when the corresponding aspect is not enabled', () => {
                it('should return undefined', () => {
                    expect(new WeaverProfile().getAspect('test')).toEqual(undefined);
                });
            });

            describe('when the corresponding aspect is enabled', () => {
                it('should return undefined', () => {
                    expect(new WeaverProfile().enable(testAspect).getAspect('test')).toEqual(testAspect);
                });
            });

            describe('when the corresponding aspect is disabled', () => {
                it('should return undefined', () => {
                    expect(new WeaverProfile().enable(testAspect).disable(testAspect).getAspect('test')).toEqual(
                        undefined,
                    );
                });
            });
        });

        describe('given an aspect class', () => {
            describe('when the corresponding aspect is not enabled', () => {
                it('should return undefined', () => {
                    expect(new WeaverProfile().getAspect(TestAspect)).toEqual(undefined);
                });
            });

            describe('when the corresponding aspect is enabled', () => {
                it('should return undefined', () => {
                    expect(new WeaverProfile().enable(testAspect).getAspect(TestAspect)).toEqual(testAspect);
                });
            });

            describe('when the corresponding aspect is disabled', () => {
                it('should return undefined', () => {
                    expect(new WeaverProfile().enable(testAspect).disable(testAspect).getAspect(TestAspect)).toEqual(
                        undefined,
                    );
                });
            });
        });
    });
});
