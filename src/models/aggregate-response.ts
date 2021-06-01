export interface AggregateResponse {
  blockNumber: number;
  results: Array<{
    contractContextIndex: number;
    methodResults: Array<{
      contractMethodIndex: number;
      // tslint:disable-next-line: no-any
      result: any;
    }>;
  }>;
}
