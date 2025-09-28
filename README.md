# WhitelistToken Smart Contracts

Solidity smart contracts for the WhitelistToken DApp, built with Hardhat and OpenZeppelin. Includes ERC20 token with whitelist functionality and a configurable token sale contract.

## 🚀 Features

### WhitelistToken Contract
- **ERC20 Standard** - Full ERC20 compliance with additional features
- **Whitelist Control** - Restrict transfers to whitelisted addresses
- **Pausable** - Emergency pause functionality for all transfers
- **Burnable** - Token holders can burn their tokens
- **Mintable** - Owner can mint tokens up to maximum supply
- **Ownable** - Access control for administrative functions
- **Emergency Recovery** - Recover accidentally sent tokens/ETH

### WhitelistSale Contract
- **Configurable Sale** - Flexible pricing and timing parameters
- **Purchase Limits** - Min/max purchase amounts per transaction
- **Time Windows** - Start/end times for sale periods
- **Pausable Sales** - Emergency pause for sale operations
- **ETH Collection** - Automatic ETH collection to treasury
- **Claim System** - Separate purchase and claim phases

## 🛠️ Tech Stack

- **Solidity**: ^0.8.20
- **Hardhat**: Development environment and testing framework
- **OpenZeppelin**: Security-audited contract libraries
- **TypeScript**: Type-safe testing and deployment scripts
- **Ethers.js**: Ethereum library for contract interaction

## 📋 Prerequisites

- Node.js 18+
- npm or yarn
- Hardhat local network or testnet access
- Docker for local blockchain (or use whitelist-backend infrastructure)

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Compile Contracts
```bash
npx hardhat compile
```

### 3. Run Tests
```bash
npx hardhat test
```

### 4. Start Local Network
```bash
# In separate terminal or use docker-compose
npx hardhat node
```

### 5. Deploy Contracts
```bash
# Deploy using hardhat-deploy (recommended)
npx hardhat deploy --network localhost

# OR deploy using simple scripts
npx hardhat run scripts/deploy-simple.js --network localhost
```

## 📁 Project Structure

```
contracts/
├── contracts/           # Solidity contract files
│   ├── WhitelistToken.sol
│   └── WhitelistSale.sol
├── deploy/             # Hardhat-deploy scripts
│   ├── 001_deploy_token.js
│   └── 002_deploy_sale.js
├── scripts/            # Utility scripts
│   ├── check.js        # Check token information
│   ├── check-whitelist.js # Check whitelist status
│   ├── check-sale.js   # Check sale information
│   ├── create.js       # Create new token
│   └── deploy-simple.js # Simple deployment
├── test/               # Contract tests
│   └── WhitelistToken.test.ts
├── hardhat.config.ts   # Hardhat configuration
├── package.json        # Dependencies and scripts
└── tsconfig.json       # TypeScript configuration
```

## 📜 Smart Contracts

### WhitelistToken.sol

**ERC20 token with advanced features:**

```solidity
contract WhitelistToken is ERC20, ERC20Burnable, ERC20Pausable, Ownable, ReentrancyGuard {
    // Maximum supply: 1 billion tokens
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18;
    
    // Whitelist mapping
    mapping(address => bool) public whitelist;
    
    // Transfer restriction flag
    bool public transferRestricted;
}
```

**Key Functions:**
- `mint(address to, uint256 amount)` - Mint tokens (owner only)
- `updateWhitelist(address account, bool whitelisted)` - Update whitelist status
- `updateWhitelistBatch(address[] accounts, bool whitelisted)` - Batch whitelist update
- `setTransferRestrictions(bool restricted)` - Enable/disable transfer restrictions
- `pause()` / `unpause()` - Emergency pause controls
- `burn(uint256 amount)` - Burn tokens
- `recoverERC20()` / `recoverETH()` - Emergency recovery functions

### WhitelistSale.sol

**Token sale contract with configurable parameters:**

```solidity
constructor(
    address _token,          // WhitelistToken contract address
    address _treasury,       // Treasury address for ETH collection
    uint256 _tokenPrice,     // Price per token in ETH
    uint256 _minPurchase,    // Minimum purchase amount
    uint256 _maxPurchase,    // Maximum purchase amount
    uint256 _maxSupply,      // Maximum tokens for sale
    uint256 _startTime,      // Sale start timestamp
    uint256 _endTime,        // Sale end timestamp
    address _initialOwner    // Contract owner address
)
```

**Key Functions:**
- `buyTokens()` - Purchase tokens with ETH
- `claimTokens()` - Claim purchased tokens (if claiming enabled)
- `setClaimEnabled(bool enabled, uint256 claimStart)` - Enable token claiming
- `pause()` / `unpause()` - Pause/unpause sales
- `isActive()` - Check if sale is currently active
- `withdrawETH()` - Withdraw collected ETH (owner only)

## 🔧 Available Scripts

### Compilation & Testing
```bash
npm run compile          # Compile contracts
npm run test            # Run all tests
npm run test:gas        # Run tests with gas reporting
npm run coverage        # Generate test coverage report
```

### Deployment
```bash
# Hardhat Deploy (recommended)
npm run deploy:local    # Deploy to localhost
npm run deploy:testnet  # Deploy to testnet
npm run deploy:mainnet  # Deploy to mainnet

# Simple Scripts
npm run script:deploy   # Simple deployment script
npm run script:create   # Create new token
```

### Utility Scripts
```bash
npm run script:check           # Check token information
npm run script:check-whitelist # Check whitelist status
npm run script:check-sale      # Check sale information
```

### Development
```bash
npm run node            # Start Hardhat node
npm run console         # Open Hardhat console
npm run clean           # Clean artifacts and cache
```

## 🧪 Testing

### Test Coverage
The project includes comprehensive tests covering:

**28 Test Cases:**
- **Deployment Tests (7)** - Contract initialization and configuration
- **Minting Tests (5)** - Token minting functionality and restrictions
- **Whitelist Tests (5)** - Whitelist management and batch operations
- **Transfer Tests (4)** - Transfer restrictions and whitelist enforcement
- **Pausable Tests (3)** - Pause/unpause functionality
- **Emergency Tests (3)** - Recovery functions and ETH rejection
- **Burning Tests (1)** - Token burning functionality

### Run Specific Tests
```bash
# Run all tests
npx hardhat test

# Run specific test file
npx hardhat test test/WhitelistToken.test.ts

# Run tests with verbose output
npx hardhat test --verbose

# Run tests with gas reporting
npx hardhat test --gas-report
```

### Test Examples
```typescript
describe("WhitelistToken", function () {
  it("Should allow owner to mint tokens", async function () {
    const { token, addr1 } = await loadFixture(deployTokenFixture);
    const mintAmount = ethers.parseEther("1000");

    await expect(token.mint(addr1.address, mintAmount))
      .to.emit(token, "Mint")
      .withArgs(addr1.address, mintAmount);

    expect(await token.balanceOf(addr1.address)).to.equal(mintAmount);
  });
});
```

## 🚀 Deployment Guide

### Local Development (Hardhat Network)

1. **Start Hardhat Node**
```bash
npx hardhat node
```

2. **Deploy Contracts**
```bash
npx hardhat deploy --network localhost --reset
```

3. **Verify Deployment**
```bash
npx hardhat run scripts/check.js --network localhost
```

### Testnet Deployment

1. **Configure Network** (in `hardhat.config.ts`)
```typescript
networks: {
  goerli: {
    url: process.env.GOERLI_RPC_URL,
    accounts: [process.env.PRIVATE_KEY]
  }
}
```

2. **Deploy to Testnet**
```bash
npx hardhat deploy --network goerli
```

3. **Verify on Etherscan**
```bash
npx hardhat verify --network goerli DEPLOYED_ADDRESS "Constructor" "Args"
```

## 📊 Contract Parameters

### WhitelistToken Configuration
```javascript
const TOKEN_CONFIG = {
    name: "WhitelistToken",        // Token name
    symbol: "WLT",                 // Token symbol
    maxSupply: "1000000000",       // 1 billion tokens max
    decimals: 18,                  // Standard ERC20 decimals
    initialOwner: "0x...",         // Contract owner address
}
```

### WhitelistSale Configuration
```javascript
const SALE_CONFIG = {
    tokenPrice: "0.001",           // 0.001 ETH per token
    minPurchase: "10",             // 10 tokens minimum
    maxPurchase: "10000",          // 10,000 tokens maximum
    maxSupply: "100000000",        // 100M tokens for sale
    saleDurationDays: 30,          // 30-day sale duration
}
```

## 🔐 Security Features

### Access Control
- **Ownable**: Admin functions restricted to contract owner
- **Role-based**: Different permission levels for different functions
- **Whitelist**: Transfer restrictions to approved addresses only

### Safety Mechanisms
- **Pausable**: Emergency pause for all operations
- **ReentrancyGuard**: Protection against reentrancy attacks
- **Input Validation**: Comprehensive parameter validation
- **Zero Address Checks**: Prevention of zero address interactions

### Emergency Functions
- **Token Recovery**: Recover accidentally sent ERC20 tokens
- **ETH Recovery**: Recover accidentally sent ETH
- **Emergency Pause**: Immediate pause of all operations

## 📚 Utility Scripts Usage

### 1. Check Token Information
```bash
# Edit TOKEN_ADDRESS in scripts/check.js
npx hardhat run scripts/check.js --network localhost
```

**Output:**
```
📊 TOKEN INFORMATION
══════════════════════════════════════════════════
Address: 0x5FbDB2315678afecb367f032d93F642f64180aa3
Name: WhitelistToken
Symbol: WLT
Total Supply: 1000000.0 WLT
Max Supply: 1000000000.0 WLT
Owner: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
Is Paused: false
Transfer Restricted: false
```

### 2. Check Whitelist Status
```bash
# Edit addresses in scripts/check-whitelist.js
npx hardhat run scripts/check-whitelist.js --network localhost
```

### 3. Create New Token
```bash
# Edit TOKEN_CONFIG in scripts/create.js
npx hardhat run scripts/create.js --network localhost
```

### 4. Deploy Both Contracts
```bash
# Edit DEPLOYMENT_CONFIG in scripts/deploy-simple.js
npx hardhat run scripts/deploy-simple.js --network localhost
```

## 🔗 Contract ABIs

The compiled contract ABIs are available in:
- `artifacts/contracts/WhitelistToken.sol/WhitelistToken.json`
- `artifacts/contracts/WhitelistSale.sol/WhitelistSale.json`

### Example ABI Usage
```javascript
const tokenABI = require('./artifacts/contracts/WhitelistToken.sol/WhitelistToken.json').abi;
const tokenContract = new ethers.Contract(tokenAddress, tokenABI, signer);
```

## 🌐 Network Configuration

### Supported Networks
- **Hardhat** (localhost:8545) - Development
- **Ethereum Mainnet** - Production
- **Goerli** - Testnet
- **Sepolia** - Testnet

### Network Configuration Example
```typescript
networks: {
  hardhat: {
    chainId: 31337
  },
  localhost: {
    url: "http://127.0.0.1:8545",
    chainId: 31337
  },
  goerli: {
    url: process.env.GOERLI_RPC_URL,
    accounts: [process.env.PRIVATE_KEY],
    chainId: 5
  }
}
```

## 🔧 Advanced Configuration

### Gas Optimization
```typescript
solidity: {
  version: "0.8.20",
  settings: {
    optimizer: {
      enabled: true,
      runs: 200
    }
  }
}
```

### Contract Verification
```typescript
etherscan: {
  apiKey: process.env.ETHERSCAN_API_KEY
}
```

## 🤝 Contributing

### Development Guidelines
1. Follow Solidity best practices and style guide
2. Add comprehensive tests for new functionality
3. Use OpenZeppelin libraries when possible
4. Include proper documentation and comments
5. Test on local network before testnet deployment

### Security Guidelines
1. Always use `require()` statements for validation
2. Implement proper access controls
3. Consider reentrancy protection for payable functions
4. Test edge cases and error conditions
5. Follow checks-effects-interactions pattern

## 🔗 Related Documentation

- [Hardhat Documentation](https://hardhat.org/docs)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Solidity Documentation](https://docs.soliditylang.org/)
- [Ethers.js Documentation](https://docs.ethers.org/)