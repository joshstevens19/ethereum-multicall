import { Provider } from '@ethersproject/providers';
interface MulticallOptionsBase {
    multicallCustomContractAddress?: string;
    tryAggregate?: boolean;
}
export interface MulticallOptionsWeb3 extends MulticallOptionsBase {
    web3Instance: any;
}
export interface MulticallOptionsEthers extends MulticallOptionsBase {
    ethersProvider: Provider;
}
export interface MulticallOptionsCustomJsonRpcProvider extends MulticallOptionsBase {
    nodeUrl: string;
}
export {};
