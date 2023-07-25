import { BaseContract } from 'ethers';

const VERSION_ABI = [
  {
    inputs: [],
    name: 'VERSION',
    outputs: [
      {
        internalType: 'string',
        name: '',
        type: 'string'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  }
];

export const legacyVersion = async (contract: BaseContract): Promise<string | undefined> => {
  const provider = contract.runner?.provider;
  if (!provider) {
    throw new Error("provider wasn't set");
  }

  const legacyContract = new BaseContract(await contract.getAddress(), VERSION_ABI, provider);

  try {
    return await legacyContract.getFunction('VERSION').staticCall();
  } catch {
    return undefined;
  }
};
