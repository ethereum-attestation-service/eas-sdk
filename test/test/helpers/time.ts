import { ethers } from 'hardhat';

export * from '../../utils/Time';

export const latest = async () => {
  const block = await ethers.provider.getBlock('latest');
  if (!block) {
    throw new Error('Unable to get the latest block');
  }

  return BigInt(block.timestamp);
};
