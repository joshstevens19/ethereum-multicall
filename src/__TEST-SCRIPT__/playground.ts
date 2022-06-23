import { ethers } from 'ethers';
import { ContractCallContext, ContractCallResults, Multicall } from '../';

const execute = async () => {
  const provider = new ethers.providers.InfuraProvider(
    42,
    '9aa3d95b3bc440fa88ea12eaa4456161'
  );

  // you can use any ethers provider context here this example is
  // just shows passing in a default provider, ethers hold providers in
  // other context like wallet, signer etc all can be passed in as well.
  const multicall = new Multicall({
    ethersProvider: provider,
    tryAggregate: true,
  });

  const contractCallContext: ContractCallContext = {
    reference: 'testContract',
    contractAddress: '0xD21d3A321eDc8ca5FEA387A4D082a349c86CCfE5',
    abi: [
      {
        inputs: [],
        name: 'globalPositionData',
        outputs: [
          {
            components: [
              { internalType: 'uint256', name: 'rawValue', type: 'uint256' },
            ],
            internalType: 'struct FixedPoint.Unsigned',
            name: 'totalTokensOutstanding',
            type: 'tuple',
          },
          {
            components: [
              { internalType: 'uint256', name: 'rawValue', type: 'uint256' },
            ],
            internalType: 'struct FixedPoint.Unsigned',
            name: 'rawTotalPositionCollateral',
            type: 'tuple',
          },
        ],
        stateMutability: 'view',
        type: 'function',
      },
    ],
    calls: [
      {
        reference: 'globalPositionDataCall',
        methodName: 'globalPositionData',
        methodParameters: [],
      },
    ],
  };

  const context: ContractCallResults = await multicall.call(
    contractCallContext
  );
  console.log(
    context.results[contractCallContext.reference].callsReturnContext[0]
      .returnValues
  );
  const latestBlock = await provider.getBlockNumber();
  const blockNumber = `${latestBlock - 15}`;
  const contextOnBlock: ContractCallResults = await multicall.call(
    contractCallContext,
    { blockNumber }
  );
  console.log({
    latestBlock,
    blockNumber,
    resultBlock: contextOnBlock.blockNumber,
  });
};

execute();
