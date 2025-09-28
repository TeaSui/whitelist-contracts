const { ethers } = require("hardhat");

// ============================================
// SIMPLE TOKEN CHECKER
// Edit the address below, then run this script
// ============================================

const TOKEN_ADDRESS = "0xdc64a140aa3e981100a9beca4e685f962f0cf6c9"; // PUT YOUR TOKEN ADDRESS HERE

async function main() {
    console.log("🔍 Checking Token Info...\n");

    if (!TOKEN_ADDRESS || TOKEN_ADDRESS === "PUT_YOUR_TOKEN_ADDRESS_HERE") {
        console.log("❌ Please edit this script and put your token address in TOKEN_ADDRESS");
        console.log("   Example: const TOKEN_ADDRESS = \"0x1234...\";");
        return;
    }

    try {
        const token = await ethers.getContractAt("WhitelistToken", TOKEN_ADDRESS);
        const [account] = await ethers.getSigners();

        const name = await token.name();
        const symbol = await token.symbol();

        console.log("📊 TOKEN INFORMATION");
        console.log("═".repeat(50));
        console.log(`Address: ${TOKEN_ADDRESS}`);
        console.log(`Name: ${name}`);
        console.log(`Symbol: ${symbol}`);
        console.log(`Total Supply: ${ethers.formatEther(await token.totalSupply())} ${symbol}`);
        console.log(`Max Supply: ${ethers.formatEther(await token.MAX_SUPPLY())} ${symbol}`);
        console.log(`Owner: ${await token.owner()}`);
        console.log(`Is Paused: ${await token.paused()}`);
        console.log(`Transfer Restricted: ${await token.transferRestricted()}`);

        console.log("\n👤 YOUR ACCOUNT");
        console.log("═".repeat(50));
        console.log(`Address: ${account.address}`);
        console.log(`ETH Balance: ${ethers.formatEther(await ethers.provider.getBalance(account.address))} ETH`);
        console.log(`Token Balance: ${ethers.formatEther(await token.balanceOf(account.address))} ${symbol}`);
        console.log(`Is Whitelisted: ${await token.whitelist(account.address)}`);

        console.log("\n✅ Token check complete!");

    } catch (error) {
        console.log("❌ Error reading token:", error.message);
        console.log("\n💡 Possible issues:");
        console.log("   • Token address is incorrect");
        console.log("   • Contract is not deployed");
        console.log("   • Network connection issue");
        console.log(`   • Make sure Hardhat node is running: docker-compose -f docker-compose-simple.yml ps`);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Error:", error);
        process.exit(1);
    });