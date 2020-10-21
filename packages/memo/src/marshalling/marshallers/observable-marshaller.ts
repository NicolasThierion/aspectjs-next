import { MemoFrame } from '../../drivers/memo-frame';
import { MarshalFn, MemoMarshaller, UnmarshalFn } from './marshaller';
import { from, Observable } from 'rxjs';
import { MarshallingContext, UnmarshallingContext } from '../marshalling-context';
import { share, shareReplay } from 'rxjs/operators';

export class ObservableMarshaller extends MemoMarshaller<Observable<any>, any> {
    readonly types = 'Observable';

    marshal(
        frame: MemoFrame<Observable<unknown>>,
        context: MarshallingContext,
        defaultMarshal: MarshalFn,
    ): MemoFrame<Observable<any>> {
        frame.setAsyncValue(
            frame.value
                .pipe(shareReplay(1))
                .toPromise()
                .then((v) => defaultMarshal(v)),
        );
        return frame;
    }

    unmarshal(
        frame: MemoFrame<MemoFrame<any>>,
        context: UnmarshallingContext,
        defaultUnmarshal: UnmarshalFn,
    ): Observable<any> {
        if (frame.isAsync()) {
            return from(frame.async.then((v) => defaultUnmarshal(v))).pipe(share());
        } else {
            return from(Promise.resolve(defaultUnmarshal(frame.value)));
        }
    }
}
