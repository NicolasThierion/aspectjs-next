import { MemoFrame } from '../../drivers/memo-frame';
import { MemoMarshaller } from './marshaller';

export class BasicMarshaller extends MemoMarshaller<any> {
    readonly types = ['Number', 'String', 'Boolean', 'symbol', 'number', 'string', 'boolean', 'symbol', 'undefined'];

    marshal<T>(frame: MemoFrame<T>): MemoFrame<T> {
        return frame;
    }
    unmarshal<T>(frame: MemoFrame<T>): T {
        return frame.value;
    }
}
