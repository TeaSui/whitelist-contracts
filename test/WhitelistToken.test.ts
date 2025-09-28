import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("WhitelistToken", function () {
  async function deployTokenFixture() {
    const [owner, addr1, addr2, addr3] = await ethers.getSigners();

    const WhitelistTokenFactory = await ethers.getContractFactory("WhitelistToken");
    const token = await WhitelistTokenFactory.deploy(
      "WhitelistToken",
      "WLT",
      owner.address
    );

    return { token, owner, addr1, addr2, addr3 };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { token, owner } = await loadFixture(deployTokenFixture);
      expect(await token.owner()).to.equal(owner.address);
    });

    it("Should set the correct token name and symbol", async function () {
      const { token } = await loadFixture(deployTokenFixture);
      expect(await token.name()).to.equal("WhitelistToken");
      expect(await token.symbol()).to.equal("WLT");
    });

    it("Should have correct decimals", async function () {
      const { token } = await loadFixture(deployTokenFixture);
      expect(await token.decimals()).to.equal(18);
    });

    it("Should have correct max supply", async function () {
      const { token } = await loadFixture(deployTokenFixture);
      expect(await token.MAX_SUPPLY()).to.equal(ethers.parseEther("1000000000"));
    });

    it("Should start with zero total supply", async function () {
      const { token } = await loadFixture(deployTokenFixture);
      expect(await token.totalSupply()).to.equal(0);
    });

    it("Should whitelist the owner initially", async function () {
      const { token, owner } = await loadFixture(deployTokenFixture);
      expect(await token.isWhitelisted(owner.address)).to.equal(true);
    });

    it("Should not have transfer restrictions initially", async function () {
      const { token } = await loadFixture(deployTokenFixture);
      expect(await token.transferRestricted()).to.equal(false);
    });
  });

  describe("Minting", function () {
    it("Should allow owner to mint tokens", async function () {
      const { token, owner, addr1 } = await loadFixture(deployTokenFixture);
      const mintAmount = ethers.parseEther("1000");

      await expect(token.mint(addr1.address, mintAmount))
        .to.emit(token, "Mint")
        .withArgs(addr1.address, mintAmount);

      expect(await token.balanceOf(addr1.address)).to.equal(mintAmount);
      expect(await token.totalSupply()).to.equal(mintAmount);
    });

    it("Should not allow non-owner to mint tokens", async function () {
      const { token, addr1, addr2 } = await loadFixture(deployTokenFixture);
      const mintAmount = ethers.parseEther("1000");

      await expect(token.connect(addr1).mint(addr2.address, mintAmount))
        .to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount");
    });

    it("Should not allow minting to zero address", async function () {
      const { token } = await loadFixture(deployTokenFixture);
      const mintAmount = ethers.parseEther("1000");

      await expect(token.mint(ethers.ZeroAddress, mintAmount))
        .to.be.revertedWith("WhitelistToken: cannot mint to zero address");
    });

    it("Should not allow minting beyond max supply", async function () {
      const { token, addr1 } = await loadFixture(deployTokenFixture);
      const maxSupply = await token.MAX_SUPPLY();

      await expect(token.mint(addr1.address, maxSupply + 1n))
        .to.be.revertedWith("WhitelistToken: exceeds maximum supply");
    });

    it("Should return correct remaining mintable supply", async function () {
      const { token, addr1 } = await loadFixture(deployTokenFixture);
      const maxSupply = await token.MAX_SUPPLY();
      const mintAmount = ethers.parseEther("1000");

      expect(await token.remainingMintableSupply()).to.equal(maxSupply);

      await token.mint(addr1.address, mintAmount);
      expect(await token.remainingMintableSupply()).to.equal(maxSupply - mintAmount);
    });
  });

  describe("Whitelist Management", function () {
    it("Should allow owner to update whitelist", async function () {
      const { token, addr1 } = await loadFixture(deployTokenFixture);

      await expect(token.updateWhitelist(addr1.address, true))
        .to.emit(token, "WhitelistUpdated")
        .withArgs(addr1.address, true);

      expect(await token.isWhitelisted(addr1.address)).to.equal(true);

      await expect(token.updateWhitelist(addr1.address, false))
        .to.emit(token, "WhitelistUpdated")
        .withArgs(addr1.address, false);

      expect(await token.isWhitelisted(addr1.address)).to.equal(false);
    });

    it("Should not allow non-owner to update whitelist", async function () {
      const { token, addr1, addr2 } = await loadFixture(deployTokenFixture);

      await expect(token.connect(addr1).updateWhitelist(addr2.address, true))
        .to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount");
    });

    it("Should not allow whitelisting zero address", async function () {
      const { token } = await loadFixture(deployTokenFixture);

      await expect(token.updateWhitelist(ethers.ZeroAddress, true))
        .to.be.revertedWith("WhitelistToken: cannot whitelist zero address");
    });

    it("Should allow batch whitelist updates", async function () {
      const { token, addr1, addr2, addr3 } = await loadFixture(deployTokenFixture);
      const addresses = [addr1.address, addr2.address, addr3.address];

      await token.updateWhitelistBatch(addresses, true);

      for (const address of addresses) {
        expect(await token.isWhitelisted(address)).to.equal(true);
      }

      await token.updateWhitelistBatch(addresses, false);

      for (const address of addresses) {
        expect(await token.isWhitelisted(address)).to.equal(false);
      }
    });

    it("Should not allow empty batch whitelist update", async function () {
      const { token } = await loadFixture(deployTokenFixture);

      await expect(token.updateWhitelistBatch([], true))
        .to.be.revertedWith("WhitelistToken: empty accounts array");
    });
  });

  describe("Transfer Restrictions", function () {
    it("Should allow owner to set transfer restrictions", async function () {
      const { token } = await loadFixture(deployTokenFixture);

      await expect(token.setTransferRestrictions(true))
        .to.emit(token, "TransferRestrictionsUpdated")
        .withArgs(true);

      expect(await token.transferRestricted()).to.equal(true);

      await expect(token.setTransferRestrictions(false))
        .to.emit(token, "TransferRestrictionsUpdated")
        .withArgs(false);

      expect(await token.transferRestricted()).to.equal(false);
    });

    it("Should not allow non-owner to set transfer restrictions", async function () {
      const { token, addr1 } = await loadFixture(deployTokenFixture);

      await expect(token.connect(addr1).setTransferRestrictions(true))
        .to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount");
    });

    it("Should enforce whitelist when transfer restrictions are enabled", async function () {
      const { token, owner, addr1, addr2 } = await loadFixture(deployTokenFixture);
      const mintAmount = ethers.parseEther("1000");

      // Mint tokens to owner
      await token.mint(owner.address, mintAmount);

      // Enable transfer restrictions
      await token.setTransferRestrictions(true);

      // Transfer should work from whitelisted owner to any address
      await token.transfer(addr1.address, ethers.parseEther("100"));

      // Transfer from non-whitelisted address should fail
      await expect(token.connect(addr1).transfer(addr2.address, ethers.parseEther("50")))
        .to.be.revertedWith("WhitelistToken: transfer restricted to whitelisted addresses");

      // Whitelist addr1 and try again
      await token.updateWhitelist(addr1.address, true);
      await token.connect(addr1).transfer(addr2.address, ethers.parseEther("50"));

      expect(await token.balanceOf(addr2.address)).to.equal(ethers.parseEther("50"));
    });

    it("Should allow transfers when restrictions are disabled", async function () {
      const { token, owner, addr1, addr2 } = await loadFixture(deployTokenFixture);
      const mintAmount = ethers.parseEther("1000");

      // Mint tokens to owner
      await token.mint(owner.address, mintAmount);

      // Transfer to non-whitelisted address
      await token.transfer(addr1.address, ethers.parseEther("100"));

      // Transfer between non-whitelisted addresses should work
      await token.connect(addr1).transfer(addr2.address, ethers.parseEther("50"));

      expect(await token.balanceOf(addr2.address)).to.equal(ethers.parseEther("50"));
    });
  });

  describe("Pausable", function () {
    it("Should allow owner to pause and unpause", async function () {
      const { token } = await loadFixture(deployTokenFixture);

      await token.pause();
      expect(await token.paused()).to.equal(true);

      await token.unpause();
      expect(await token.paused()).to.equal(false);
    });

    it("Should not allow transfers when paused", async function () {
      const { token, owner, addr1 } = await loadFixture(deployTokenFixture);
      const mintAmount = ethers.parseEther("1000");

      await token.mint(owner.address, mintAmount);
      await token.pause();

      await expect(token.transfer(addr1.address, ethers.parseEther("100")))
        .to.be.revertedWithCustomError(token, "EnforcedPause");
    });

    it("Should not allow minting when paused", async function () {
      const { token, addr1 } = await loadFixture(deployTokenFixture);
      const mintAmount = ethers.parseEther("1000");

      await token.pause();
      
      await expect(token.mint(addr1.address, mintAmount))
        .to.be.revertedWithCustomError(token, "EnforcedPause");
    });
  });

  describe("Emergency Functions", function () {
    it("Should allow owner to recover ERC20 tokens", async function () {
      const { token, owner, addr1 } = await loadFixture(deployTokenFixture);

      // Deploy another token for testing
      const TestTokenFactory = await ethers.getContractFactory("WhitelistToken");
      const testToken = await TestTokenFactory.deploy("TestToken", "TEST", owner.address);
      
      // Mint test tokens to main contract
      await testToken.mint(token.target, ethers.parseEther("100"));

      // Recover tokens
      await token.recoverERC20(testToken.target, addr1.address, ethers.parseEther("100"));

      expect(await testToken.balanceOf(addr1.address)).to.equal(ethers.parseEther("100"));
    });

    it("Should not allow recovering own tokens", async function () {
      const { token, addr1 } = await loadFixture(deployTokenFixture);

      await expect(token.recoverERC20(token.target, addr1.address, ethers.parseEther("100")))
        .to.be.revertedWith("WhitelistToken: cannot recover own tokens");
    });

    it("Should not accept ETH", async function () {
      const { token, addr1 } = await loadFixture(deployTokenFixture);

      await expect(addr1.sendTransaction({
        to: token.target,
        value: ethers.parseEther("1")
      })).to.be.revertedWith("WhitelistToken: contract does not accept ETH");
    });
  });

  describe("Burning", function () {
    it("Should allow token holders to burn their tokens", async function () {
      const { token, owner, addr1 } = await loadFixture(deployTokenFixture);
      const mintAmount = ethers.parseEther("1000");

      await token.mint(addr1.address, mintAmount);
      
      await token.connect(addr1).burn(ethers.parseEther("100"));

      expect(await token.balanceOf(addr1.address)).to.equal(ethers.parseEther("900"));
      expect(await token.totalSupply()).to.equal(ethers.parseEther("900"));
    });
  });
});