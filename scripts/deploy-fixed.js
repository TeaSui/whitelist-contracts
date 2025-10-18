const { ethers } = require("hardhat");

// ============================================
// FIXED CONTRACT DEPLOYMENT
// Deploy the fixed WhitelistSaleFixed contract
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
    console.log("🚀 Deploying FIXED Contracts...\n");

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

    // 2. Deploy WhitelistSaleFixed (the fixed version)
    console.log("💰 Deploying WhitelistSaleFixed...");
    const WhitelistSaleFixed = await ethers.getContractFactory("WhitelistSaleFixed");

    const startTime = Math.floor(Date.now() / 1000) + 60; // Start in 1 minute
    const endTime = startTime + (DEPLOYMENT_CONFIG.saleDurationDays * 24 * 3600);

    const sale = await WhitelistSaleFixed.deploy(
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
    console.log("✅ WhitelistSaleFixed deployed to:", saleAddress);

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

    // 5. Whitelist test accounts (from Hardhat default accounts)
    console.log("👤 Adding test accounts to whitelist...");
    const testAccounts = [
        "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", // Account 0
        "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", // Account 1
        "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", // Account 2
        "0x90F79bf6EB2c4f870365E785982E1f101E93b906", // Account 3
        "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65", // Account 4
        "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc", // Account 5
        "0x976EA74026E726554dB657fA54763abd0C3a0aa9", // Account 6
        "0x14dC79964da2C08b23698B3D3cc7Ca32193d9955", // Account 7
        "0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f", // Account 8
        "0xa0Ee7A142d267C1f36714E4a8F75612F20a79720", // Account 9
        "0xE76844a9D809eaC5De362Ea71096cDf91932e09E", // Previously used address
    ];

    const whitelistTx = await sale.updateWhitelistBatch(testAccounts, true);
    await whitelistTx.wait();
    console.log("✅ Test accounts whitelisted");

    // 6. Summary
    console.log("\n📊 FIXED DEPLOYMENT COMPLETE");
    console.log("═".repeat(50));
    console.log(`Token Contract: ${tokenAddress}`);
    console.log(`Sale Contract (FIXED): ${saleAddress}`);
    console.log(`Token Name: ${DEPLOYMENT_CONFIG.tokenName}`);
    console.log(`Token Symbol: ${DEPLOYMENT_CONFIG.tokenSymbol}`);
    console.log(`Token Price: ${DEPLOYMENT_CONFIG.tokenPrice} ETH`);
    console.log(`Sale Duration: ${DEPLOYMENT_CONFIG.saleDurationDays} days`);
    console.log(`Start Time: ${new Date(startTime * 1000).toISOString()}`);
    console.log(`End Time: ${new Date(endTime * 1000).toISOString()}`);
    console.log("═".repeat(50));

    console.log(`\n💾 Update your frontend config with these addresses:`);
    console.log(`TOKEN_ADDRESS="${tokenAddress}"`);
    console.log(`SALE_ADDRESS="${saleAddress}"`);
    
    console.log(`\n🔧 Contract Differences:`);
    console.log(`- Uses WhitelistSaleFixed instead of WhitelistSale`);
    console.log(`- Properly tracks totalPurchased and totalClaimed separately`);
    console.log(`- Claim function only transfers unclaimed tokens`);
    console.log(`- Multiple purchases don't reset claimed status`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Error:", error);
        process.exit(1);
    });