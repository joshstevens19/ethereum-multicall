export interface AggregateResponse {
    blockNumber: number;
    results: Array<{
        contractContextIndex: number;
        methodResults: Array<{
            contractMethodIndex: number;
            result: any;
        }>;
    }>;
}
