import { AdviceType } from '../advice-type.type';
import { AdviceEntry } from './advice-entry.model';
import { JoinpointType } from '../../pointcut/pointcut-target.type';

export type CompileAdviceEntry<
  T extends JoinpointType = JoinpointType,
  X = unknown,
  P extends AdviceType = AdviceType,
> = AdviceEntry<T, X, P> & {
  called: boolean;
};
