import { BigNumber, ethers } from 'ethers';
import { defaultAbiCoder } from 'ethers/lib/utils';
import { ExecutionType, Networks } from './enums';
import {
  AbiItem,
  AbiOutput,
  AggregateCallContext,
  AggregateContractResponse,
  AggregateResponse,
  CallReturnContext,
  ContractCallContext,
  ContractCallResults,
  ContractCallReturnContext,
  MulticallOptionsCustomJsonRpcProvider,
  MulticallOptionsEthers,
  MulticallOptionsWeb3,
} from './models';
import { Utils } from './utils';

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
    {
      inputs: [
        {
          internalType: 'bool',
          name: 'requireSuccess',
          type: 'bool',
        },
        {
          components: [
            {
              internalType: 'address',
              name: 'target',
              type: 'address',
            },
            {
              internalType: 'bytes',
              name: 'callData',
              type: 'bytes',
            },
          ],
          internalType: 'struct Multicall2.Call[]',
          name: 'calls',
          type: 'tuple[]',
        },
      ],
      name: 'tryBlockAndAggregate',
      outputs: [
        {
          internalType: 'uint256',
          name: 'blockNumber',
          type: 'uint256',
        },
        {
          internalType: 'bytes32',
          name: 'blockHash',
          type: 'bytes32',
        },
        {
          components: [
            {
              internalType: 'bool',
              name: 'success',
              type: 'bool',
            },
            {
              internalType: 'bytes',
              name: 'returnData',
              type: 'bytes',
            },
          ],
          internalType: 'struct Multicall2.Result[]',
          name: 'returnData',
          type: 'tuple[]',
        },
      ],
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
      return;
    }

    if ((this._options as MulticallOptionsEthers).ethersProvider) {
      this._executionType = ExecutionType.ethers;
      return;
    }

    if ((this._options as MulticallOptionsCustomJsonRpcProvider).nodeUrl) {
      this._executionType = ExecutionType.customHttp;
      return;
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
    contractCallContexts: ContractCallContext[] | ContractCallContext
  ): Promise<ContractCallResults> {
    if (!Array.isArray(contractCallContexts)) {
      contractCallContexts = [contractCallContexts];
    }

    const aggregateResponse = await this.execute(
      this.buildAggregateCallContext(contractCallContexts)
    );

    const returnObject: ContractCallResults = {
      results: {},
      blockNumber: aggregateResponse.blockNumber,
    };

    for (
      let response = 0;
      response < aggregateResponse.results.length;
      response++
    ) {
      const contractCallsResults = aggregateResponse.results[response];
      const originalContractCallContext =
        contractCallContexts[contractCallsResults.contractContextIndex];

      const returnObjectResult: ContractCallReturnContext = {
        originalContractCallContext: Utils.deepClone(
          originalContractCallContext
        ),
        callsReturnContext: [],
      };

      for (
        let method = 0;
        method < contractCallsResults.methodResults.length;
        method++
      ) {
        const methodContext = contractCallsResults.methodResults[method];
        const originalContractCallMethodContext =
          originalContractCallContext.calls[methodContext.contractMethodIndex];

        const outputTypes = this.findOutputTypesFromAbi(
          originalContractCallContext.abi,
          originalContractCallMethodContext.methodName
        );

        if (this._options.tryAggregate && !methodContext.result.success) {
          returnObjectResult.callsReturnContext.push(
            Utils.deepClone<CallReturnContext>({
              returnValues: [],
              decoded: false,
              reference: originalContractCallMethodContext.reference,
              methodName: originalContractCallMethodContext.methodName,
              methodParameters:
                originalContractCallMethodContext.methodParameters,
              success: false,
            })
          );
          continue;
        }

        if (outputTypes && outputTypes.length > 0) {
          const decodedReturnValues = defaultAbiCoder.decode(
            // tslint:disable-next-line: no-any
            outputTypes as any,
            this.getReturnDataFromResult(methodContext.result)
          );

          returnObjectResult.callsReturnContext.push(
            Utils.deepClone<CallReturnContext>({
              returnValues: this.formatReturnValues(decodedReturnValues),
              decoded: true,
              reference: originalContractCallMethodContext.reference,
              methodName: originalContractCallMethodContext.methodName,
              methodParameters:
                originalContractCallMethodContext.methodParameters,
              success: true,
            })
          );
        } else {
          returnObjectResult.callsReturnContext.push(
            Utils.deepClone<CallReturnContext>({
              returnValues: this.getReturnDataFromResult(methodContext.result),
              decoded: false,
              reference: originalContractCallMethodContext.reference,
              methodName: originalContractCallMethodContext.methodName,
              methodParameters:
                originalContractCallMethodContext.methodParameters,
              success: true,
            })
          );
        }
      }

      returnObject.results[
        returnObjectResult.originalContractCallContext.reference
      ] = returnObjectResult;
    }

    return returnObject;
  }

  /**
   * Get return data from result
   * @param result The result
   */
  // tslint:disable-next-line: no-any
  private getReturnDataFromResult(result: any): any[] {
    if (this._options.tryAggregate) {
      return result.returnData;
    }

    return result;
  }

  /**
   * Format return values so its always an array
   * @param decodedReturnValues The decoded return values
   */
  // tslint:disable-next-line: no-any
  private formatReturnValues(decodedReturnValues: any): any[] {
    let decodedReturnResults = decodedReturnValues;
    if (decodedReturnValues.length === 1) {
      decodedReturnResults = decodedReturnValues[0];
    }

    if (Array.isArray(decodedReturnResults)) {
      return decodedReturnResults;
    }

    return [decodedReturnResults];
  }

  /**
   * Build aggregate call context
   * @param contractCallContexts The contract call contexts
   */
  private buildAggregateCallContext(
    contractCallContexts: ContractCallContext[]
  ): AggregateCallContext[] {
    const aggregateCallContext: AggregateCallContext[] = [];

    for (let contract = 0; contract < contractCallContexts.length; contract++) {
      const contractContext = contractCallContexts[contract];
      const executingInterface = new ethers.utils.Interface(
        JSON.stringify(contractContext.abi)
      );

      for (let method = 0; method < contractContext.calls.length; method++) {
        // https://github.com/ethers-io/ethers.js/issues/211
        const methodContext = contractContext.calls[method];
        // tslint:disable-next-line: no-unused-expression
        const encodedData = executingInterface.encodeFunctionData(
          methodContext.methodName,
          methodContext.methodParameters
        );

        aggregateCallContext.push({
          contractContextIndex: Utils.deepClone<number>(contract),
          contractMethodIndex: Utils.deepClone<number>(method),
          target: contractContext.contractAddress,
          encodedData,
        });
      }
    }

    return aggregateCallContext;
  }

  /**
   * Find output types from abi
   * @param abi The abi
   * @param methodName The method name
   */
  private findOutputTypesFromAbi(
    abi: AbiItem[],
    methodName: string
  ): AbiOutput[] | undefined {
    for (let i = 0; i < abi.length; i++) {
      if (abi[i].name?.trim() === methodName.trim()) {
        return abi[i].outputs;
      }
    }

    return undefined;
  }

  /**
   * Execute the multicall contract call
   * @param calls The calls
   */
  private async execute(
    calls: AggregateCallContext[]
  ): Promise<AggregateResponse> {
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
    calls: AggregateCallContext[]
  ): Promise<AggregateResponse> {
    const web3 = this.getTypedOptions<MulticallOptionsWeb3>().web3Instance;
    const networkId = await web3.eth.net.getId();
    const contract = new web3.eth.Contract(
      this.ABI,
      this.getContractBasedOnNetwork(networkId)
    );

    if (this._options.tryAggregate) {
      const contractResponse = (await contract.methods
        .tryBlockAndAggregate(
          false,
          this.mapCallContextToMatchContractFormat(calls)
        )
        .call()) as AggregateContractResponse;

      contractResponse.blockNumber = BigNumber.from(
        contractResponse.blockNumber
      );

      return this.buildUpAggregateResponse(contractResponse, calls);
    } else {
      const contractResponse = (await contract.methods
        .aggregate(this.mapCallContextToMatchContractFormat(calls))
        .call()) as AggregateContractResponse;

      contractResponse.blockNumber = BigNumber.from(
        contractResponse.blockNumber
      );

      return this.buildUpAggregateResponse(contractResponse, calls);
    }
  }

  /**
   * Execute with ethers using passed in provider context or custom one
   * @param calls The calls
   */
  private async executeWithEthersOrCustom(
    calls: AggregateCallContext[]
  ): Promise<AggregateResponse> {
    let ethersProvider = this.getTypedOptions<MulticallOptionsEthers>()
      .ethersProvider;

    if (!ethersProvider) {
      const customProvider = this.getTypedOptions<
        MulticallOptionsCustomJsonRpcProvider
      >();
      if (customProvider.nodeUrl) {
        ethersProvider = new ethers.providers.JsonRpcProvider(
          customProvider.nodeUrl
        );
      } else {
        ethersProvider = ethers.getDefaultProvider();
      }
    }

    const network = await ethersProvider.getNetwork();

    const contract = new ethers.Contract(
      this.getContractBasedOnNetwork(network.chainId),
      this.ABI,
      ethersProvider
    );

    if (this._options.tryAggregate) {
      const contractResponse = (await contract.callStatic.tryBlockAndAggregate(
        false,
        this.mapCallContextToMatchContractFormat(calls)
      )) as AggregateContractResponse;

      return this.buildUpAggregateResponse(contractResponse, calls);
    } else {
      const contractResponse = (await contract.callStatic.aggregate(
        this.mapCallContextToMatchContractFormat(calls)
      )) as AggregateContractResponse;

      return this.buildUpAggregateResponse(contractResponse, calls);
    }
  }

  /**
   * Build up the aggregated response from the contract response mapping
   * metadata from the calls
   * @param contractResponse The contract response
   * @param calls The calls
   */
  private buildUpAggregateResponse(
    contractResponse: AggregateContractResponse,
    calls: AggregateCallContext[]
  ): AggregateResponse {
    const aggregateResponse: AggregateResponse = {
      blockNumber: contractResponse.blockNumber.toNumber(),
      results: [],
    };

    for (let i = 0; i < contractResponse.returnData.length; i++) {
      const existingResponse = aggregateResponse.results.find(
        (c) => c.contractContextIndex === calls[i].contractContextIndex
      );
      if (existingResponse) {
        existingResponse.methodResults.push({
          result: contractResponse.returnData[i],
          contractMethodIndex: calls[i].contractMethodIndex,
        });
      } else {
        aggregateResponse.results.push({
          methodResults: [
            {
              result: contractResponse.returnData[i],
              contractMethodIndex: calls[i].contractMethodIndex,
            },
          ],
          contractContextIndex: calls[i].contractContextIndex,
        });
      }
    }

    return aggregateResponse;
  }

  /**
   * Map call contract to match contract format
   * @param calls The calls context
   */
  private mapCallContextToMatchContractFormat(
    calls: AggregateCallContext[]
  ): Array<{
    target: string;
    callData: string;
  }> {
    return calls.map((call) => {
      return {
        target: call.target,
        callData: call.encodedData,
      };
    });
  }

  /**
   * Get typed options
   */
  private getTypedOptions<T>(): T {
    return (this._options as unknown) as T;
  }

  /**
   * Get the contract based on the network
   * @param tryAggregate The tryAggregate
   * @param network The network
   */
  private getContractBasedOnNetwork(network: Networks): string {
    // if they have overriden the multicall custom contract address then use that
    if (this._options.multicallCustomContractAddress) {
      return this._options.multicallCustomContractAddress;
    }

    switch (network) {
      case Networks.mainnet:
      case Networks.kovan:
      case Networks.rinkeby:
      case Networks.ropsten:
      case Networks.goerli:
        return '0x5BA1e12693Dc8F9c48aAD8770482f4739bEeD696';
      case Networks.bsc:
        return '0xC50F4c1E81c873B2204D7eFf7069Ffec6Fbe136D';
      case Networks.bsc_testnet:
        return '0x6e5BB1a5Ad6F68A8D7D6A5e47750eC15773d6042';
      case Networks.xdai:
        return '0x2325b72990D81892E0e09cdE5C80DD221F147F8B';
      case Networks.mumbai:
        return '0xe9939e7Ea7D7fb619Ac57f648Da7B1D425832631';
      case Networks.matic:
        return '0x275617327c958bD06b5D6b871E7f491D76113dd8';
      case Networks.etherlite:
        return '0x21681750D7ddCB8d1240eD47338dC984f94AF2aC';
      case Networks.arbitrum:
        return '0x80C7DD17B01855a6D2347444a0FCC36136a314de';
      case Networks.avalauncheFuji:
        return '0x3D015943d2780fE97FE3f69C97edA2CCC094f78c';
      case Networks.avalauncheMainnet:
        return '0xed386Fe855C1EFf2f843B910923Dd8846E45C5A4';
      default:
        throw new Error(
          `Network - ${network} is not got a contract defined it only supports mainnet, kovan, rinkeby, bsc and ropsten`
        );
    }
  }
}
