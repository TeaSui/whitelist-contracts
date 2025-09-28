const { ethers } = require("hardhat");

async function deploySale(hre) {
  const { deployments, getNamedAccounts, network } = hre;
  const { deploy, get, log } = deployments;
  const { deployer, treasury } = await getNamedAccounts();

  log("----------------------------------------------------");
  log("Deploying WhitelistSale...");
  log("Network:", network.name);
  log("Deployer:", deployer);

  // Get the deployed token contract
  const whitelistToken = await get("WhitelistToken");
  log(`Using WhitelistToken at: ${whitelistToken.address}`);

  // Sale configuration
  const saleConfig = {
    tokenPrice: ethers.parseEther("0.001"), // 0.001 ETH per token
    minPurchase: ethers.parseEther("10"), // 10 tokens minimum
    maxPurchase: ethers.parseEther("10000"), // 10,000 tokens maximum
    maxSupply: ethers.parseEther("100000000"), // 100 million tokens for sale
    startTime: Math.floor(Date.now() / 1000) + 3600, // Start in 1 hour
    endTime: Math.floor(Date.now() / 1000) + 30 * 24 * 3600, // End in 30 days
  };

  // Use treasury if available, otherwise use deployer
  const treasuryAddress = treasury || deployer;

  const args = [
    whitelistToken.address, // token
    treasuryAddress, // treasury
    saleConfig.tokenPrice, // tokenPrice
    saleConfig.minPurchase, // minPurchase
    saleConfig.maxPurchase, // maxPurchase
    saleConfig.maxSupply, // maxSupply
    saleConfig.startTime, // startTime
    saleConfig.endTime, // endTime
    deployer, // initialOwner
  ];

  const whitelistSale = await deploy("WhitelistSale", {
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: network.config.chainId === 31337 ? 1 : 5,
  });

  log(`WhitelistSale deployed to: ${whitelistSale.address}`);

  // Transfer tokens to sale contract
  if (network.config.chainId === 31337) {
    log("Setting up sale contract with tokens...");

    const tokenContract = await ethers.getContractAt("WhitelistToken", whitelistToken.address);

    // Mint tokens for the sale
    const mintTx = await tokenContract.mint(whitelistSale.address, saleConfig.maxSupply);
    await mintTx.wait();

    log(`Minted ${ethers.formatEther(saleConfig.maxSupply)} tokens to sale contract`);

    // Enable claiming immediately for local testing
    const saleContract = await ethers.getContractAt("WhitelistSale", whitelistSale.address);
    const claimTx = await saleContract.setClaimEnabled(true, saleConfig.startTime);
    await claimTx.wait();

    log("Enabled token claiming");
  }

  // Log deployment summary
  log("----------------------------------------------------");
  log("Sale Deployment Summary:");
  log(`Sale Contract: ${whitelistSale.address}`);
  log(`Token Contract: ${whitelistToken.address}`);
  log(`Treasury: ${treasuryAddress}`);
  log(`Token Price: ${ethers.formatEther(saleConfig.tokenPrice)} ETH`);
  log(`Min Purchase: ${ethers.formatEther(saleConfig.minPurchase)} tokens`);
  log(`Max Purchase: ${ethers.formatEther(saleConfig.maxPurchase)} tokens`);
  log(`Max Supply: ${ethers.formatEther(saleConfig.maxSupply)} tokens`);
  log(`Start Time: ${new Date(saleConfig.startTime * 1000).toISOString()}`);
  log(`End Time: ${new Date(saleConfig.endTime * 1000).toISOString()}`);
  log("----------------------------------------------------");
}

module.exports.default = deploySale;
module.exports.tags = ["WhitelistSale", "sale"];
module.exports.dependencies = ["WhitelistToken"];