import { expect } from "chai";
import { ethers, network } from "hardhat";
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

import { BigNumber, Contract } from 'ethers';

describe('contract bet', function () {
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
        await contract.connect(owner).setMatch(0, true, 2, time, 10)
        await contract.connect(owner).setMatch(1, false, 4, time, 10)

        expect((await contract.matchId(0)).isActive).to.equal(true);
        expect((await contract.matchId(0)).endAt).to.equal(time);
        expect((await contract.matchId(0)).price).to.equal(2);
        expect((await contract.matchId(1)).isActive).to.equal(false);
        expect((await contract.matchId(1)).endAt).to.equal(time);
        expect((await contract.matchId(1)).price).to.equal(4);
    });

    it('Should cant set match by no owner', async function () {
      const time = Number((await contract.getTimestamp()).toString()) + 1000;
      await expect(contract.connect(addr1).setMatch(0, true, 2, time, 10)).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe('bet on match', function () {
    beforeEach(async function () {
      [owner, addr1, addr2, addr3, ...addrs] = await ethers.getSigners();
      precontract = await ethers.getContractFactory('Bc');
      contract = await precontract.deploy();
      const time = Number((await contract.getTimestamp()).toString()) + 1000;
      await contract.connect(owner).setMatch(0, true, 2, time, 10)
      await contract.connect(owner).setMatch(1, false, 4, time, 10)
      await contract.connect(owner).setMatch(2, true, 4, time, 10)
    });

    it('Should bet normaly', async function () {      
        await contract.connect(addr1).bet(0, 1, 0, { value: 2})
        
        expect((await contract.idData(0)).pricePool).to.equal(2);
        expect((await contract.idData(0)).inA).to.equal(1);
        expect((await contract.idData(0)).inB).to.equal(0);
        expect((await contract.idData(0)).inEquality).to.equal(0); 

        expect(await contract.idAddressBetLeverage(0, addr1.address, 0)).to.equal(1);  
        expect((await contract.idAddressBetResult(0, addr1.address, 0))).to.equal(0);
        expect(await contract.idAddressNbrbet(0, addr1.address)).to.equal(1);
    });

    it('Should bet many times with leverage', async function () {      
      await contract.connect(addr1).bet(0, 1, 1, { value: 2})
      await contract.connect(addr1).bet(0, 2, 0, { value: 4})
      await contract.connect(addr1).bet(0, 3, 2, { value: 6})

      expect(await contract.idAddressNbrbet(0, addr1.address)).to.equal(3);
      expect((await contract.idData(0)).pricePool).to.equal(12);
      expect((await contract.idData(0)).inA).to.equal(2);
      expect((await contract.idData(0)).inB).to.equal(1);
      expect((await contract.idData(0)).inEquality).to.equal(3);

      expect(await contract.idAddressBetLeverage(0, addr1.address, 0)).to.equal(1);  
      expect((await contract.idAddressBetResult(0, addr1.address, 0))).to.equal(1);
      
      expect(await contract.idAddressBetLeverage(0, addr1.address, 1)).to.equal(2);  
      expect((await contract.idAddressBetResult(0, addr1.address, 1))).to.equal(0);


      expect(await contract.idAddressBetLeverage(0, addr1.address, 2)).to.equal(3);  
      expect((await contract.idAddressBetResult(0, addr1.address, 2))).to.equal(2);
    });

    it('Should bet by multiple user', async function () {      
      await contract.connect(addr1).bet(0, 2, 2, { value: 4})
      await contract.connect(addr2).bet(0, 4, 0, { value: 8})

      expect(await contract.idAddressNbrbet(0, addr1.address)).to.equal(1);
      expect(await contract.idAddressNbrbet(0, addr2.address)).to.equal(1);

      expect((await contract.idData(0)).pricePool).to.equal(12);
      expect((await contract.idData(0)).inA).to.equal(4);
      expect((await contract.idData(0)).inB).to.equal(0);
      expect((await contract.idData(0)).inEquality).to.equal(2);

      expect(await contract.idAddressBetLeverage(0, addr1.address, 0)).to.equal(2);  
      expect((await contract.idAddressBetResult(0, addr1.address, 0))).to.equal(2);
      
      expect(await contract.idAddressBetLeverage(0, addr2.address, 0)).to.equal(4);  
      expect((await contract.idAddressBetResult(0, addr2.address, 0))).to.equal(0);
    });

    it('Should bet many times with leverage on different match', async function () {      
      await contract.connect(addr1).bet(0, 1, 1, { value: 2})
      await contract.connect(addr1).bet(0, 2, 0, { value: 4})
      await contract.connect(addr1).bet(2, 1, 2, { value: 4})

      expect(await contract.idAddressNbrbet(0, addr1.address)).to.equal(2);
      expect((await contract.idData(0)).pricePool).to.equal(6);
      expect((await contract.idData(0)).inA).to.equal(2);
      expect((await contract.idData(0)).inB).to.equal(1);
      expect((await contract.idData(0)).inEquality).to.equal(0);

      expect(await contract.idAddressNbrbet(2, addr1.address)).to.equal(1);
      expect((await contract.idData(2)).pricePool).to.equal(4);
      expect((await contract.idData(2)).inA).to.equal(0);
      expect((await contract.idData(2)).inB).to.equal(0);
      expect((await contract.idData(2)).inEquality).to.equal(1);

      expect(await contract.idAddressBetLeverage(0, addr1.address, 0)).to.equal(1);  
      expect((await contract.idAddressBetResult(0, addr1.address, 0))).to.equal(1);
      
      expect(await contract.idAddressBetLeverage(0, addr1.address, 1)).to.equal(2);  
      expect((await contract.idAddressBetResult(0, addr1.address, 1))).to.equal(0);

      expect(await contract.idAddressBetLeverage(2, addr1.address, 0)).to.equal(1);  
      expect((await contract.idAddressBetResult(2, addr1.address, 0))).to.equal(2);
    });

    it('Should not bet if not active', async function () {   
      await expect(contract.connect(addr1).bet(1, 1, 2, { value: 4})).to.be.revertedWith("not active");
    });

    it('Should not bet if wrong logic', async function () {   
      await expect(contract.connect(addr3).bet(0, 1, 4, { value: 2})).to.be.reverted;
      await expect(contract.connect(addr3).bet(0, 1, 3, { value: 2})).to.be.reverted;
    });

    it('Should not bet if leverage is 0', async function () {   
      await expect(contract.connect(addr3).bet(0, 0, 1, { value: 0})).to.be.revertedWith("wrong leverage");
    });

    it('Should execute transaction wrong leverage and value', async function () {      
      await expect(contract.connect(addr3).bet(0, 2, 2, { value: 2})).to.be.revertedWith("wrong value");
      await expect(contract.connect(addr3).bet(0, 2, 2, { value: 10})).to.be.revertedWith("wrong value");
    });

    it('Should execute transaction with royalties', async function () {  
      const time = Number((await contract.getTimestamp()).toString()) + 1000;    
      await contract.connect(owner).setMatch(5, true, ethers.utils.parseEther("1"), time, 10)

      expect(await ethers.provider.getBalance(contract.address)).to.equal(0);

      const walletOwnerS = Number(ethers.utils.formatEther(await ethers.provider.getBalance(owner.address)))

      await contract.connect(addr1).bet(5, 2, 2, { value: ethers.utils.parseEther("2")})
      expect(await ethers.provider.getBalance(contract.address)).to.equal(ethers.utils.parseEther((2 - 0.2).toString()));
      expect((await contract.connect(owner).idData(5)).pricePool).to.equal(ethers.utils.parseEther((2 - 0.2).toString()));

      const walletOwnerE = Number(ethers.utils.formatEther(await ethers.provider.getBalance(owner.address)))
      expect(Number((walletOwnerE - walletOwnerS).toFixed(1))).to.equal(0.2)
    });

    it('Should execute transaction with royalties', async function () {  
      const time = Number((await contract.getTimestamp()).toString()) + 1000;
      await contract.connect(owner).setMatch(6, true, 1, time, 10)

      await network.provider.send("evm_increaseTime", [1100]);
      await network.provider.send("evm_mine"); 
 
      await expect(contract.connect(addr1).bet(6, 1, 0, { value: 1})).to.be.revertedWith("out time");
    });
  });

  describe('set score', function () {
    beforeEach(async function () {
      [owner, addr1, addr2, addr3, ...addrs] = await ethers.getSigners();
      precontract = await ethers.getContractFactory('Bc');
      contract = await precontract.deploy();
      const time = Number((await contract.getTimestamp()).toString()) + 1000;
      await contract.connect(owner).setMatch(0, true, 2, time, 10)
      await contract.connect(owner).setMatch(1, true, 4, time, 10)
    });

    it('Should set score by owner', async function () {      
        await contract.connect(owner).setResult(0, 0)
        await contract.connect(owner).setResult(1, 2)
    });

    it('Should not set score if is not owner', async function () {      
      await expect(contract.connect(addr1).setResult(0, 2)).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it('Should not set score with multiple team win', async function () {      
      await expect(contract.connect(owner).setResult(0, 4)).to.be.reverted;
    });
  });

  describe('claim', function () {
    beforeEach(async function () {
      [owner, addr1, addr2, addr3, ...addrs] = await ethers.getSigners();
      precontract = await ethers.getContractFactory('Bc');
      contract = await precontract.deploy();
      const time = Number((await contract.getTimestamp()).toString()) + 1000;
      await contract.connect(owner).setMatch(0, true, 100, time, 10)

      await contract.connect(addr1).bet(0, 1, 0, { value: 100})
      await contract.connect(addr1).bet(0, 2, 0, { value: 200})
      await contract.connect(addr2).bet(0, 3, 1, { value: 300})
      await contract.connect(addr3).bet(0, 5, 2, { value: 500})
      await contract.connect(owner).bet(0, 1, 0, { value: 100})
      await contract.connect(owner).setResult(0, 0)
      await network.provider.send("evm_increaseTime", [1100]);
      await network.provider.send("evm_mine"); 
    });

    it('Should claim normaly', async function () {    
      expect(await ethers.provider.getBalance(contract.address)).to.equal(1080); 
      await contract.connect(addr1).claim(0, 0);
      expect(await contract.idAddressBetIsClaim(0, addr1.address, 0)).to.equal(true); 
      expect(await ethers.provider.getBalance(contract.address)).to.equal(1080 - 270); 

      expect(await contract.idAddressBetIsClaim(0, addr1.address, 1)).to.equal(false); 
      await contract.connect(addr1).claim(0, 1); 
      expect(await contract.idAddressBetIsClaim(0, addr1.address, 1)).to.equal(true); 
      expect(await ethers.provider.getBalance(contract.address)).to.equal(1080 - 270 - 540); 

      await expect(contract.connect(addr2).claim(0, 0)).to.be.revertedWith("not eligible"); 
      expect(await contract.idAddressBetIsClaim(0, addr2.address, 0)).to.equal(false);
      expect(await ethers.provider.getBalance(contract.address)).to.equal(1080 - 270 - 540); 

      await expect(contract.connect(addr3).claim(0, 0)).to.be.revertedWith("not eligible"); 
      expect(await ethers.provider.getBalance(contract.address)).to.equal(1080 - 270 - 540); 

      await contract.connect(owner).claim(0, 0)
      expect(await ethers.provider.getBalance(contract.address)).to.equal(0); 
    });

    it('Should cant claim with wrong result', async function () { 
      expect(await ethers.provider.getBalance(contract.address)).to.equal(1080); 
      await expect(contract.connect(addr3).claim(0, 0)).to.be.revertedWith("not eligible"); 
      expect(await ethers.provider.getBalance(contract.address)).to.equal(1080); 
    });

    it('Should cant claim two time', async function () { 
      expect(await ethers.provider.getBalance(contract.address)).to.equal(1080); 
      await contract.connect(addr1).claim(0, 0);
      expect(await ethers.provider.getBalance(contract.address)).to.equal(1080 - 270);  
      await expect(contract.connect(addr1).claim(0, 0)).to.be.revertedWith("already claim"); 
      expect(await ethers.provider.getBalance(contract.address)).to.equal(1080 - 270); 
    });

    it('Should cant claim with no result', async function () { 
      const time = Number((await contract.getTimestamp()).toString()) + 1000;
      await contract.connect(owner).setMatch(5, true, 100, time, 10)
      await contract.connect(addr1).bet(5, 1, 0, { value: 100})
      await expect(contract.connect(addr1).claim(5, 0)).to.be.reverted;
    });

    it('Should cant claim if time nor start', async function () { 
      const time = Number((await contract.getTimestamp()).toString()) + 1000;
      await contract.connect(owner).setMatch(6, true, 100, time, 10)
      await contract.connect(addr1).bet(6, 1, 0, { value: 100})
      await contract.connect(owner).setResult(6, 0)
      await expect(contract.connect(addr1).claim(6, 0)).to.be.revertedWith("out time");
      expect(await contract.idAddressBetIsClaim(6, addr1.address, 0)).to.equal(false); 
    });

    it('Should cant claim if match dont exist', async function () { 
      await expect(contract.connect(addr1).claim(10, 0)).to.be.revertedWith("never participate");
      expect(await contract.idAddressBetIsClaim(10, addr1.address, 0)).to.equal(false); 
    });
  });

  describe('free bet', function () {
    beforeEach(async function () {
      [owner, addr1, addr2, addr3, ...addrs] = await ethers.getSigners();
      precontract = await ethers.getContractFactory('Bc');
      contract = await precontract.deploy();
      const time = Number((await contract.getTimestamp()).toString()) + 1000;
      await contract.connect(owner).setMatch(0, true, 100, time, 10) 
    });

    it('Should set free bet by owner', async function () {  
      expect(await contract.addressCanFreeBet(addr3.address)).to.equal(false);   
      await contract.connect(owner).setFreeBet(addr3.address, true)
      expect(await contract.addressCanFreeBet(addr3.address)).to.equal(true); 
      await contract.connect(owner).setFreeBet(addr3.address, false)
      expect(await contract.addressCanFreeBet(addr3.address)).to.equal(false); 
    });

    it('Should cant set free bet by no owner', async function () {  
      expect(await contract.addressCanFreeBet(addr3.address)).to.equal(false);   
      await expect(contract.connect(addr1).setFreeBet(addr3.address, true)).to.be.revertedWith("Ownable: caller is not the owner")
      expect(await contract.addressCanFreeBet(addr3.address)).to.equal(false); 
    });

    it('Should can free bet if user is allowed', async function () {  
      await contract.connect(owner).setFreeBet(addr3.address, true)

      await contract.connect(addr1).bet(0, 1, 0, { value: 100})
      await contract.connect(addr2).bet(0, 2, 1, { value: 200})
      await contract.connect(addr3).freeBet(0, 1)

      expect((await contract.idData(0)).pricePool).to.equal(270);
      expect((await contract.idData(0)).inA).to.equal(1);
      expect((await contract.idData(0)).inB).to.equal(3);
      expect((await contract.idData(0)).inEquality).to.equal(0); 

      expect(await contract.idAddressBetLeverage(0, addr3.address, 0)).to.equal(1);  
      expect((await contract.idAddressBetResult(0, addr3.address, 0))).to.equal(1);
      expect(await contract.idAddressNbrbet(0, addr3.address)).to.equal(1); 
    });

    it('Should cant free bet two time', async function () {  
      await contract.connect(owner).setFreeBet(addr3.address, true)

      await contract.connect(addr3).freeBet(0, 1)
      await expect(contract.connect(addr3).freeBet(0, 1)).to.be.revertedWith("cant freebet")
    });

    it('Should cant free bet if user is not allowed', async function () {  
      await expect(contract.connect(addr3).freeBet(0, 1)).to.be.revertedWith("cant freebet")
    });

    it('Should not free bet if not active', async function () {   
      await contract.connect(owner).setFreeBet(addr3.address, true);
      await expect(contract.connect(addr3).freeBet(1, 2)).to.be.revertedWith("not active");
    });

    it('Should not bet if wrong logic', async function () {   
      await contract.connect(owner).setFreeBet(addr3.address, true);
      await expect(contract.connect(addr3).freeBet(0, 4)).to.be.reverted;
      await expect(contract.connect(addr3).freeBet(0, 7)).to.be.reverted;
    });

    it('Should claim normaly by free bettor', async function () {  
      await contract.connect(owner).setFreeBet(addr3.address, true)

      await contract.connect(addr1).bet(0, 1, 0, { value: 100})
      await contract.connect(addr2).bet(0, 2, 1, { value: 200})
      await contract.connect(addr3).freeBet(0, 1)

      await network.provider.send("evm_increaseTime", [1100]);
      await network.provider.send("evm_mine"); 

      await contract.connect(owner).setResult(0, 1)
      expect(await ethers.provider.getBalance(contract.address)).to.equal(270); 
      await contract.connect(addr2).claim(0, 0);
      expect(await ethers.provider.getBalance(contract.address)).to.equal(270 - 180); 
      await contract.connect(addr3).claim(0, 0);
      expect(await ethers.provider.getBalance(contract.address)).to.equal(0); 
    });
  });
});
