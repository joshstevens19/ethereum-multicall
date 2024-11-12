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
  ContractCallOptions,
  ContractCallResults,
  ContractCallReturnContext,
  MulticallOptionsCustomJsonRpcProvider,
  MulticallOptionsEthers,
  MulticallOptionsWeb3,
} from './models';
import { Utils } from './utils';

export class Multicall {
  // exposed as public as people can decide to use this outside multicall.call
  public static ABI = [
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
    contractCallContexts: ContractCallContext[] | ContractCallContext,
    contractCallOptions: ContractCallOptions = {}
  ): Promise<ContractCallResults> {
    if (!Array.isArray(contractCallContexts)) {
      contractCallContexts = [contractCallContexts];
    }

    const aggregateResponse = await this.execute(
      this.buildAggregateCallContext(contractCallContexts),
      contractCallOptions
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
          try {
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
          } catch (e) {
            if (!this._options.tryAggregate) {
              throw e;
            }
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
          }
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
    const contract = new ethers.Contract(
      ethers.constants.AddressZero,
      abi as any
    );
    methodName = methodName.trim();
    if (contract.interface.functions[methodName]) {
      return contract.interface.functions[methodName].outputs;
    }

    for (let i = 0; i < abi.length; i++) {
      if (abi[i].name?.trim() === methodName) {
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
    calls: AggregateCallContext[],
    options: ContractCallOptions
  ): Promise<AggregateResponse> {
    switch (this._executionType) {
      case ExecutionType.web3:
        return await this.executeWithWeb3(calls, options);
      case ExecutionType.ethers:
      case ExecutionType.customHttp:
        return await this.executeWithEthersOrCustom(calls, options);
      default:
        throw new Error(`${this._executionType} is not defined`);
    }
  }

  /**
   * Execute aggregate with web3 instance
   * @param calls The calls context
   */
  private async executeWithWeb3(
    calls: AggregateCallContext[],
    options: ContractCallOptions
  ): Promise<AggregateResponse> {
    const web3 = this.getTypedOptions<MulticallOptionsWeb3>().web3Instance;
    const networkId = await web3.eth.net.getId();
    const contract = new web3.eth.Contract(
      Multicall.ABI,
      this.getContractBasedOnNetwork(networkId)
    );
    // const callParams = [];
    let blockNumber = 'latest';
    if (options.blockNumber) {
      blockNumber = options.blockNumber;
    }
    if (this._options.tryAggregate) {
      const contractResponse = (await contract.methods
        .tryBlockAndAggregate(
          false,
          this.mapCallContextToMatchContractFormat(calls)
        )
        .call({}, blockNumber)) as AggregateContractResponse;

      contractResponse.blockNumber = BigNumber.from(
        contractResponse.blockNumber
      );

      return this.buildUpAggregateResponse(contractResponse, calls);
    } else {
      const contractResponse = (await contract.methods
        .aggregate(this.mapCallContextToMatchContractFormat(calls))
        .call({}, blockNumber)) as AggregateContractResponse;

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
    calls: AggregateCallContext[],
    options: ContractCallOptions
  ): Promise<AggregateResponse> {
    let ethersProvider =
      this.getTypedOptions<MulticallOptionsEthers>().ethersProvider;

    if (!ethersProvider) {
      const customProvider =
        this.getTypedOptions<MulticallOptionsCustomJsonRpcProvider>();
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
      Multicall.ABI,
      ethersProvider
    );
    let overrideOptions = {};
    if (options.blockNumber) {
      overrideOptions = {
        ...overrideOptions,
        blockTag: Number(options.blockNumber),
      };
    }
    if (this._options.tryAggregate) {
      const contractResponse = (await contract.callStatic.tryBlockAndAggregate(
        false,
        this.mapCallContextToMatchContractFormat(calls),
        overrideOptions
      )) as AggregateContractResponse;

      return this.buildUpAggregateResponse(contractResponse, calls);
    } else {
      const contractResponse = (await contract.callStatic.aggregate(
        this.mapCallContextToMatchContractFormat(calls),
        overrideOptions
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
    return this._options as unknown as T;
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
      case Networks.ropsten:
      case Networks.rinkeby:
      case Networks.goerli:
      case Networks.optimism:
      case Networks.kovan:
      case Networks.matic:
      case Networks.kovanOptimism:
      case Networks.xdai:
      case Networks.xDaiTestnet:
      case Networks.goerliOptimism:
      case Networks.sepoliaOptimism:
      case Networks.arbitrum:
      case Networks.rinkebyArbitrum:
      case Networks.goerliArbitrum:
      case Networks.sepoliaArbitrum:
      case Networks.mumbai:
      case Networks.sei:
      case Networks.sepolia:
      case Networks.avalancheMainnet:
      case Networks.avalancheFuji:
      case Networks.fantomTestnet:
      case Networks.fantom:
      case Networks.bsc:
      case Networks.bsc_testnet:
      case Networks.moonbeam:
      case Networks.moonriver:
      case Networks.moonbaseAlphaTestnet:
      case Networks.harmony:
      case Networks.cronos:
      case Networks.fuse:
      case Networks.songbirdCanaryNetwork:
      case Networks.costonTestnet:
      case Networks.boba:
      case Networks.aurora:
      case Networks.astar:
      case Networks.okc:
      case Networks.heco:
      case Networks.metis:
      case Networks.rsk:
      case Networks.rskTestnet:
      case Networks.evmos:
      case Networks.evmosTestnet:
      case Networks.thundercore:
      case Networks.thundercoreTestnet:
      case Networks.oasis:
      case Networks.celo:
      case Networks.godwoken:
      case Networks.godwokentestnet:
      case Networks.klatyn:
      case Networks.milkomeda:
      case Networks.kcc:
      case Networks.lineaTestnet:
      case Networks.linea:
      case Networks.mantle:
      case Networks.mantleTestnet:
      case Networks.base:
      case Networks.baseTestnet:
      case Networks.blastSepolia:
      case Networks.polygonZkEvm:
      case Networks.polygonZkEvmTestnet:
      case Networks.zora:
      case Networks.zoraTestnet:
      case Networks.flare:
      case Networks.pulsechain:
      case Networks.scroll:
      case Networks.scrollSepolia:
      case Networks.sapphire:
      case Networks.blast:
      case Networks.amoy:
      case Networks.mantaPacific:
      case Networks.mode:
      case Networks.bob:
        return '0xcA11bde05977b3631167028862bE2a173976CA11';
      case Networks.modeTestnet:
        return '0xBAba8373113Fb7a68f195deF18732e01aF8eDfCF';
      case Networks.etherlite:
        return '0x21681750D7ddCB8d1240eD47338dC984f94AF2aC';
      case Networks.zkSyncEra:
      case Networks.zkSyncEraTestnet:
      case Networks.zkSyncEraSepoliaTestnet:
        return '0xF9cda624FBC7e059355ce98a31693d299FACd963';
      case Networks.shibarium:
        return '0xd1727fC8F78aBA7DD6294f6033D74c72Ccd3D3B0';
      case Networks.starknet:
        return '0xc662c410C0ECf747543f5bA90660f6ABeBD9C8c4';
      case Networks.starknetTestnet:
        return '0xde29d060D45901Fb19ED6C6e959EB22d8626708e';

      default:
        throw new Error(
          `Network - ${network} doesn't have a multicall contract address defined. Please check your network or deploy your own contract on it.`
        );
    }
  }
}
