"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Multicall = void 0;
var ethers_1 = require("ethers");
var utils_1 = require("ethers/lib/utils");
var enums_1 = require("./enums");
var utils_2 = require("./utils");
var Multicall = /** @class */ (function () {
    function Multicall(_options) {
        this._options = _options;
        this.ABI = [
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
        if (this._options.web3Instance) {
            this._executionType = enums_1.ExecutionType.web3;
            return;
        }
        if (this._options.ethersProvider) {
            this._executionType = enums_1.ExecutionType.ethers;
            return;
        }
        if (this._options.nodeUrl) {
            this._executionType = enums_1.ExecutionType.customHttp;
            return;
        }
        throw new Error(
        // tslint:disable-next-line: max-line-length
        'Your options passed in our incorrect they need to match either `MulticallOptionsEthers`, `MulticallOptionsWeb3` or `MulticallOptionsCustomJsonRpcProvider` interfaces');
    }
    /**
     * Call all the contract calls in 1
     * @param calls The calls
     */
    Multicall.prototype.call = function (contractCallContexts) {
        return __awaiter(this, void 0, void 0, function () {
            var aggregateResponse, returnObject, response, contractCallsResults, originalContractCallContext, returnObjectResult, method, methodContext, originalContractCallMethodContext, outputTypes, decodedReturnValues;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!Array.isArray(contractCallContexts)) {
                            contractCallContexts = [contractCallContexts];
                        }
                        return [4 /*yield*/, this.execute(this.buildAggregateCallContext(contractCallContexts))];
                    case 1:
                        aggregateResponse = _a.sent();
                        returnObject = {
                            results: {},
                            blockNumber: aggregateResponse.blockNumber,
                        };
                        for (response = 0; response < aggregateResponse.results.length; response++) {
                            contractCallsResults = aggregateResponse.results[response];
                            originalContractCallContext = contractCallContexts[contractCallsResults.contractContextIndex];
                            returnObjectResult = {
                                originalContractCallContext: utils_2.Utils.deepClone(originalContractCallContext),
                                callsReturnContext: [],
                            };
                            for (method = 0; method < contractCallsResults.methodResults.length; method++) {
                                methodContext = contractCallsResults.methodResults[method];
                                originalContractCallMethodContext = originalContractCallContext.calls[methodContext.contractMethodIndex];
                                outputTypes = this.findOutputTypesFromAbi(originalContractCallContext.abi, originalContractCallMethodContext.methodName);
                                if (this._options.tryAggregate && !methodContext.result.success) {
                                    returnObjectResult.callsReturnContext.push(utils_2.Utils.deepClone({
                                        returnValues: [],
                                        decoded: false,
                                        reference: originalContractCallMethodContext.reference,
                                        methodName: originalContractCallMethodContext.methodName,
                                        methodParameters: originalContractCallMethodContext.methodParameters,
                                        success: false,
                                    }));
                                    continue;
                                }
                                if (outputTypes && outputTypes.length > 0) {
                                    decodedReturnValues = utils_1.defaultAbiCoder.decode(
                                    // tslint:disable-next-line: no-any
                                    outputTypes, this.getReturnDataFromResult(methodContext.result));
                                    returnObjectResult.callsReturnContext.push(utils_2.Utils.deepClone({
                                        returnValues: this.formatReturnValues(decodedReturnValues),
                                        decoded: true,
                                        reference: originalContractCallMethodContext.reference,
                                        methodName: originalContractCallMethodContext.methodName,
                                        methodParameters: originalContractCallMethodContext.methodParameters,
                                        success: true,
                                    }));
                                }
                                else {
                                    returnObjectResult.callsReturnContext.push(utils_2.Utils.deepClone({
                                        returnValues: this.getReturnDataFromResult(methodContext.result),
                                        decoded: false,
                                        reference: originalContractCallMethodContext.reference,
                                        methodName: originalContractCallMethodContext.methodName,
                                        methodParameters: originalContractCallMethodContext.methodParameters,
                                        success: true,
                                    }));
                                }
                            }
                            returnObject.results[returnObjectResult.originalContractCallContext.reference] = returnObjectResult;
                        }
                        return [2 /*return*/, returnObject];
                }
            });
        });
    };
    /**
     * Get return data from result
     * @param result The result
     */
    // tslint:disable-next-line: no-any
    Multicall.prototype.getReturnDataFromResult = function (result) {
        if (this._options.tryAggregate) {
            return result.returnData;
        }
        return result;
    };
    /**
     * Format return values so its always an array
     * @param decodedReturnValues The decoded return values
     */
    // tslint:disable-next-line: no-any
    Multicall.prototype.formatReturnValues = function (decodedReturnValues) {
        var decodedReturnResults = decodedReturnValues;
        if (Array.isArray(decodedReturnResults)) {
            return decodedReturnResults;
        }
        return [decodedReturnResults];
    };
    /**
     * Build aggregate call context
     * @param contractCallContexts The contract call contexts
     */
    Multicall.prototype.buildAggregateCallContext = function (contractCallContexts) {
        var aggregateCallContext = [];
        for (var contract = 0; contract < contractCallContexts.length; contract++) {
            var contractContext = contractCallContexts[contract];
            var executingInterface = new ethers_1.ethers.utils.Interface(JSON.stringify(contractContext.abi));
            for (var method = 0; method < contractContext.calls.length; method++) {
                // https://github.com/ethers-io/ethers.js/issues/211
                var methodContext = contractContext.calls[method];
                // tslint:disable-next-line: no-unused-expression
                var encodedData = executingInterface.encodeFunctionData(methodContext.methodName, methodContext.methodParameters);
                aggregateCallContext.push({
                    contractContextIndex: utils_2.Utils.deepClone(contract),
                    contractMethodIndex: utils_2.Utils.deepClone(method),
                    target: contractContext.contractAddress,
                    encodedData: encodedData,
                });
            }
        }
        return aggregateCallContext;
    };
    /**
     * Find output types from abi
     * @param abi The abi
     * @param methodName The method name
     */
    Multicall.prototype.findOutputTypesFromAbi = function (abi, methodName) {
        var _a;
        for (var i = 0; i < abi.length; i++) {
            if (((_a = abi[i].name) === null || _a === void 0 ? void 0 : _a.trim()) === methodName.trim()) {
                return abi[i].outputs;
            }
        }
        return undefined;
    };
    /**
     * Execute the multicall contract call
     * @param calls The calls
     */
    Multicall.prototype.execute = function (calls) {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = this._executionType;
                        switch (_a) {
                            case enums_1.ExecutionType.web3: return [3 /*break*/, 1];
                            case enums_1.ExecutionType.ethers: return [3 /*break*/, 3];
                            case enums_1.ExecutionType.customHttp: return [3 /*break*/, 3];
                        }
                        return [3 /*break*/, 5];
                    case 1: return [4 /*yield*/, this.executeWithWeb3(calls)];
                    case 2: return [2 /*return*/, _b.sent()];
                    case 3: return [4 /*yield*/, this.executeWithEthersOrCustom(calls)];
                    case 4: return [2 /*return*/, _b.sent()];
                    case 5: throw new Error("".concat(this._executionType, " is not defined"));
                }
            });
        });
    };
    /**
     * Execute aggregate with web3 instance
     * @param calls The calls context
     */
    Multicall.prototype.executeWithWeb3 = function (calls) {
        return __awaiter(this, void 0, void 0, function () {
            var web3, networkId, contract, contractResponse, contractResponse;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        web3 = this.getTypedOptions().web3Instance;
                        return [4 /*yield*/, web3.eth.net.getId()];
                    case 1:
                        networkId = _a.sent();
                        contract = new web3.eth.Contract(this.ABI, this.getContractBasedOnNetwork(networkId));
                        if (!this._options.tryAggregate) return [3 /*break*/, 3];
                        return [4 /*yield*/, contract.methods
                                .tryBlockAndAggregate(false, this.mapCallContextToMatchContractFormat(calls))
                                .call()];
                    case 2:
                        contractResponse = (_a.sent());
                        contractResponse.blockNumber = ethers_1.BigNumber.from(contractResponse.blockNumber);
                        return [2 /*return*/, this.buildUpAggregateResponse(contractResponse, calls)];
                    case 3: return [4 /*yield*/, contract.methods
                            .aggregate(this.mapCallContextToMatchContractFormat(calls))
                            .call()];
                    case 4:
                        contractResponse = (_a.sent());
                        contractResponse.blockNumber = ethers_1.BigNumber.from(contractResponse.blockNumber);
                        return [2 /*return*/, this.buildUpAggregateResponse(contractResponse, calls)];
                }
            });
        });
    };
    /**
     * Execute with ethers using passed in provider context or custom one
     * @param calls The calls
     */
    Multicall.prototype.executeWithEthersOrCustom = function (calls) {
        return __awaiter(this, void 0, void 0, function () {
            var ethersProvider, customProvider, network, contract, contractResponse, contractResponse;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        ethersProvider = this.getTypedOptions().ethersProvider;
                        if (!ethersProvider) {
                            customProvider = this.getTypedOptions();
                            if (customProvider.nodeUrl) {
                                ethersProvider = new ethers_1.ethers.providers.JsonRpcProvider(customProvider.nodeUrl);
                            }
                            else {
                                ethersProvider = ethers_1.ethers.getDefaultProvider();
                            }
                        }
                        return [4 /*yield*/, ethersProvider.getNetwork()];
                    case 1:
                        network = _a.sent();
                        contract = new ethers_1.ethers.Contract(this.getContractBasedOnNetwork(network.chainId), this.ABI, ethersProvider);
                        if (!this._options.tryAggregate) return [3 /*break*/, 3];
                        return [4 /*yield*/, contract.callStatic.tryBlockAndAggregate(false, this.mapCallContextToMatchContractFormat(calls))];
                    case 2:
                        contractResponse = (_a.sent());
                        return [2 /*return*/, this.buildUpAggregateResponse(contractResponse, calls)];
                    case 3: return [4 /*yield*/, contract.callStatic.aggregate(this.mapCallContextToMatchContractFormat(calls))];
                    case 4:
                        contractResponse = (_a.sent());
                        return [2 /*return*/, this.buildUpAggregateResponse(contractResponse, calls)];
                }
            });
        });
    };
    /**
     * Build up the aggregated response from the contract response mapping
     * metadata from the calls
     * @param contractResponse The contract response
     * @param calls The calls
     */
    Multicall.prototype.buildUpAggregateResponse = function (contractResponse, calls) {
        var aggregateResponse = {
            blockNumber: contractResponse.blockNumber.toNumber(),
            results: [],
        };
        var _loop_1 = function (i) {
            var existingResponse = aggregateResponse.results.find(function (c) { return c.contractContextIndex === calls[i].contractContextIndex; });
            if (existingResponse) {
                existingResponse.methodResults.push({
                    result: contractResponse.returnData[i],
                    contractMethodIndex: calls[i].contractMethodIndex,
                });
            }
            else {
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
        };
        for (var i = 0; i < contractResponse.returnData.length; i++) {
            _loop_1(i);
        }
        return aggregateResponse;
    };
    /**
     * Map call contract to match contract format
     * @param calls The calls context
     */
    Multicall.prototype.mapCallContextToMatchContractFormat = function (calls) {
        return calls.map(function (call) {
            return {
                target: call.target,
                callData: call.encodedData,
            };
        });
    };
    /**
     * Get typed options
     */
    Multicall.prototype.getTypedOptions = function () {
        return this._options;
    };
    /**
     * Get the contract based on the network
     * @param tryAggregate The tryAggregate
     * @param network The network
     */
    Multicall.prototype.getContractBasedOnNetwork = function (network) {
        // if they have overriden the multicall custom contract address then use that
        if (this._options.multicallCustomContractAddress) {
            return this._options.multicallCustomContractAddress;
        }
        switch (network) {
            case enums_1.Networks.mainnet:
            case enums_1.Networks.kovan:
            case enums_1.Networks.rinkeby:
            case enums_1.Networks.ropsten:
            case enums_1.Networks.goerli:
                return '0x5BA1e12693Dc8F9c48aAD8770482f4739bEeD696';
            case enums_1.Networks.bsc:
                return '0xC50F4c1E81c873B2204D7eFf7069Ffec6Fbe136D';
            case enums_1.Networks.bsc_testnet:
                return '0x6e5BB1a5Ad6F68A8D7D6A5e47750eC15773d6042';
            case enums_1.Networks.xdai:
                return '0x2325b72990D81892E0e09cdE5C80DD221F147F8B';
            case enums_1.Networks.mumbai:
                return '0xe9939e7Ea7D7fb619Ac57f648Da7B1D425832631';
            case enums_1.Networks.matic:
                return '0x275617327c958bD06b5D6b871E7f491D76113dd8';
            case enums_1.Networks.etherlite:
                return '0x21681750D7ddCB8d1240eD47338dC984f94AF2aC';
            case enums_1.Networks.arbitrum:
                return '0x80C7DD17B01855a6D2347444a0FCC36136a314de';
            case enums_1.Networks.avalauncheFuji:
                return '0x3D015943d2780fE97FE3f69C97edA2CCC094f78c';
            case enums_1.Networks.avalauncheMainnet:
                return '0xed386Fe855C1EFf2f843B910923Dd8846E45C5A4';
            case enums_1.Networks.fantom:
                return '0xD98e3dBE5950Ca8Ce5a4b59630a5652110403E5c';
            default:
                throw new Error("Network - ".concat(network, " is not got a contract defined it only supports mainnet, kovan, rinkeby, bsc and ropsten"));
        }
    };
    return Multicall;
}());
exports.Multicall = Multicall;
