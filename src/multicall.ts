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
  ContractCallOptions,
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
    const networkId = this._options.networkId || (await web3.eth.net.getId());
    const contract = new web3.eth.Contract(
      this.ABI,
      this.getContractBasedOnNetwork(networkId)
    );
    const callParams = [];
    if (options.blockNumber) {
      callParams.push(options.blockNumber);
    }
    if (this._options.tryAggregate) {
      const contractResponse = (await contract.methods
        .tryBlockAndAggregate(
          false,
          this.mapCallContextToMatchContractFormat(calls)
        )
        .call(...callParams)) as AggregateContractResponse;

      contractResponse.blockNumber = BigNumber.from(
        contractResponse.blockNumber
      );

      return this.buildUpAggregateResponse(contractResponse, calls);
    } else {
      const contractResponse = (await contract.methods
        .aggregate(this.mapCallContextToMatchContractFormat(calls))
        .call(...callParams)) as AggregateContractResponse;

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

    const network =
      this._options.networkId ||
      (await (
        await ethersProvider.getNetwork()
      ).chainId);

    const contract = new ethers.Contract(
      this.getContractBasedOnNetwork(network),
      this.ABI,
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
      console.log('running this');
      const contractResponse = (await contract.callStatic.tryBlockAndAggregate(
        true,
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
      case Networks.kovan:
      case Networks.rinkeby:
      case Networks.ropsten:
      case Networks.goerli:
        return '0x5BA1e12693Dc8F9c48aAD8770482f4739bEeD696';
      case Networks.bsc:
        return '0xC50F4c1E81c873B2204D7eFf7069Ffec6Fbe136D';
      case Networks.bsc_testnet:
        return '0x73CCde5acdb9980f54BcCc0483B28B8b4a537b4A';
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
      case Networks.avalancheFuji:
        return '0x3D015943d2780fE97FE3f69C97edA2CCC094f78c';
      case Networks.avalancheMainnet:
        return '0xed386Fe855C1EFf2f843B910923Dd8846E45C5A4';
      case Networks.fantom:
        return '0xD98e3dBE5950Ca8Ce5a4b59630a5652110403E5c';
      case Networks.cronos:
        return '0x5e954f5972EC6BFc7dECd75779F10d848230345F';
      case Networks.harmony:
        return '0x5c41f6817feeb65d7b2178b0b9cebfc8fad97969';
      case Networks.optimism:
        return '0xeAa6877139d436Dc6d1f75F3aF15B74662617B2C';
      case Networks.kovanOptimism:
        return '0x91c88479F21203444D2B20Aa001f951EC8CF2F68';
      case Networks.aurora:
        return '0x04364F8908BDCB4cc7EA881d0DE869398BA849C9';
      case Networks.evmos:
        return '0x80ed034722D8e0D9aC1F39EF69c65dfbf9b8C558';
      case Networks.klaytn:
        return '0x2fe78f55c39dc437c4c025f8a1ffc54edb4a34c3';
      case Networks.aurora:
        return '0xBF69a56D35B8d6f5A8e0e96B245a72F735751e54';
      case Networks.boba:
        return '0xaeD5b25BE1c3163c907a471082640450F928DDFE';
      case Networks.celo:
        return '0x86aAD62D1C36f4f92C8219D5C3ff97c3EF471bb8';
      case Networks.elastos:
        return '0x5e1554B25731C98e58d5728847938db3DfFA1b57';
      case Networks.fuse:
        return '0x0769fd68dFb93167989C6f7254cd0D766Fb2841F';
      case Networks.heco:
        return '0xbB5d56bb107FfB849fF5577f692C2ee8E8c38607';
      case Networks.hsc:
        return '0x1d44a4fb4C02201bdB49FA9433555F2Ee46BC9B8';
      case Networks.iotex:
        return '0x4c1329a07f2525d428dc03374cd46b852a511fec';
      case Networks.kcc:
        return '0x0185Fe88dB541F2DB1F6a7343bd4CF17000d98D7';
      case Networks.metis:
        return '0xc39aBB6c4451089dE48Cffb013c39d3110530e5C';
      case Networks.moonbeam:
        return '0x6477204E12A7236b9619385ea453F370aD897bb2';
      case Networks.moonriver:
        return '0x43D002a2B468F048028Ea9C2D3eD4705a94e68Ae';
      case Networks.oasis:
        return '0x970F9F4d7D752423A82f4a790B7117D949939B0b';
      case Networks.velas:
        return '0x0747CFe82D3Bee998f634569FE2B0005dF9d8EDE';
      case Networks.wanchain:
        return '0x70bd16472b30B9B11362C4f5DB0F702099156aAA';
      case Networks.telos:
        return '0x89fcf2008981cc2cd9389f445f7f6e59ea69cbf0';
      case Networks.oec:
        return '0x89FCf2008981cC2Cd9389f445F7f6e59eA69cbF0';
      case Networks.smartbch:
        return '0x89FCf2008981cC2Cd9389f445F7f6e59eA69cbF0';
      case Networks.shiden:
        return '0x89FCf2008981cC2Cd9389f445F7f6e59eA69cbF0';
      case Networks.kardia:
        return '0xAF60776A49b273318FFE1fC424bc6817209384c1';
      case Networks.polis:
        return '0x89FCf2008981cC2Cd9389f445F7f6e59eA69cbF0';
      case Networks.astar:
        return '0x89BEcA8D00e721b7714e12F1c29A2523DBE798a7';
      case Networks.milkomeda:
        return '0x2ecBF8b054Ef234F3523D605E7ba9cfE9A37703a';
      case Networks.avalanchedfk:
        return '0x5b24224dC16508DAD755756639E420817DD4c99E';
      case Networks.conflux:
        return '0xbd6706747a7b6c8868cf48735f48c341ea386d07';
      case Networks.syscoin:
        return '0xbD6706747a7B6C8868Cf48735f48C341ea386d07';
      case Networks.echelon:
        return '0xb4495b21de57dfa6b12cc414525d1850b5fee52d';
      case Networks.energi:
        return '0xbd6706747a7b6c8868cf48735f48c341ea386d07';
      case Networks.energyweb:
        return '0xbd6706747a7b6c8868cf48735f48c341ea386d07';
      case Networks.zyx:
        return '0xbd6706747a7b6c8868cf48735f48c341ea386d07';
      case Networks.nova:
        return '0x2fe78f55c39dc437c4c025f8a1ffc54edb4a34c3';
      case Networks.canto:
        return '0x59bbf55e70a1afdb25e94fc5ad1d81aa51c3efab';
      case Networks.dogechain:
        return '0xe4a8ee19f38522bae0d8219b6cba22ed48ee25d7';
      case Networks.zksync:
        return '0x30f32f526caaedaa557290609c02163927a5d151';
      case Networks.pulsechain:
        return '0x54db8bdb0b72efa1133cc3b8195d22d5490611e3';
      case Networks.base:
        return '0x0434529f41584c72150a21d41eeddad6652343c4';
      case Networks.sepolia:
        return '0x7a37fcabacc6b04422f2a625080cef2d1b4b6e4e';
      default:
        throw new Error(
          `Network - ${network} doesn't have a multicall contract address defined. Please check your network or deploy your own contract on it.`
        );
    }
  }
}
