const { ethers } = require("hardhat");

// ============================================
// SIMPLE CONTRACT DEPLOYMENT
// Edit the config below, then run this script
// ============================================

const DEPLOYMENT_CONFIG = {
    // Token Configuration
    tokenName: "WhitelistToken",
    tokenSymbol: "WLT",

    // Sale Configuration
    tokenPrice: "0.001",        // ETH per token
    minPurchase: "10",          // minimum tokens
    maxPurchase: "10000",       // maximum tokens
    maxSupply: "100000000",     // tokens for sale
    saleDurationDays: 30,       // how many days sale runs
};

async function main() {
    console.log("🚀 Deploying Contracts...\n");

    const [deployer] = await ethers.getSigners();
    console.log("Deploying with account:", deployer.address);
    console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

    // 1. Deploy WhitelistToken
    console.log("📝 Deploying WhitelistToken...");
    const WhitelistToken = await ethers.getContractFactory("WhitelistToken");
    const token = await WhitelistToken.deploy(
        DEPLOYMENT_CONFIG.tokenName,
        DEPLOYMENT_CONFIG.tokenSymbol,
        deployer.address // initial owner
    );
    await token.waitForDeployment();
    const tokenAddress = await token.getAddress();
    console.log("✅ WhitelistToken deployed to:", tokenAddress);

    // 2. Deploy WhitelistSale
    console.log("💰 Deploying WhitelistSale...");
    const WhitelistSale = await ethers.getContractFactory("WhitelistSale");

    const startTime = Math.floor(Date.now() / 1000) + 300; // Start in 5 minutes
    const endTime = startTime + (DEPLOYMENT_CONFIG.saleDurationDays * 24 * 3600);

    const sale = await WhitelistSale.deploy(
        tokenAddress,                                    // token address
        deployer.address,                               // treasury address
        ethers.parseEther(DEPLOYMENT_CONFIG.tokenPrice), // token price
        ethers.parseEther(DEPLOYMENT_CONFIG.minPurchase), // min purchase
        ethers.parseEther(DEPLOYMENT_CONFIG.maxPurchase), // max purchase
        ethers.parseEther(DEPLOYMENT_CONFIG.maxSupply),   // max supply
        startTime,                                       // start time
        endTime,                                         // end time
        deployer.address                                 // initial owner
    );
    await sale.waitForDeployment();
    const saleAddress = await sale.getAddress();
    console.log("✅ WhitelistSale deployed to:", saleAddress);

    // 3. Setup: Mint tokens to sale contract
    console.log("🏭 Minting tokens to sale contract...");
    const mintTx = await token.mint(saleAddress, ethers.parseEther(DEPLOYMENT_CONFIG.maxSupply));
    await mintTx.wait();
    console.log("✅ Tokens minted to sale contract");

    // 4. Enable claiming
    console.log("🔓 Enabling token claiming...");
    const claimTx = await sale.setClaimEnabled(true, startTime);
    await claimTx.wait();
    console.log("✅ Token claiming enabled");

    // 5. Summary
    console.log("\n📊 DEPLOYMENT COMPLETE");
    console.log("═".repeat(50));
    console.log(`Token Contract: ${tokenAddress}`);
    console.log(`Sale Contract: ${saleAddress}`);
    console.log(`Token Name: ${DEPLOYMENT_CONFIG.tokenName}`);
    console.log(`Token Symbol: ${DEPLOYMENT_CONFIG.tokenSymbol}`);
    console.log(`Token Price: ${DEPLOYMENT_CONFIG.tokenPrice} ETH`);
    console.log(`Sale Duration: ${DEPLOYMENT_CONFIG.saleDurationDays} days`);
    console.log(`Start Time: ${new Date(startTime * 1000).toISOString()}`);
    console.log(`End Time: ${new Date(endTime * 1000).toISOString()}`);
    console.log("═".repeat(50));

    console.log(`\n💾 Save these addresses:`);
    console.log(`TOKEN_ADDRESS="${tokenAddress}"`);
    console.log(`SALE_ADDRESS="${saleAddress}"`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Error:", error);
        process.exit(1);
    });