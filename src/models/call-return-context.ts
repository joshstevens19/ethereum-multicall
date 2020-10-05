import { CallContext } from './call-context';

export interface CallReturnContext extends CallContext {
  returnValues: Result;
  /**
   * This stats if it could decode the result or not
   */
  decoded: boolean;
}

// tslint:disable-next-line: no-any
export interface Result extends ReadonlyArray<any> {
  // tslint:disable-next-line: no-any
  readonly [key: string]: any;
}
