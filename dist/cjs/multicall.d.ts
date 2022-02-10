import { ContractCallContext, ContractCallResults, MulticallOptionsCustomJsonRpcProvider, MulticallOptionsEthers, MulticallOptionsWeb3 } from './models';
export declare class Multicall {
    private _options;
    private readonly ABI;
    private _executionType;
    constructor(_options: MulticallOptionsWeb3 | MulticallOptionsEthers | MulticallOptionsCustomJsonRpcProvider);
    /**
     * Call all the contract calls in 1
     * @param calls The calls
     */
    call(contractCallContexts: ContractCallContext[] | ContractCallContext): Promise<ContractCallResults>;
    /**
     * Get return data from result
     * @param result The result
     */
    private getReturnDataFromResult;
    /**
     * Format return values so its always an array
     * @param decodedReturnValues The decoded return values
     */
    private formatReturnValues;
    /**
     * Build aggregate call context
     * @param contractCallContexts The contract call contexts
     */
    private buildAggregateCallContext;
    /**
     * Find output types from abi
     * @param abi The abi
     * @param methodName The method name
     */
    private findOutputTypesFromAbi;
    /**
     * Execute the multicall contract call
     * @param calls The calls
     */
    private execute;
    /**
     * Execute aggregate with web3 instance
     * @param calls The calls context
     */
    private executeWithWeb3;
    /**
     * Execute with ethers using passed in provider context or custom one
     * @param calls The calls
     */
    private executeWithEthersOrCustom;
    /**
     * Build up the aggregated response from the contract response mapping
     * metadata from the calls
     * @param contractResponse The contract response
     * @param calls The calls
     */
    private buildUpAggregateResponse;
    /**
     * Map call contract to match contract format
     * @param calls The calls context
     */
    private mapCallContextToMatchContractFormat;
    /**
     * Get typed options
     */
    private getTypedOptions;
    /**
     * Get the contract based on the network
     * @param tryAggregate The tryAggregate
     * @param network The network
     */
    private getContractBasedOnNetwork;
}
