import '@nomiclabs/hardhat-ethers';
import '@nomiclabs/hardhat-waffle';
import '@typechain/hardhat';
import 'hardhat-dependency-compiler';
import { HardhatUserConfig } from 'hardhat/config';

const config: HardhatUserConfig = {
  networks: {
    hardhat: {
      accounts: {
        count: 20,
        accountsBalance: '10000000000000000000000000000000000000000000000'
      },
      allowUnlimitedContractSize: true
    }
  },

  solidity: {
    version: '0.8.18',
    settings: {
      optimizer: {
        enabled: true,
        runs: 100000,
        details: {
          yul: true
        }
      },
      metadata: {
        bytecodeHash: 'none'
      }
    }
  },

  dependencyCompiler: {
    paths: [
      '@ethereum-attestation-service/eas-contracts/contracts/EAS.sol',
      '@ethereum-attestation-service/eas-contracts/contracts/SchemaRegistry.sol'
    ]
  },

  mocha: {
    timeout: 600000,
    color: true,
    bail: true
  }
};

export default config;
