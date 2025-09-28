const { ethers } = require("hardhat");

// ============================================
// SIMPLE SALE CHECKER
// Edit the addresses below, then run this script
// ============================================

const TOKEN_ADDRESS = "PUT_YOUR_TOKEN_ADDRESS_HERE";
const SALE_ADDRESS = "PUT_YOUR_SALE_ADDRESS_HERE";

async function main() {
    console.log("🔍 Checking Sale Info...\n");

    if (!TOKEN_ADDRESS || TOKEN_ADDRESS === "PUT_YOUR_TOKEN_ADDRESS_HERE") {
        console.log("❌ Please edit this script and put your token address in TOKEN_ADDRESS");
        return;
    }

    if (!SALE_ADDRESS || SALE_ADDRESS === "PUT_YOUR_SALE_ADDRESS_HERE") {
        console.log("❌ Please edit this script and put your sale address in SALE_ADDRESS");
        return;
    }

    try {
        const token = await ethers.getContractAt("WhitelistToken", TOKEN_ADDRESS);
        const sale = await ethers.getContractAt("WhitelistSale", SALE_ADDRESS);
        const [account] = await ethers.getSigners();

        // Get token info
        const name = await token.name();
        const symbol = await token.symbol();

        // Get sale info
        const tokenPrice = await sale.tokenPrice();
        const minPurchase = await sale.minPurchase();
        const maxPurchase = await sale.maxPurchase();
        const maxSupply = await sale.maxSupply();
        const startTime = await sale.startTime();
        const endTime = await sale.endTime();
        const isActive = await sale.isActive();
        const claimEnabled = await sale.claimEnabled();

        console.log("📊 TOKEN INFORMATION");
        console.log("═".repeat(50));
        console.log(`Address: ${TOKEN_ADDRESS}`);
        console.log(`Name: ${name}`);
        console.log(`Symbol: ${symbol}`);
        console.log(`Total Supply: ${ethers.formatEther(await token.totalSupply())} ${symbol}`);

        console.log("\n💰 SALE INFORMATION");
        console.log("═".repeat(50));
        console.log(`Address: ${SALE_ADDRESS}`);
        console.log(`Token Price: ${ethers.formatEther(tokenPrice)} ETH`);
        console.log(`Min Purchase: ${ethers.formatEther(minPurchase)} ${symbol}`);
        console.log(`Max Purchase: ${ethers.formatEther(maxPurchase)} ${symbol}`);
        console.log(`Max Supply: ${ethers.formatEther(maxSupply)} ${symbol}`);
        console.log(`Is Active: ${isActive}`);
        console.log(`Claim Enabled: ${claimEnabled}`);
        console.log(`Start Time: ${new Date(Number(startTime) * 1000).toISOString()}`);
        console.log(`End Time: ${new Date(Number(endTime) * 1000).toISOString()}`);

        console.log("\n👤 YOUR ACCOUNT");
        console.log("═".repeat(50));
        console.log(`Address: ${account.address}`);
        console.log(`ETH Balance: ${ethers.formatEther(await ethers.provider.getBalance(account.address))} ETH`);
        console.log(`Token Balance: ${ethers.formatEther(await token.balanceOf(account.address))} ${symbol}`);
        console.log(`Is Whitelisted: ${await token.whitelist(account.address)}`);

        // Check purchases
        try {
            const purchaseAmount = await sale.purchases(account.address);
            console.log(`Purchased Amount: ${ethers.formatEther(purchaseAmount)} ${symbol}`);
        } catch (error) {
            console.log("Purchased Amount: 0 ${symbol}");
        }

        console.log("\n✅ Sale check complete!");

    } catch (error) {
        console.log("❌ Error reading contracts:", error.message);
        console.log("\n💡 Possible issues:");
        console.log("   • Contract addresses are incorrect");
        console.log("   • Contracts are not deployed");
        console.log("   • Network connection issue");
        console.log(`   • Make sure Hardhat node is running`);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Error:", error);
        process.exit(1);
    });