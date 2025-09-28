const { ethers } = require("hardhat");

async function deployToken(hre) {
  const { deployments, getNamedAccounts, network } = hre;
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();

  log("----------------------------------------------------");
  log("Deploying WhitelistToken...");
  log("Network:", network.name);
  log("Deployer:", deployer);

  // Token configuration
  const tokenName = "WhitelistToken";
  const tokenSymbol = "WLT";
  const initialOwner = deployer;

  const args = [tokenName, tokenSymbol, initialOwner];

  const whitelistToken = await deploy("WhitelistToken", {
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: network.config.chainId === 31337 ? 1 : 5,
  });

  log(`WhitelistToken deployed to: ${whitelistToken.address}`);
  log(`Constructor arguments: ${args.join(", ")}`);

  // Verify contract on Etherscan if not on local network
  if (network.config.chainId !== 31337 && process.env.ETHERSCAN_API_KEY) {
    log("Waiting for block confirmations...");
    await new Promise((resolve) => setTimeout(resolve, 30000));

    try {
      await hre.run("verify:verify", {
        address: whitelistToken.address,
        constructorArguments: args,
      });
      log("Contract verified on Etherscan");
    } catch (error) {
      log("Error verifying contract:", error);
    }
  }

  // Log deployment summary
  log("----------------------------------------------------");
  log("Deployment Summary:");
  log(`Token Name: ${tokenName}`);
  log(`Token Symbol: ${tokenSymbol}`);
  log(`Contract Address: ${whitelistToken.address}`);
  log(`Initial Owner: ${initialOwner}`);
  log(`Max Supply: 1,000,000,000 WLT`);
  log("----------------------------------------------------");
}

module.exports.default = deployToken;
module.exports.tags = ["WhitelistToken", "token"];