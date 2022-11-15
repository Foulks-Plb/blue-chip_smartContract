import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";
import { Bc__factory } from "../typechain-types";
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { BigNumber, Contract } from 'ethers';


describe('nft contract', function () {
  let precontract: any;
  let contract: Contract;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;
  let addr3: SignerWithAddress;
  let addrs: SignerWithAddress[];


  beforeEach(async function () {
      [owner, addr1, addr2, addr3, ...addrs] = await ethers.getSigners();
      precontract = await ethers.getContractFactory('Bc');
      contract = await precontract.deploy();
  });


  describe('Deployment', function () {
      it('Should set the right owner', async function () {
          expect(await contract.owner()).to.equal(owner.address);
      });
  });


  describe('Create match', function () {
    it('Should set match only by owner', async function () {
        const time = Number((await contract.getTimestamp()).toString()) + 1000;
        await contract.connect(owner).setMatch(0, true, 2, time)
        await contract.connect(owner).setMatch(1, false, 4, time)

        expect((await contract.idToMatch(0)).isActive).to.equal(true);
        expect((await contract.idToMatch(0)).endAt).to.equal(time);
        expect((await contract.idToMatch(0)).price).to.equal(2);
        expect((await contract.idToMatch(1)).isActive).to.equal(false);
        expect((await contract.idToMatch(1)).endAt).to.equal(time);
        expect((await contract.idToMatch(1)).price).to.equal(4);
    });

    it('Should cant set match by no owner', async function () {
      const time = Number((await contract.getTimestamp()).toString()) + 1000;
      await expect(contract.connect(addr1).setMatch(0, true, 2, time)).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });


  describe('bet on match', function () {

    beforeEach(async function () {
      [owner, addr1, addr2, addr3, ...addrs] = await ethers.getSigners();
      precontract = await ethers.getContractFactory('Bc');
      contract = await precontract.deploy();
      const time = Number((await contract.getTimestamp()).toString()) + 1000;
      await contract.connect(owner).setMatch(0, true, 2, time)
      await contract.connect(owner).setMatch(1, false, 4, time)
    });

    it('Should bet normaly', async function () {      
        await contract.connect(addr1).bet(0, 1, true, false, false, { value: 2})
        
        expect((await contract.idToMatchData(0)).pricePool).to.equal(2);
        expect((await contract.idToMatchData(0)).inA).to.equal(1);
        expect((await contract.idToMatchData(0)).inB).to.equal(0);
        expect((await contract.idToMatchData(0)).inEquality).to.equal(0); 

        expect(await contract.addressLeverage(0, addr1.address)).to.equal(1);  
        expect((await contract.addressToResult(0, addr1.address)).winA).to.equal(true);
        expect((await contract.addressToResult(0, addr1.address)).winB).to.equal(false);
        expect((await contract.addressToResult(0, addr1.address)).equality).to.equal(false);
    });
  });
});