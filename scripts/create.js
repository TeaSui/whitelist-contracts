const { ethers } = require("hardhat");

// ============================================
// SIMPLE TOKEN CREATOR
// Edit the config below, then run this script
// ============================================

const TOKEN_CONFIG = {
    name: "My Token",        // Change this
    symbol: "MTK",           // Change this
    mintAmount: "1000000",   // Change this (number of tokens to mint)
};

async function main() {
    console.log("🪙 Creating New Token...\n");

    const [deployer] = await ethers.getSigners();
    console.log("Deploying with account:", deployer.address);
    console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

    // Deploy token
    console.log("🚀 Deploying token...");
    const WhitelistToken = await ethers.getContractFactory("WhitelistToken");
    const token = await WhitelistToken.deploy(
        TOKEN_CONFIG.name,
        TOKEN_CONFIG.symbol,
        deployer.address
    );
    await token.waitForDeployment();

    const tokenAddress = await token.getAddress();
    console.log("✅ Token deployed to:", tokenAddress);

    // Mint tokens if requested
    if (TOKEN_CONFIG.mintAmount !== "0") {
        console.log("🏭 Minting tokens...");
        const mintTx = await token.mint(deployer.address, ethers.parseEther(TOKEN_CONFIG.mintAmount));
        await mintTx.wait();
        console.log(`✅ Minted ${TOKEN_CONFIG.mintAmount} ${TOKEN_CONFIG.symbol} tokens`);
    }

    // Show token info
    console.log("\n📊 Token Created:");
    console.log(`Name: ${await token.name()}`);
    console.log(`Symbol: ${await token.symbol()}`);
    console.log(`Address: ${tokenAddress}`);
    console.log(`Total Supply: ${ethers.formatEther(await token.totalSupply())} ${TOKEN_CONFIG.symbol}`);
    console.log(`Your Balance: ${ethers.formatEther(await token.balanceOf(deployer.address))} ${TOKEN_CONFIG.symbol}`);

    console.log(`\n💾 Save this address: ${tokenAddress}`);
    console.log(`\n📝 To check this token later, edit scripts/check.js and put: "${tokenAddress}"`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Error:", error);
        process.exit(1);
    });