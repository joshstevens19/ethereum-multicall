import { CallContext } from './call-context';

export interface CallReturnContext {
  // tslint:disable-next-line: no-any
  returnValue: any;
  callMatchedTo: CallContext;
}
