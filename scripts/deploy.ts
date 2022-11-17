import { ethers } from "hardhat";

async function main() {
  const Bc = await ethers.getContractFactory("Bc");
  const bc = await Bc.deploy();

  await bc.deployed();

  console.log(`deployed to ${bc.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
