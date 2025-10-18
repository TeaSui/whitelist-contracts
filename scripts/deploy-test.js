const { ethers } = require("hardhat");

// Deploy with immediate start time for testing
async function main() {
    console.log("🚀 Deploying Test Contracts (Immediate Start)...\n");

    const [deployer] = await ethers.getSigners();
    console.log("Deploying with account:", deployer.address);

    // 1. Deploy WhitelistToken
    console.log("📝 Deploying WhitelistToken...");
    const WhitelistToken = await ethers.getContractFactory("WhitelistToken");
    const token = await WhitelistToken.deploy("WhitelistToken", "WLT", deployer.address);
    await token.waitForDeployment();
    const tokenAddress = await token.getAddress();
    console.log("✅ WhitelistToken deployed to:", tokenAddress);

    // 2. Deploy WhitelistSale with immediate start
    console.log("💰 Deploying WhitelistSale...");
    const WhitelistSale = await ethers.getContractFactory("WhitelistSale");

    const startTime = Math.floor(Date.now() / 1000) + 120; // Start in 2 minutes
    const endTime = startTime + (30 * 24 * 3600); // 30 days

    const sale = await WhitelistSale.deploy(
        tokenAddress,
        deployer.address,
        ethers.parseEther("0.001"), // 0.001 ETH per token
        ethers.parseEther("10"),    // min 10 tokens
        ethers.parseEther("10000"), // max 10000 tokens
        ethers.parseEther("100000000"), // 100M tokens available
        startTime,
        endTime,
        deployer.address
    );
    await sale.waitForDeployment();
    const saleAddress = await sale.getAddress();
    console.log("✅ WhitelistSale deployed to:", saleAddress);

    // 3. Setup: Mint tokens to sale contract
    console.log("🏭 Minting tokens to sale contract...");
    const mintTx = await token.mint(saleAddress, ethers.parseEther("100000000"));
    await mintTx.wait();
    console.log("✅ Tokens minted to sale contract");

    // 4. Enable claiming immediately
    console.log("🔓 Enabling token claiming...");
    const claimTx = await sale.setClaimEnabled(true, startTime);
    await claimTx.wait();
    console.log("✅ Token claiming enabled");

    // 5. Add test accounts to whitelist
    console.log("👤 Adding test accounts to whitelist...");
    const testAccounts = [
        "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", // Account 0
        "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", // Account 1
        "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", // Account 2
    ];
    const whitelistTx = await sale.updateWhitelistBatch(testAccounts, true);
    await whitelistTx.wait();
    console.log("✅ Test accounts whitelisted");

    console.log("\n📊 TEST DEPLOYMENT COMPLETE");
    console.log("═".repeat(50));
    console.log(`Token Contract: ${tokenAddress}`);
    console.log(`Sale Contract: ${saleAddress}`);
    console.log(`Sale is ACTIVE NOW (started 1 minute ago)`);
    console.log("═".repeat(50));

    console.log(`\n💾 Test addresses:`);
    console.log(`TOKEN_ADDRESS="${tokenAddress}"`);
    console.log(`SALE_ADDRESS="${saleAddress}"`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Error:", error);
        process.exit(1);
    });