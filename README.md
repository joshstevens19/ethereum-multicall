[![npm version](https://badge.fury.io/js/ethereum-multicall.svg)](https://badge.fury.io/js/ethereum-multicall)
![downloads](https://img.shields.io/npm/dw/ethereum-multicall)

# ethereum-multicall

ethereum-multicall is a lightweight library for interacting with the [`Multicall3`](https://github.com/mds1/multicall) smart contract.

Multicall allows multiple smart contract constant function calls to be grouped into a single call and the results aggregated into a single result. This reduces the number of separate JSON RPC requests that need to be sent over the network if using a remote node like Infura, and provides the guarantee that all values returned are from the same block. The latest block number is also returned along with the aggregated results.

ethereum-multicall is fully written in typescript so has full compile time support. The motivation of this package was to expose a super simple and easy to understand interface for you to take the full benefits of the multicalls. Also to not being opinionated on how you use it, you can use it with web3, ethers or even pass in a custom nodeUrl and we do it for you. This package takes care of the decoding for you but at the same time if you dont want it to you can turn that part off.

## Supports

The below networks are supported by default, and custom networks can be supported by providing your own instance of a deployed Multicall contract.

| Chain                   | Chain ID   |
| ----------------------- | ---------- |
| Mainnet                 | 1          |
| Kovan                   | 3          |
| Rinkeby                 | 4          |
| Görli                   | 5          |
| Ropsten                 | 10         |
| Sepolia                 | 42         |
| Optimism                | 137        |
| Optimism Kovan          | 69         |
| Optimism Görli          | 100        |
| Arbitrum                | 420        |
| Arbitrum Görli          | 42161      |
| Arbitrum Rinkeby        | 421611     |
| Polygon                 | 421613     |
| Mumbai                  | 80001      |
| Gnosis Chain (xDai)     | 11155111   |
| Avalanche               | 43114      |
| Avalanche Fuji          | 43113      |
| Fantom Testnet          | 4002       |
| Fantom Opera            | 250        |
| BNB Smart Chain         | 56         |
| BNB Smart Chain Testnet | 97         |
| Moonbeam                | 1284       |
| Moonriver               | 1285       |
| Moonbase Alpha Testnet  | 1287       |
| Harmony                 | 1666600000 |
| Cronos                  | 25         |
| Fuse                    | 122        |
| Songbird Canary Network | 19         |
| Coston Testnet          | 16         |
| Boba                    | 288        |
| Aurora                  | 1313161554 |
| Astar                   | 592        |
| OKC                     | 66         |
| Heco Chain              | 128        |
| Metis                   | 1088       |
| RSK                     | 30         |
| RSK Testnet             | 31         |
| Evmos                   | 9001       |
| Evmos Testnet           | 9000       |
| Thundercore             | 108        |
| Thundercore Testnet     | 18         |
| Oasis                   | 26863      |
| Celo                    | 42220      |
| Godwoken                | 71402      |
| Godwoken Testnet        | 71401      |
| Klatyn                  | 8217       |
| Milkomeda               | 2001       |
| KCC                     | 321        |
| Etherlite               | 111        |
| Linea Testnet           | 59140      |
| Linea                   | 59144      |
| Scroll Alpha            | 534352     |
| zkSync Era              | 324        |
| zkSync Era Testnet      | 280        |

## Installation

### npm:

```js
$ npm install ethereum-multicall
```

### yarn:

```js
$ yarn add ethereum-multicall
```

## Usage

### Overloaded methods

As the [official docs mentions here](https://docs.ethers.io/v3/api-contract.html#prototype):

> Due to signature overloading, multiple functions can have the same name. The first function specified in the ABI will be bound to its name. To access overloaded functions, use the full typed signature of the functions (e.g. contract["foobar(address,uint256)"]).

So, when creating the contract call context, under the calls array property we should have that in mind and use the method signature rather than the method name. E.g.

```js
const contractCallContext: ContractCallContext = {
  reference: 'upV2Controller',
  contractAddress: '0x19891DdF6F393C02E484D7a942d4BF8C0dB1d001',
  abi: [
    {
      inputs: [],
      name: 'getVirtualPrice',
      outputs: [
        {
          internalType: 'uint256',
          name: '',
          type: 'uint256',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'uint256',
          name: 'sentValue',
          type: 'uint256',
        },
      ],
      name: 'getVirtualPrice',
      outputs: [
        {
          internalType: 'uint256',
          name: '',
          type: 'uint256',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
  ],
  calls: [
    {
      reference: 'getVirtualPriceWithInput',
      methodName: 'getVirtualPrice(uint256)',
      methodParameters: ['0xFFFFFFFFFFFFF'],
    },
    {
      reference: 'getVirtualPriceWithoutInput',
      methodName: 'getVirtualPrice()',
      methodParameters: [],
    },
  ],
};
```

### Import examples:

### JavaScript (ES3)

```js
var ethereumMulticall = require('ethereum-multicall');
```

### JavaScript (ES5 or ES6)

```js
const ethereumMulticall = require('ethereum-multicall');
```

### JavaScript (ES6) / TypeScript

```js
import {
  Multicall,
  ContractCallResults,
  ContractCallContext,
} from 'ethereum-multicall';
```

### ethers usage example

```ts
import {
  Multicall,
  ContractCallResults,
  ContractCallContext,
} from 'ethereum-multicall';
import { ethers } from 'ethers';

let provider = ethers.getDefaultProvider();

// you can use any ethers provider context here this example is
// just shows passing in a default provider, ethers hold providers in
// other context like wallet, signer etc all can be passed in as well.
const multicall = new Multicall({ ethersProvider: provider, tryAggregate: true });

const contractCallContext: ContractCallContext[] = [
    {
        reference: 'testContract',
        contractAddress: '0x6795b15f3b16Cf8fB3E56499bbC07F6261e9b0C3',
        abi: [ { name: 'foo', type: 'function', inputs: [ { name: 'example', type: 'uint256' } ], outputs: [ { name: 'amounts', type: 'uint256' }] } ],
        calls: [{ reference: 'fooCall', methodName: 'foo', methodParameters: [42] }]
    },
    {
        reference: 'testContract2',
        contractAddress: '0x66BF8e2E890eA0392e158e77C6381b34E0771318',
        abi: [ { name: 'fooTwo', type: 'function', inputs: [ { name: 'example', type: 'uint256' } ], outputs: [ { name: 'amounts', type: 'uint256', name: "path", "type": "address[]" }] } ],
        calls: [{ reference: 'fooTwoCall', methodName: 'fooTwo', methodParameters: [42] }]
    }
];

const results: ContractCallResults = await multicall.call(contractCallContext);
console.log(results);

// results:
{
  results: {
      testContract: {
          originalContractCallContext:  {
            reference: 'testContract',
            contractAddress: '0x6795b15f3b16Cf8fB3E56499bbC07F6261e9b0C3',
            abi: [ { name: 'foo', type: 'function', inputs: [ { name: 'example', type: 'uint256' } ], outputs: [ { name: 'amounts', type: 'uint256' }] } ],
            calls: [{ reference: 'fooCall', methodName: 'foo', methodParameters: [42] }]
          },
          callsReturnContext: [{
              returnValues: [{ amounts: BigNumber }],
              decoded: true,
              reference: 'fooCall',
              methodName: 'foo',
              methodParameters: [42],
              success: true
          }]
      },
      testContract2: {
          originalContractCallContext:  {
            reference: 'testContract2',
            contractAddress: '0x66BF8e2E890eA0392e158e77C6381b34E0771318',
            abi: [ { name: 'fooTwo', type: 'function', inputs: [ { name: 'example', type: 'uint256' } ], outputs: [ { name: 'amounts', type: 'uint256[]' ] } ],
            calls: [{ reference: 'fooTwoCall', methodName: 'fooTwo', methodParameters: [42] }]
          },
          callsReturnContext: [{
              returnValues: [{ amounts: [BigNumber, BigNumber, BigNumber] }],
              decoded: true,
              reference: 'fooCall',
              methodName: 'foo',
              methodParameters: [42],
              success: true
          }]
      }
  },
  blockNumber: 10994677
}
```

### web3 usage example

```ts
import {
  Multicall,
  ContractCallResults,
  ContractCallContext,
} from 'ethereum-multicall';
import Web3 from 'web3';

const web3 = new Web3('https://some.local-or-remote.node:8546');

const multicall = new Multicall({ web3Instance: web3, tryAggregate: true });

const contractCallContext: ContractCallContext[] = [
    {
        reference: 'testContract',
        contractAddress: '0x6795b15f3b16Cf8fB3E56499bbC07F6261e9b0C3',
        abi: [ { name: 'foo', type: 'function', inputs: [ { name: 'example', type: 'uint256' } ], outputs: [ { name: 'amounts', type: 'uint256' }] } ],
        calls: [{ reference: 'fooCall', methodName: 'foo', methodParameters: [42] }]
    },
    {
        reference: 'testContract2',
        contractAddress: '0x66BF8e2E890eA0392e158e77C6381b34E0771318',
        abi: [ { name: 'fooTwo', type: 'function', inputs: [ { name: 'example', type: 'uint256' } ], outputs: [ { name: 'amounts', type: 'uint256', name: "path", "type": "address[]" }] } ],
        calls: [{ reference: 'fooTwoCall', methodName: 'fooTwo', methodParameters: [42] }]
    }
];

const results: ContractCallResults = await multicall.call(contractCallContext);
console.log(results);

// results:
{
  results: {
      testContract: {
          originalContractCallContext:  {
            reference: 'testContract',
            contractAddress: '0x6795b15f3b16Cf8fB3E56499bbC07F6261e9b0C3',
            abi: [ { name: 'foo', type: 'function', inputs: [ { name: 'example', type: 'uint256' } ], outputs: [ { name: 'amounts', type: 'uint256' }] } ],
            calls: [{ reference: 'fooCall', methodName: 'foo', methodParameters: [42] }]
          },
          callsReturnContext: [{
              returnValues: [{ amounts: BigNumber }],
              decoded: true,
              reference: 'fooCall',
              methodName: 'foo',
              methodParameters: [42],
              success: true
          }]
      },
      testContract2: {
          originalContractCallContext:  {
            reference: 'testContract2',
            contractAddress: '0x66BF8e2E890eA0392e158e77C6381b34E0771318',
            abi: [ { name: 'fooTwo', type: 'function', inputs: [ { name: 'example', type: 'uint256' } ], outputs: [ { name: 'amounts', type: 'uint256[]' ] } ],
            calls: [{ reference: 'fooTwoCall', methodName: 'fooTwo', methodParameters: [42] }]
          },
          callsReturnContext: [{
              returnValues: [{ amounts: [BigNumber, BigNumber, BigNumber] }],
              decoded: true,
              reference: 'fooCall',
              methodName: 'foo',
              methodParameters: [42],
              success: true
          }]
      }
  },
  blockNumber: 10994677
}
```

### specify call block number

The multicall instance call method has an optional second argument of type [ContractCallOptions](src/models/contract-call-options.ts).

One of the options is the blockNumber, so you can choose the height where you want the data from.

It is compatible with both ethers and web3 providers.

```ts
import {
  Multicall,
  ContractCallResults,
  ContractCallContext,
} from 'ethereum-multicall';
import Web3 from 'web3';

const web3 = new Web3('https://some.local-or-remote.node:8546');

const multicall = new Multicall({ web3Instance: web3, tryAggregate: true });

const contractCallContext: ContractCallContext[] = [
    {
        reference: 'testContract',
        contractAddress: '0x6795b15f3b16Cf8fB3E56499bbC07F6261e9b0C3',
        abi: [ { name: 'foo', type: 'function', inputs: [ { name: 'example', type: 'uint256' } ], outputs: [ { name: 'amounts', type: 'uint256' }] } ],
        calls: [{ reference: 'fooCall', methodName: 'foo', methodParameters: [42] }]
    }
];

const results: ContractCallResults = await multicall.call(contractCallContext,{
    blockNumber: '14571050'
});
console.log(results);

// results: it will have the same block as requested
{
  results: {
      testContract: {
          originalContractCallContext:  {
            reference: 'testContract',
            contractAddress: '0x6795b15f3b16Cf8fB3E56499bbC07F6261e9b0C3',
            abi: [ { name: 'foo', type: 'function', inputs: [ { name: 'example', type: 'uint256' } ], outputs: [ { name: 'amounts', type: 'uint256' }] } ],
            calls: [{ reference: 'fooCall', methodName: 'foo', methodParameters: [42] }]
          },
          callsReturnContext: [{
              returnValues: [{ amounts: BigNumber }],
              decoded: true,
              reference: 'fooCall',
              methodName: 'foo',
              methodParameters: [42],
              success: true
          }]
      },
  },
  blockNumber: 14571050
}
```

### passing extra context to the call

If you want to store any context or state so you don't need to look back over arrays once you got the result back. it can be stored in `context` within `ContractCallContext`.

```ts
import {
  Multicall,
  ContractCallResults,
  ContractCallContext,
} from 'ethereum-multicall';
import { ethers } from 'ethers';

let provider = ethers.getDefaultProvider();

// you can use any ethers provider context here this example is
// just shows passing in a default provider, ethers hold providers in
// other context like wallet, signer etc all can be passed in as well.
const multicall = new Multicall({ ethersProvider: provider, tryAggregate: true });

// this is showing you having the same context for all `ContractCallContext` but you can also make this have
// different context for each `ContractCallContext`, as `ContractCallContext<TContext>` takes generic `TContext`.
const contractCallContext: ContractCallContext<{extraContext: string, foo4: boolean}>[] = [
    {
        reference: 'testContract',
        contractAddress: '0x6795b15f3b16Cf8fB3E56499bbC07F6261e9b0C3',
        abi: [ { name: 'foo', type: 'function', inputs: [ { name: 'example', type: 'uint256' } ], outputs: [ { name: 'amounts', type: 'uint256' }] } ],
        calls: [{ reference: 'fooCall', methodName: 'foo', methodParameters: [42] }],
        // pass it in here!
        context: {
          extraContext: 'extraContext',
          foo4: true
        }
    },
    {
        reference: 'testContract2',
        contractAddress: '0x66BF8e2E890eA0392e158e77C6381b34E0771318',
        abi: [ { name: 'fooTwo', type: 'function', inputs: [ { name: 'example', type: 'uint256' } ], outputs: [ { name: 'amounts', type: 'uint256', name: "path", "type": "address[]" }] } ],
        calls: [{ reference: 'fooTwoCall', methodName: 'fooTwo', methodParameters: [42] }],
         // pass it in here!
        context: {
          extraContext: 'extraContext2',
          foo4: false
        }
    }
];

const results: ContractCallResults = await multicall.call(contractCallContext);
console.log(results);

// results:
{
  results: {
      testContract: {
          originalContractCallContext:  {
            reference: 'testContract',
            contractAddress: '0x6795b15f3b16Cf8fB3E56499bbC07F6261e9b0C3',
            abi: [ { name: 'foo', type: 'function', inputs: [ { name: 'example', type: 'uint256' } ], outputs: [ { name: 'amounts', type: 'uint256' }] } ],
            calls: [{ reference: 'fooCall', methodName: 'foo', methodParameters: [42] }],
            context: {
                extraContext: 'extraContext',
                foo4: true
            }
          },
          callsReturnContext: [{
              returnValues: [{ amounts: BigNumber }],
              decoded: true,
              reference: 'fooCall',
              methodName: 'foo',
              methodParameters: [42],
              success: true
          }]
      },
      testContract2: {
          originalContractCallContext:  {
            reference: 'testContract2',
            contractAddress: '0x66BF8e2E890eA0392e158e77C6381b34E0771318',
            abi: [ { name: 'fooTwo', type: 'function', inputs: [ { name: 'example', type: 'uint256' } ], outputs: [ { name: 'amounts', type: 'uint256[]' ] } ],
            calls: [{ reference: 'fooTwoCall', methodName: 'fooTwo', methodParameters: [42] }],
            context: {
                extraContext: 'extraContext2',
                foo4: false
            }
          },
          callsReturnContext: [{
              returnValues: [{ amounts: [BigNumber, BigNumber, BigNumber] }],
              decoded: true,
              reference: 'fooCall',
              methodName: 'foo',
              methodParameters: [42],
              success: true
          }]
      }
  },
  blockNumber: 10994677
}
```

### try aggregate

By default if you dont turn `tryAggregate` to true if 1 `eth_call` fails in your multicall the whole result will throw. If you turn `tryAggregate` to true it means if 1 of your `eth_call` methods fail it still return you the rest of the results. It will still be in the same order as you expect but you have a `success` boolean to check if it passed or failed. Keep in mind that if using a custom multicall contract deployment, Multicall version 1's will not work. Use a Multicall2 deployment (contract can be found [here](https://github.com/makerdao/multicall/blob/master/src/Multicall2.sol)).

```ts
import {
  Multicall,
  ContractCallResults,
  ContractCallContext,
} from 'ethereum-multicall';

const multicall = new Multicall({ nodeUrl: 'https://some.local-or-remote.node:8546', tryAggregate: true });

const contractCallContext: ContractCallContext[] = [
    {
        reference: 'testContract',
        contractAddress: '0x6795b15f3b16Cf8fB3E56499bbC07F6261e9b0C3',
        abi: [ { name: 'foo', type: 'function', inputs: [ { name: 'example', type: 'uint256' } ], outputs: [ { name: 'amounts', type: 'uint256' }] }, { name: 'foo_fail', type: 'function', inputs: [ { name: 'example', type: 'uint256' } ], outputs: [ { name: 'amounts', type: 'uint256' }] } ],
        calls: [{ reference: 'fooCall', methodName: 'foo', methodParameters: [42] }, { reference: 'fooCall_fail', methodName: 'foo_fail', methodParameters: [42] }]
    },
    {
        reference: 'testContract2',
        contractAddress: '0x66BF8e2E890eA0392e158e77C6381b34E0771318',
        abi: [ { name: 'fooTwo', type: 'function', inputs: [ { name: 'example', type: 'uint256' } ], outputs: [ { name: 'amounts', type: 'uint256', name: "path", "type": "address[]" }] } ],
        calls: [{ reference: 'fooTwoCall', methodName: 'fooTwo', methodParameters: [42] }]
    }
];

const results: ContractCallResults = await multicall.call(contractCallContext);
console.log(results);

// results:
{
  results: {
      testContract: {
          originalContractCallContext:  {
            reference: 'testContract',
            contractAddress: '0x6795b15f3b16Cf8fB3E56499bbC07F6261e9b0C3',
            abi: [ { name: 'foo', type: 'function', inputs: [ { name: 'example', type: 'uint256' } ], outputs: [ { name: 'amounts', type: 'uint256' }] }, { name: 'foo_fail', type: 'function', inputs: [ { name: 'example', type: 'uint256' } ], outputs: [ { name: 'amounts', type: 'uint256' }] } ],
             calls: [{ reference: 'fooCall', methodName: 'foo', methodParameters: [42] }, { reference: 'fooCall_fail', methodName: 'foo_fail', methodParameters: [42] }]
          },
          callsReturnContext: [{
              returnValues: [{ amounts: BigNumber }],
              decoded: true,
              reference: 'fooCall',
              methodName: 'foo',
              methodParameters: [42],
              success: true
          },
          {
              returnValues: [],
              decoded: false,
              reference: 'fooCall_fail',
              methodName: 'foo_fail',
              methodParameters: [42],
              success: false
          }]
      },
      testContract2: {
          originalContractCallContext:  {
            reference: 'testContract2',
            contractAddress: '0x66BF8e2E890eA0392e158e77C6381b34E0771318',
            abi: [ { name: 'fooTwo', type: 'function', inputs: [ { name: 'example', type: 'uint256' } ], outputs: [ { name: 'amounts', type: 'uint256[]' ] } ],
            calls: [{ reference: 'fooTwoCall', methodName: 'fooTwo', methodParameters: [42] }]
          },
          callsReturnContext: [{
              returnValues: [{ amounts: [BigNumber, BigNumber, BigNumber] }],
              decoded: true,
              reference: 'fooCall',
              methodName: 'foo',
              methodParameters: [42],
              success: true
          }]
      }
  },
  blockNumber: 10994677
}
```

### custom jsonrpc provider usage example

```ts
import {
  Multicall,
  ContractCallResults,
  ContractCallContext,
} from 'ethereum-multicall';

const multicall = new Multicall({ nodeUrl: 'https://some.local-or-remote.node:8546', tryAggregate: true });

const contractCallContext: ContractCallContext[] = [
    {
        reference: 'testContract',
        contractAddress: '0x6795b15f3b16Cf8fB3E56499bbC07F6261e9b0C3',
        abi: [ { name: 'foo', type: 'function', inputs: [ { name: 'example', type: 'uint256' } ], outputs: [ { name: 'amounts', type: 'uint256' }] } ],
        calls: [{ reference: 'fooCall', methodName: 'foo', methodParameters: [42] }]
    },
    {
        reference: 'testContract2',
        contractAddress: '0x66BF8e2E890eA0392e158e77C6381b34E0771318',
        abi: [ { name: 'fooTwo', type: 'function', inputs: [ { name: 'example', type: 'uint256' } ], outputs: [ { name: 'amounts', type: 'uint256', name: "path", "type": "address[]" }] } ],
        calls: [{ reference: 'fooTwoCall', methodName: 'fooTwo', methodParameters: [42] }]
    }
];

const results: ContractCallResults = await multicall.call(contractCallContext);
console.log(results);

// results:
{
  results: {
      testContract: {
          originalContractCallContext:  {
            reference: 'testContract',
            contractAddress: '0x6795b15f3b16Cf8fB3E56499bbC07F6261e9b0C3',
            abi: [ { name: 'foo', type: 'function', inputs: [ { name: 'example', type: 'uint256' } ], outputs: [ { name: 'amounts', type: 'uint256' }] } ],
            calls: [{ reference: 'fooCall', methodName: 'foo', methodParameters: [42] }]
          },
          callsReturnContext: [{
              returnValues: [{ amounts: BigNumber }],
              decoded: true,
              reference: 'fooCall',
              methodName: 'foo',
              methodParameters: [42],
              success: true
          }]
      },
      testContract2: {
          originalContractCallContext:  {
            reference: 'testContract2',
            contractAddress: '0x66BF8e2E890eA0392e158e77C6381b34E0771318',
            abi: [ { name: 'fooTwo', type: 'function', inputs: [ { name: 'example', type: 'uint256' } ], outputs: [ { name: 'amounts', type: 'uint256[]' ] } ],
            calls: [{ reference: 'fooTwoCall', methodName: 'fooTwo', methodParameters: [42] }]
          },
          callsReturnContext: [{
              returnValues: [{ amounts: [BigNumber, BigNumber, BigNumber] }],
              decoded: true,
              reference: 'fooCall',
              methodName: 'foo',
              methodParameters: [42],
              success: true
          }]
      }
  },
  blockNumber: 10994677
}
```

### Multicall contracts

by default it looks at your network from the provider you passed in and makes the contract address to the known multicall contract addresses `0xcA11bde05977b3631167028862bE2a173976CA11` this is deployed on every single network but `etherlite` which uses `0x21681750D7ddCB8d1240eD47338dC984f94AF2aC`.

````ts

If you wanted this to point at a different multicall contract address just pass that in the options when creating the multicall instance, example:

```ts
const multicall = new Multicall({
  multicallCustomContractAddress: '0x5BA1e12693Dc8F9c48aAD8770482f4739bEeD696',
  // your rest of your config depending on the provider your using.
});
````

## Issues

Please raise any issues in the below link.

https://github.com/joshstevens19/ethereum-multicall/issues

## Thanks And Support

This package is brought to you by [Josh Stevens](https://github.com/joshstevens19). My aim is to be able to keep creating these awesome packages to help the Ethereum space grow with easier-to-use tools to allow the learning curve to get involved with blockchain development easier and making Ethereum ecosystem better. If you want to help with that vision and allow me to invest more time into creating cool packages or if this package has saved you a lot of development time donations are welcome, every little helps. By donating, you are supporting me to be able to maintain existing packages, extend existing packages (as Ethereum matures), and allowing me to build more packages for Ethereum due to being able to invest more time into it. Thanks, everyone!

## Direct donations

Direct donations any token accepted - Eth address > `0x699c2daD091ffcF18f3cd9E8495929CA3a64dFe1`

## Github sponsors

[sponsor me](https://github.com/sponsors/joshstevens19) via github using fiat money
