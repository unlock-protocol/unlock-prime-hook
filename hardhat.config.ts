import { HardhatUserConfig } from "hardhat/config";
import "@unlock-protocol/hardhat-plugin";
import "@nomicfoundation/hardhat-toolbox";
import networks from "@unlock-protocol/networks";

const config: HardhatUserConfig = {
  solidity: "0.8.27",
  networks: {
    base: {
      chainId: 8453,
      url: "https://rpc.unlock-protocol.com/8453",
      accounts: process.env.DEPLOYER_PRIVATE_KEY
        ? [process.env.DEPLOYER_PRIVATE_KEY]
        : [],
    },
    baseSepolia: {
      chainId: 84532,
      url: "https://rpc.unlock-protocol.com/84532",
      accounts: process.env.DEPLOYER_PRIVATE_KEY
        ? [process.env.DEPLOYER_PRIVATE_KEY]
        : [],
    },

    hardhat: {
      hardfork: "london",
      gasPrice: 100000000, // ?
      forking: {
        url: "https://rpc.unlock-protocol.com/8453",
        blockNumber: 20513139,
      },
      chainId: 8453,
      chains: {
        8453: {
          hardforkHistory: {
            berlin: 1000000,
            london: 2000000,
          },
        },
      },
    },
  },
  unlock: {
    8453: {
      unlockAddress: networks[8453].unlockAddress,
    },
  },
  etherscan: {
    apiKey: {
      base: "SYZF9HBSSGGVKXJNTP4318PT2HP4DRG4P5",
    },
  },
  sourcify: {
    enabled: true,
  },
};

export default config;
