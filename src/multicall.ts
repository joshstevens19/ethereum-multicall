import { ethers } from 'ethers';
import { defaultAbiCoder } from 'ethers/lib/utils';
import { ExecutionType, Networks } from './enums';
import {
  AggregateResponse,
  CallContext,
  CallReturnContext,
  MulticallOptionsCustomJsonRpcProvider,
  MulticallOptionsEthers,
  MulticallOptionsWeb3,
} from './models';

export class Multicall {
  private readonly ABI = [
    {
      constant: false,
      inputs: [
        {
          components: [
            { name: 'target', type: 'address' },
            { name: 'callData', type: 'bytes' },
          ],
          name: 'calls',
          type: 'tuple[]',
        },
      ],
      name: 'aggregate',
      outputs: [
        { name: 'blockNumber', type: 'uint256' },
        { name: 'returnData', type: 'bytes[]' },
      ],
      payable: false,
      stateMutability: 'nonpayable',
      type: 'function',
    },
  ];

  private _executionType: ExecutionType;

  constructor(
    private _options:
      | MulticallOptionsWeb3
      | MulticallOptionsEthers
      | MulticallOptionsCustomJsonRpcProvider
  ) {
    if ((this._options as MulticallOptionsWeb3).web3Instance) {
      this._executionType = ExecutionType.web3;
    }

    if ((this._options as MulticallOptionsEthers).ethersSignerOrProvider) {
      this._executionType = ExecutionType.ethers;
    }

    if ((this._options as MulticallOptionsCustomJsonRpcProvider).nodeUrl) {
      this._executionType = ExecutionType.customHttp;
    }

    throw new Error(
      // tslint:disable-next-line: max-line-length
      'Your options passed in our incorrect they need to match either `MulticallOptionsEthers`, `MulticallOptionsWeb3` or `MulticallOptionsCustomJsonRpcProvider` interfaces'
    );
  }

  /**
   * Call all the contract calls in 1
   * @param calls The calls
   */
  public async call(
    calls: CallContext[]
  ): Promise<{ [key: string]: CallReturnContext }> {
    const result = await this.execute(calls);

    const returnObject: { [key: string]: CallReturnContext } = {};

    for (let i = 0; i < result.returnData.length; i++) {
      const callMatch = calls[i];
      if (callMatch.outputTypes) {
        returnObject[callMatch.reference] = {
          returnValue: defaultAbiCoder.decode(
            callMatch.outputTypes,
            result.returnData[i]
          ),
          callMatchedTo: calls[i],
        };
      } else {
        returnObject[callMatch.reference] = {
          returnValue: result.returnData[i],
          callMatchedTo: calls[i],
        };
      }
    }

    return returnObject;
  }

  /**
   * Execute the multicall contract call
   * @param calls The calls
   */
  private async execute(calls: CallContext[]): Promise<AggregateResponse> {
    switch (this._executionType) {
      case ExecutionType.web3:
        return await this.executeWithWeb3(calls);
      case ExecutionType.ethers:
      case ExecutionType.customHttp:
        return await this.executeWithEthersOrCustom(calls);
      default:
        throw new Error(`${this._executionType} is not defined`);
    }
  }

  /**
   * Execute aggregate with web3 instance
   * @param calls The calls context
   */
  private async executeWithWeb3(
    calls: CallContext[]
  ): Promise<AggregateResponse> {
    const web3 = this.getTypedOptions<MulticallOptionsWeb3>().web3Instance;
    const contract = web3.eth.Contract(
      this.ABI,
      this.getContractBasedOnNetwork(web3.eth.net.getId)
    );

    return (await contract.methods
      .aggregate(this.mapCallContextToMatchContractFormat(calls))
      .call()) as AggregateResponse;
  }

  /**
   * Execute with ethers using passed in provider context or custom one
   * @param calls The calls
   */
  private async executeWithEthersOrCustom(
    calls: CallContext[]
  ): Promise<AggregateResponse> {
    let ethersSignerOrProvider = this.getTypedOptions<MulticallOptionsEthers>()
      .ethersSignerOrProvider;

    if (!ethersSignerOrProvider) {
      const customProvider = this.getTypedOptions<
        MulticallOptionsCustomJsonRpcProvider
      >();
      if (customProvider.nodeUrl) {
        ethersSignerOrProvider = new ethers.providers.JsonRpcProvider(
          customProvider.nodeUrl
        );
      } else {
        ethersSignerOrProvider = ethers.getDefaultProvider();
      }
    }

    const network = await this.getEthersNetworkId(ethersSignerOrProvider);

    const contract = new ethers.Contract(
      this.getContractBasedOnNetwork(network),
      this.ABI,
      ethersSignerOrProvider
    );

    return (await contract.aggregate(
      this.mapCallContextToMatchContractFormat(calls)
    )) as AggregateResponse;
  }

  /**
   * Map call contract to match contract format
   * @param calls The calls context
   */
  private mapCallContextToMatchContractFormat(
    calls: CallContext[]
  ): Array<{
    target: string;
    callData: string;
  }> {
    return calls.map((call) => {
      return {
        target: call.contractTarget,
        callData: call.callData,
      };
    });
  }

  /**
   * Get ethers network id
   * @param ethersSignerOrProvider Ethers signer or provider
   */
  private async getEthersNetworkId(
    ethersSignerOrProvider: ethers.Signer | ethers.providers.Provider
  ): Promise<Networks> {
    if ((ethersSignerOrProvider as ethers.Signer)._isSigner) {
      const signer = ethersSignerOrProvider as ethers.Signer;
      if (!signer.provider) {
        throw new Error('Your ethers signer MUST have a provider defined');
      }

      return (await signer.provider.getNetwork()).chainId;
    } else {
      return (
        await (ethersSignerOrProvider as ethers.providers.Provider).getNetwork()
      ).chainId;
    }
  }

  /**
   * Get typed options
   */
  private getTypedOptions<T>(): T {
    return (this._options as unknown) as T;
  }

  /**
   * Get the contract based on the network
   * @param network The network
   */
  private getContractBasedOnNetwork(network: Networks): string {
    // if they have overriden the multicall custom contract address then use that
    if (this._options.multicallCustomContractAddress) {
      return this._options.multicallCustomContractAddress;
    }

    switch (network) {
      case Networks.mainnet:
        return '0xeefba1e63905ef1d7acba5a8513c70307c1ce441';
      case Networks.kovan:
        return '0x2cc8688c5f75e365aaeeb4ea8d6a480405a48d2a';
      case Networks.rinkeby:
        return '0x42ad527de7d4e9d9d011ac45b31d8551f8fe9821';
      case Networks.ropsten:
        return '0x53c43764255c17bd724f74c4ef150724ac50a3ed';
      default:
        throw new Error(
          `Network - ${network} is not got a contract defined it only supports mainnet, kovan, rinkeby and ropsten`
        );
    }
  }
}
