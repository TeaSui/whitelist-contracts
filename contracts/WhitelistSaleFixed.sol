// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

/**
 * @title WhitelistSaleFixed
 * @dev Fixed version of the WhitelistSale contract that properly handles multiple purchases and claiming
 */
contract WhitelistSaleFixed is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    IERC20 public immutable token;
    address public treasury;
    bytes32 public merkleRoot;

    struct SaleConfig {
        uint256 tokenPrice;     // Price per token in wei
        uint256 minPurchase;    // Minimum tokens per purchase
        uint256 maxPurchase;    // Maximum tokens per purchase
        uint256 maxSupply;      // Maximum tokens available for sale
        uint256 startTime;      // Sale start timestamp
        uint256 endTime;        // Sale end timestamp
        bool whitelistRequired; // Whether whitelist is required
    }

    struct Purchase {
        uint256 totalPurchased;    // Total tokens purchased by user
        uint256 totalClaimed;      // Total tokens claimed by user
        uint256 ethSpent;          // Total ETH spent by user
        uint256 lastPurchaseTime;  // Timestamp of last purchase
    }

    SaleConfig public saleConfig;
    
    // Mapping from address to their purchase info
    mapping(address => Purchase) public purchases;
    
    // Simple whitelist mapping (alternative to Merkle tree)
    mapping(address => bool) public whitelist;
    
    // Tracking variables
    mapping(address => uint256) public totalPurchased;
    uint256 public totalSold;
    uint256 public totalEthRaised;
    
    // Claiming settings
    bool public claimEnabled;
    uint256 public claimStartTime;

    // Events
    event TokenPurchase(address indexed buyer, uint256 tokenAmount, uint256 ethAmount, uint256 timestamp);
    event TokensClaimed(address indexed buyer, uint256 amount);
    event WhitelistUpdated(address indexed account, bool whitelisted);
    event SaleConfigUpdated();
    event MerkleRootUpdated(bytes32 newRoot);
    event EmergencyWithdraw(address indexed token, uint256 amount);

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
        require(_tokenPrice > 0, "WhitelistSale: token price must be greater than 0");
        require(_minPurchase > 0, "WhitelistSale: min purchase must be greater than 0");
        require(_maxPurchase >= _minPurchase, "WhitelistSale: max purchase must be >= min purchase");
        require(_maxSupply > 0, "WhitelistSale: max supply must be greater than 0");
        require(_endTime > _startTime, "WhitelistSale: end time must be after start time");
        require(_startTime > block.timestamp, "WhitelistSale: start time must be in the future");

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

        // Add initial owner to whitelist
        whitelist[_initialOwner] = true;
        emit WhitelistUpdated(_initialOwner, true);
    }

    /**
     * @dev Check if sale is currently active
     */
    function isSaleActive() public view returns (bool) {
        return 
            block.timestamp >= saleConfig.startTime &&
            block.timestamp <= saleConfig.endTime &&
            !paused() &&
            totalSold < saleConfig.maxSupply;
    }

    /**
     * @dev Check if address is whitelisted (supports both Merkle proof and simple mapping)
     */
    function isWhitelisted(address account, bytes32[] calldata merkleProof) public view returns (bool) {
        // Check simple whitelist first
        if (whitelist[account]) {
            return true;
        }
        
        // Check Merkle tree if root is set
        if (merkleRoot != bytes32(0)) {
            bytes32 leaf = keccak256(abi.encodePacked(account));
            return MerkleProof.verify(merkleProof, merkleRoot, leaf);
        }
        
        return false;
    }

    /**
     * @dev Internal function to check whitelist
     */
    function _isWhitelisted(address account, bytes32[] calldata merkleProof) internal view returns (bool) {
        return isWhitelisted(account, merkleProof);
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
        
        // Check individual purchase limit (total across all purchases)
        require(
            totalPurchased[msg.sender] + tokenAmount <= saleConfig.maxPurchase,
            "WhitelistSale: exceeds individual purchase limit"
        );
        
        // Calculate required ETH
        uint256 ethRequired = (tokenAmount * saleConfig.tokenPrice) / 1e18;
        require(msg.value >= ethRequired, "WhitelistSale: insufficient ETH sent");
        
        // Update purchase records - FIXED VERSION
        Purchase storage userPurchase = purchases[msg.sender];
        userPurchase.totalPurchased += tokenAmount;
        userPurchase.ethSpent += ethRequired;
        userPurchase.lastPurchaseTime = block.timestamp;
        // NOTE: Do NOT reset claimed status - keep existing claimed amount
        
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
        
        Purchase storage userPurchase = purchases[msg.sender];
        require(userPurchase.totalPurchased > 0, "WhitelistSale: no tokens to claim");
        
        // Calculate claimable amount - FIXED VERSION
        uint256 claimableAmount = userPurchase.totalPurchased - userPurchase.totalClaimed;
        require(claimableAmount > 0, "WhitelistSale: no tokens to claim");
        
        // Update claimed amount
        userPurchase.totalClaimed += claimableAmount;
        
        // Transfer only the claimable amount
        token.safeTransfer(msg.sender, claimableAmount);
        
        emit TokensClaimed(msg.sender, claimableAmount);
    }

    /**
     * @dev Get purchase information for a user
     */
    function getPurchaseInfo(address buyer) external view returns (
        uint256 totalPurchased,
        uint256 totalClaimed,
        uint256 ethSpent,
        uint256 lastPurchaseTime
    ) {
        Purchase memory userPurchase = purchases[buyer];
        return (
            userPurchase.totalPurchased,
            userPurchase.totalClaimed,
            userPurchase.ethSpent,
            userPurchase.lastPurchaseTime
        );
    }

    /**
     * @dev Get claimable token amount for a user
     */
    function getClaimableAmount(address buyer) external view returns (uint256) {
        Purchase memory userPurchase = purchases[buyer];
        return userPurchase.totalPurchased - userPurchase.totalClaimed;
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
     * @dev Add or remove multiple addresses from whitelist
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
     * @dev Enable/disable claiming and set claim start time
     */
    function setClaimEnabled(bool _enabled, uint256 _claimStartTime) external onlyOwner {
        claimEnabled = _enabled;
        if (_enabled) {
            claimStartTime = _claimStartTime;
        }
    }

    /**
     * @dev Get remaining tokens available for sale
     */
    function remainingTokens() external view returns (uint256) {
        return saleConfig.maxSupply - totalSold;
    }

    /**
     * @dev Pause the sale (only owner)
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause the sale (only owner)
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Emergency withdraw function (only owner)
     */
    function emergencyWithdraw(address tokenAddress, uint256 amount) external onlyOwner {
        require(tokenAddress != address(0), "WhitelistSale: token address cannot be zero");
        
        uint256 availableAmount;
        if (tokenAddress == address(token)) {
            // For the sale token, can't withdraw sold tokens
            uint256 contractBalance = token.balanceOf(address(this));
            uint256 soldButNotClaimed = totalSold;
            
            // Calculate how much of each user's purchase is unclaimed
            // Note: This is a simplified calculation - in practice you'd want to track this more precisely
            availableAmount = contractBalance > soldButNotClaimed ? contractBalance - soldButNotClaimed : 0;
        } else {
            availableAmount = IERC20(tokenAddress).balanceOf(address(this));
        }
        
        require(amount <= availableAmount, "WhitelistSale: cannot withdraw sold tokens");
        
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
}