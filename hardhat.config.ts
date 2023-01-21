import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
require("dotenv").config();

const {
  DEPLOY_PRIVATEKEY,
  API_BINANCESCAN
} = process.env;

//0x9D78488f7112A8aC3eb0cC77d839105A70909902

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.17",
    settings: {
      optimizer: {
        enabled: true
      }
     }
    },
  // defaultNetwork: "testnet",
  // networks: {
  //   testnet: {
  //     url: "https://data-seed-prebsc-1-s1.binance.org:8545",
  //     chainId: 97,
  //     gasPrice: 20000000000,
  //     accounts: [DEPLOY_PRIVATEKEY as string],
  //   },
  //   mainnet: {
  //     url: "https://bsc-dataseed.binance.org/",
  //     chainId: 56,
  //     gasPrice: 20000000000,
  //     accounts: [DEPLOY_PRIVATEKEY as string],
  //   }
  // },
  etherscan: {
    apiKey: API_BINANCESCAN
  }

};

export default config;
