export interface AggregateResponse {
  blockNumber: string;
  results: Array<{
    contractContextIndex: number;
    methodResults: Array<{
      // tslint:disable-next-line: no-any
      returnData: any;
      contractMethodIndex: number;
    }>;
  }>;
}
