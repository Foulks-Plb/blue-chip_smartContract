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

        expect((await contract.matchId(0)).isActive).to.equal(true);
        expect((await contract.matchId(0)).endAt).to.equal(time);
        expect((await contract.matchId(0)).price).to.equal(2);
        expect((await contract.matchId(1)).isActive).to.equal(false);
        expect((await contract.matchId(1)).endAt).to.equal(time);
        expect((await contract.matchId(1)).price).to.equal(4);
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
        
        expect((await contract.idData(0)).pricePool).to.equal(2);
        expect((await contract.idData(0)).inA).to.equal(1);
        expect((await contract.idData(0)).inB).to.equal(0);
        expect((await contract.idData(0)).inEquality).to.equal(0); 

        expect(await contract.idAddressBetLeverage(0, addr1.address, 0)).to.equal(1);  
        expect((await contract.idAddressBetResult(0, addr1.address, 0)).winA).to.equal(true);
        expect((await contract.idAddressBetResult(0, addr1.address, 0)).winB).to.equal(false);
        expect((await contract.idAddressBetResult(0, addr1.address, 0)).equality).to.equal(false);
        expect(await contract.idAddressNbrbet(0, addr1.address)).to.equal(1);
    });

    it('Should bet many times with leverage', async function () {      
      await contract.connect(addr1).bet(0, 1, false, true, false, { value: 2})
      await contract.connect(addr1).bet(0, 2, true, false, false, { value: 4})
      await contract.connect(addr1).bet(0, 3, false, false, true, { value: 6})

      expect(await contract.idAddressNbrbet(0, addr1.address)).to.equal(3);
      expect((await contract.idData(0)).pricePool).to.equal(12);
      expect((await contract.idData(0)).inA).to.equal(2);
      expect((await contract.idData(0)).inB).to.equal(1);
      expect((await contract.idData(0)).inEquality).to.equal(3);

      expect(await contract.idAddressBetLeverage(0, addr1.address, 0)).to.equal(1);  
      expect((await contract.idAddressBetResult(0, addr1.address, 0)).winA).to.equal(false);
      expect((await contract.idAddressBetResult(0, addr1.address, 0)).winB).to.equal(true);
      expect((await contract.idAddressBetResult(0, addr1.address, 0)).equality).to.equal(false);
      
      expect(await contract.idAddressBetLeverage(0, addr1.address, 1)).to.equal(2);  
      expect((await contract.idAddressBetResult(0, addr1.address, 1)).winA).to.equal(true);
      expect((await contract.idAddressBetResult(0, addr1.address, 1)).winB).to.equal(false);
      expect((await contract.idAddressBetResult(0, addr1.address, 1)).equality).to.equal(false);

      expect(await contract.idAddressBetLeverage(0, addr1.address, 2)).to.equal(3);  
      expect((await contract.idAddressBetResult(0, addr1.address, 2)).winA).to.equal(false);
      expect((await contract.idAddressBetResult(0, addr1.address, 2)).winB).to.equal(false);
      expect((await contract.idAddressBetResult(0, addr1.address, 2)).equality).to.equal(true);
    });

    it('Should by multiple user', async function () {      
      await contract.connect(addr1).bet(0, 2, false, false, true, { value: 4})
      await contract.connect(addr2).bet(0, 4, true, false, false, { value: 8})

      expect(await contract.idAddressNbrbet(0, addr1.address)).to.equal(1);
      expect(await contract.idAddressNbrbet(0, addr2.address)).to.equal(1);

      expect((await contract.idData(0)).pricePool).to.equal(12);
      expect((await contract.idData(0)).inA).to.equal(0);
      expect((await contract.idData(0)).inB).to.equal(2);
      expect((await contract.idData(0)).inEquality).to.equal(4);

      expect(await contract.idAddressBetLeverage(0, addr1.address, 0)).to.equal(2);  
      expect((await contract.idAddressBetResult(0, addr1.address, 0)).winA).to.equal(false);
      expect((await contract.idAddressBetResult(0, addr1.address, 0)).winB).to.equal(false);
      expect((await contract.idAddressBetResult(0, addr1.address, 0)).equality).to.equal(true);
      
      expect(await contract.idAddressBetLeverage(0, addr2.address, 0)).to.equal(4);  
      expect((await contract.idAddressBetResult(0, addr2.address, 0)).winA).to.equal(true);
      expect((await contract.idAddressBetResult(0, addr2.address, 0)).winB).to.equal(false);
      expect((await contract.idAddressBetResult(0, addr2.address, 0)).equality).to.equal(false);
    });
  });
});