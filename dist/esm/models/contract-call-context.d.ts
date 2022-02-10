import { CallContext } from './call-context';
export interface ContractCallContext<TContext = any> {
    /**
     * Reference to this contract call context
     */
    reference: string;
    /**
     * The contract address
     */
    contractAddress: string;
    /**
     * The abi for the contract
     */
    abi: any[];
    /**
     * All the calls you want to do for this contract
     */
    calls: CallContext[];
    /**
     * Store any context or state in here so you don't need
     * to look back over arrays once you got the result back.
     */
    context?: TContext | undefined;
}
