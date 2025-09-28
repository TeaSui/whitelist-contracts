const { ethers } = require("hardhat");

// ============================================
// WHITELIST CHECKER
// Edit the addresses below, then run this script
// ============================================

const TOKEN_ADDRESS = "0xdc64a140aa3e981100a9beca4e685f962f0cf6c9";
const CHECK_ADDRESSES = [
    "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", // Your main account
    "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", // Second test account
    "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", // Third test account
    // Add more addresses here to check
];

async function main() {
    console.log("🔍 Checking Whitelist Status...\n");
    
    if (!TOKEN_ADDRESS || TOKEN_ADDRESS === "PUT_YOUR_TOKEN_ADDRESS_HERE") {
        console.log("❌ Please edit this script and put your token address in TOKEN_ADDRESS");
        return;
    }
    
    try {
        const token = await ethers.getContractAt("WhitelistToken", TOKEN_ADDRESS);
        
        console.log("📊 TOKEN INFO");
        console.log("═".repeat(50));
        console.log("Address:", TOKEN_ADDRESS);
        console.log("Name:", await token.name());
        console.log("Symbol:", await token.symbol());
        console.log("Transfer Restricted:", await token.transferRestricted());
        
        console.log("\n👥 WHITELIST STATUS");
        console.log("═".repeat(50));
        
        for (let i = 0; i < CHECK_ADDRESSES.length; i++) {
            const address = CHECK_ADDRESSES[i];
            const isWhitelisted = await token.whitelist(address);
            const balance = await token.balanceOf(address);
            
            console.log(`${i + 1}. ${address}`);
            console.log(`   Whitelisted: ${isWhitelisted ? '✅ YES' : '❌ NO'}`);
            console.log(`   Token Balance: ${ethers.formatEther(balance)}`);
            console.log("");
        }
        
        console.log("✅ Whitelist check complete!");
        
    } catch (error) {
        console.log("❌ Error:", error.message);
        console.log("\n💡 Make sure:");
        console.log("   • Token address is correct");
        console.log("   • Hardhat node is running");
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Error:", error);
        process.exit(1);
    });