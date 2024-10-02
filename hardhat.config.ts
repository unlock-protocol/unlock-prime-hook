import { HardhatUserConfig } from "hardhat/config";
import "@unlock-protocol/hardhat-plugin";
import "@nomicfoundation/hardhat-toolbox";
import networks from "@unlock-protocol/networks";

const config: HardhatUserConfig = {
  solidity: "0.8.27",
  networks: {
    hardhat: {
      hardfork: "london",
      gasPrice: 50000000000, // ?
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
};

export default config;
