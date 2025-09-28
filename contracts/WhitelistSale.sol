// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

/**
 * @title WhitelistSale
 * @dev Smart contract for conducting a token sale with whitelist functionality
 * @author Whitelist Token Team
 */
contract WhitelistSale is ReentrancyGuard, Pausable, Ownable {
    using SafeERC20 for IERC20;
    
    // Sale configuration
    struct SaleConfig {
        uint256 tokenPrice;      // Price per token in wei
        uint256 minPurchase;     // Minimum purchase amount in tokens
        uint256 maxPurchase;     // Maximum purchase amount in tokens
        uint256 maxSupply;       // Maximum tokens available for sale
        uint256 startTime;       // Sale start timestamp
        uint256 endTime;         // Sale end timestamp
        bool whitelistRequired;  // Whether whitelist is required
    }
    
    // Purchase record
    struct Purchase {
        uint256 amount;
        uint256 ethSpent;
        uint256 timestamp;
        bool claimed;
    }
    
    // Events
    event TokenPurchase(
        address indexed buyer,
        uint256 tokenAmount,
        uint256 ethAmount,
        uint256 timestamp
    );
    event TokensClaimed(address indexed buyer, uint256 amount);
    event WhitelistUpdated(address indexed account, bool whitelisted);
    event SaleConfigUpdated();
    event EmergencyWithdraw(address indexed token, uint256 amount);
    event MerkleRootUpdated(bytes32 newRoot);
    
    // State variables
    IERC20 public immutable token;
    address public immutable treasury;
    SaleConfig public saleConfig;
    
    // Whitelist management
    mapping(address => bool) public whitelist;
    bytes32 public merkleRoot;
    
    // Purchase tracking
    mapping(address => Purchase) public purchases;
    mapping(address => uint256) public totalPurchased;
    uint256 public totalSold;
    uint256 public totalEthRaised;
    
    // Claim settings
    bool public claimEnabled;
    uint256 public claimStartTime;
    
    /**
     * @dev Constructor sets up the sale contract
     * @param _token Address of the token being sold
     * @param _treasury Address to receive ETH payments
     * @param _tokenPrice Price per token in wei
     * @param _minPurchase Minimum purchase amount in tokens
     * @param _maxPurchase Maximum purchase amount in tokens
     * @param _maxSupply Maximum tokens available for sale
     * @param _startTime Sale start timestamp
     * @param _endTime Sale end timestamp
     * @param _initialOwner Initial owner of the contract
     */
    constructor(
        address _token,
        address _treasury,
        uint256 _tokenPrice,
        uint256 _minPurchase,
        uint256 _maxPurchase,
        uint256 _maxSupply,
        uint256 _startTime,
        uint256 _endTime,
        address _initialOwner
    ) Ownable(_initialOwner) {
        require(_token != address(0), "WhitelistSale: token cannot be zero address");
        require(_treasury != address(0), "WhitelistSale: treasury cannot be zero address");
        require(_initialOwner != address(0), "WhitelistSale: initial owner cannot be zero address");
        require(_tokenPrice > 0, "WhitelistSale: token price must be greater than 0");
        require(_minPurchase > 0, "WhitelistSale: min purchase must be greater than 0");
        require(_maxPurchase >= _minPurchase, "WhitelistSale: max purchase must be >= min purchase");
        require(_maxSupply > 0, "WhitelistSale: max supply must be greater than 0");
        require(_startTime >= block.timestamp, "WhitelistSale: start time must be in the future");
        require(_endTime > _startTime, "WhitelistSale: end time must be after start time");
        
        token = IERC20(_token);
        treasury = _treasury;
        
        saleConfig = SaleConfig({
            tokenPrice: _tokenPrice,
            minPurchase: _minPurchase,
            maxPurchase: _maxPurchase,
            maxSupply: _maxSupply,
            startTime: _startTime,
            endTime: _endTime,
            whitelistRequired: true
        });
        
        
        // Add treasury to whitelist
        whitelist[_treasury] = true;
        emit WhitelistUpdated(_treasury, true);
    }
    
    /**
     * @dev Purchase tokens during the sale
     * @param tokenAmount Amount of tokens to purchase
     * @param merkleProof Merkle proof for whitelist verification (if using Merkle tree)
     */
    function purchaseTokens(
        uint256 tokenAmount,
        bytes32[] calldata merkleProof
    ) external payable nonReentrant whenNotPaused {
        require(isSaleActive(), "WhitelistSale: sale is not active");
        require(tokenAmount >= saleConfig.minPurchase, "WhitelistSale: below minimum purchase");
        require(tokenAmount <= saleConfig.maxPurchase, "WhitelistSale: exceeds maximum purchase");
        require(totalSold + tokenAmount <= saleConfig.maxSupply, "WhitelistSale: exceeds max supply");
        
        // Check whitelist requirements
        if (saleConfig.whitelistRequired) {
            require(
                _isWhitelisted(msg.sender, merkleProof),
                "WhitelistSale: address not whitelisted"
            );
        }
        
        // Check individual purchase limit
        require(
            totalPurchased[msg.sender] + tokenAmount <= saleConfig.maxPurchase,
            "WhitelistSale: exceeds individual purchase limit"
        );
        
        // Calculate required ETH
        uint256 ethRequired = (tokenAmount * saleConfig.tokenPrice) / 1e18;
        require(msg.value >= ethRequired, "WhitelistSale: insufficient ETH sent");
        
        // Update purchase records
        purchases[msg.sender] = Purchase({
            amount: purchases[msg.sender].amount + tokenAmount,
            ethSpent: purchases[msg.sender].ethSpent + ethRequired,
            timestamp: block.timestamp,
            claimed: false
        });
        
        totalPurchased[msg.sender] += tokenAmount;
        totalSold += tokenAmount;
        totalEthRaised += ethRequired;
        
        // Refund excess ETH
        if (msg.value > ethRequired) {
            payable(msg.sender).transfer(msg.value - ethRequired);
        }
        
        // Forward ETH to treasury
        payable(treasury).transfer(ethRequired);
        
        emit TokenPurchase(msg.sender, tokenAmount, ethRequired, block.timestamp);
    }
    
    /**
     * @dev Claim purchased tokens (if claiming is enabled)
     */
    function claimTokens() external nonReentrant {
        require(claimEnabled, "WhitelistSale: claiming not enabled");
        require(block.timestamp >= claimStartTime, "WhitelistSale: claiming not started");
        
        Purchase storage purchase = purchases[msg.sender];
        require(purchase.amount > 0, "WhitelistSale: no tokens to claim");
        require(!purchase.claimed, "WhitelistSale: tokens already claimed");
        
        purchase.claimed = true;
        
        // Transfer tokens to buyer
        token.safeTransfer(msg.sender, purchase.amount);
        
        emit TokensClaimed(msg.sender, purchase.amount);
    }
    
    /**
     * @dev Update sale configuration (only owner)
     */
    function updateSaleConfig(
        uint256 _tokenPrice,
        uint256 _minPurchase,
        uint256 _maxPurchase,
        uint256 _maxSupply,
        uint256 _startTime,
        uint256 _endTime,
        bool _whitelistRequired
    ) external onlyOwner {
        require(_tokenPrice > 0, "WhitelistSale: token price must be greater than 0");
        require(_minPurchase > 0, "WhitelistSale: min purchase must be greater than 0");
        require(_maxPurchase >= _minPurchase, "WhitelistSale: max purchase must be >= min purchase");
        require(_maxSupply >= totalSold, "WhitelistSale: max supply cannot be less than total sold");
        require(_endTime > _startTime, "WhitelistSale: end time must be after start time");
        
        saleConfig = SaleConfig({
            tokenPrice: _tokenPrice,
            minPurchase: _minPurchase,
            maxPurchase: _maxPurchase,
            maxSupply: _maxSupply,
            startTime: _startTime,
            endTime: _endTime,
            whitelistRequired: _whitelistRequired
        });
        
        emit SaleConfigUpdated();
    }
    
    /**
     * @dev Add or remove addresses from whitelist
     */
    function updateWhitelist(address account, bool whitelisted) external onlyOwner {
        require(account != address(0), "WhitelistSale: cannot whitelist zero address");
        
        whitelist[account] = whitelisted;
        emit WhitelistUpdated(account, whitelisted);
    }
    
    /**
     * @dev Update multiple addresses in whitelist
     */
    function updateWhitelistBatch(address[] calldata accounts, bool whitelisted) external onlyOwner {
        require(accounts.length > 0, "WhitelistSale: empty accounts array");
        require(accounts.length <= 100, "WhitelistSale: too many accounts in batch");
        
        for (uint256 i = 0; i < accounts.length; i++) {
            require(accounts[i] != address(0), "WhitelistSale: cannot whitelist zero address");
            whitelist[accounts[i]] = whitelisted;
            emit WhitelistUpdated(accounts[i], whitelisted);
        }
    }
    
    /**
     * @dev Set Merkle root for whitelist verification
     */
    function setMerkleRoot(bytes32 _merkleRoot) external onlyOwner {
        merkleRoot = _merkleRoot;
        emit MerkleRootUpdated(_merkleRoot);
    }
    
    /**
     * @dev Enable/disable token claiming
     */
    function setClaimEnabled(bool _enabled, uint256 _claimStartTime) external onlyOwner {
        claimEnabled = _enabled;
        if (_enabled && _claimStartTime > 0) {
            claimStartTime = _claimStartTime;
        }
    }
    
    /**
     * @dev Pause the sale
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause the sale
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Emergency withdraw tokens (only owner)
     */
    function emergencyWithdraw(address tokenAddress, uint256 amount) external onlyOwner {
        require(tokenAddress != address(0), "WhitelistSale: token address cannot be zero");
        
        if (tokenAddress == address(token)) {
            // For main token, only allow withdrawal of unsold tokens
            uint256 unsoldTokens = saleConfig.maxSupply - totalSold;
            require(amount <= unsoldTokens, "WhitelistSale: cannot withdraw sold tokens");
        }
        
        IERC20(tokenAddress).safeTransfer(owner(), amount);
        emit EmergencyWithdraw(tokenAddress, amount);
    }
    
    /**
     * @dev Emergency withdraw ETH (only owner)
     */
    function emergencyWithdrawETH() external onlyOwner {
        require(address(this).balance > 0, "WhitelistSale: no ETH to withdraw");
        
        payable(owner()).transfer(address(this).balance);
    }
    
    /**
     * @dev Check if sale is currently active
     */
    function isSaleActive() public view returns (bool) {
        return block.timestamp >= saleConfig.startTime && 
               block.timestamp <= saleConfig.endTime &&
               totalSold < saleConfig.maxSupply;
    }
    
    /**
     * @dev Get remaining tokens available for sale
     */
    function remainingTokens() external view returns (uint256) {
        return saleConfig.maxSupply - totalSold;
    }
    
    /**
     * @dev Get purchase information for an address
     */
    function getPurchaseInfo(address buyer) external view returns (
        uint256 amount,
        uint256 ethSpent,
        uint256 timestamp,
        bool claimed
    ) {
        Purchase memory purchase = purchases[buyer];
        return (purchase.amount, purchase.ethSpent, purchase.timestamp, purchase.claimed);
    }
    
    /**
     * @dev Check if an address is whitelisted (supports both mapping and Merkle proof)
     */
    function _isWhitelisted(address account, bytes32[] calldata merkleProof) internal view returns (bool) {
        // Check mapping-based whitelist
        if (whitelist[account]) {
            return true;
        }
        
        // Check Merkle proof-based whitelist
        if (merkleRoot != bytes32(0) && merkleProof.length > 0) {
            bytes32 leaf = keccak256(abi.encodePacked(account));
            return MerkleProof.verify(merkleProof, merkleRoot, leaf);
        }
        
        return false;
    }
    
    /**
     * @dev Public function to check whitelist status
     */
    function isWhitelisted(address account, bytes32[] calldata merkleProof) external view returns (bool) {
        return _isWhitelisted(account, merkleProof);
    }
}