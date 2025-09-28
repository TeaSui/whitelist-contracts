// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title WhitelistToken
 * @dev ERC20 token with whitelist functionality, pausable transfers, and burnable supply
 * @author Whitelist Token Team
 */
contract WhitelistToken is ERC20, ERC20Burnable, ERC20Pausable, Ownable, ReentrancyGuard {
    
    // Events
    event Mint(address indexed to, uint256 amount);
    event WhitelistUpdated(address indexed account, bool whitelisted);
    event TransferRestrictionsUpdated(bool restricted);
    
    // State variables
    bool public transferRestricted;
    mapping(address => bool) public whitelist;
    
    // Constants
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18; // 1 billion tokens
    
    /**
     * @dev Constructor that sets up the token with initial parameters
     * @param name The name of the token
     * @param symbol The symbol of the token
     * @param initialOwner The initial owner of the contract
     */
    constructor(
        string memory name,
        string memory symbol,
        address initialOwner
    ) ERC20(name, symbol) Ownable(initialOwner) {
        require(initialOwner != address(0), "WhitelistToken: initial owner cannot be zero address");
        
        
        // Add initial owner to whitelist
        whitelist[initialOwner] = true;
        emit WhitelistUpdated(initialOwner, true);
        
        // Initially, transfers are not restricted
        transferRestricted = false;
    }
    
    /**
     * @dev Mints tokens to a specified address
     * @param to The address that will receive the minted tokens
     * @param amount The amount of tokens to mint
     */
    function mint(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "WhitelistToken: cannot mint to zero address");
        require(totalSupply() + amount <= MAX_SUPPLY, "WhitelistToken: exceeds maximum supply");
        
        _mint(to, amount);
        emit Mint(to, amount);
    }

    /**
     * @dev Adds or removes an address from the whitelist
     * @param account The address to update
     * @param whitelisted Whether the address should be whitelisted
     */
    function updateWhitelist(address account, bool whitelisted) external onlyOwner {
        require(account != address(0), "WhitelistToken: cannot whitelist zero address");

        whitelist[account] = whitelisted;
        emit WhitelistUpdated(account, whitelisted);
    }

    /**
     * @dev Updates multiple addresses in the whitelist
     * @param accounts Array of addresses to update
     * @param whitelisted Whether the addresses should be whitelisted
     */
    function updateWhitelistBatch(address[] calldata accounts, bool whitelisted) external onlyOwner {
        require(accounts.length > 0, "WhitelistToken: empty accounts array");
        require(accounts.length <= 100, "WhitelistToken: too many accounts in batch");

        for (uint256 i = 0; i < accounts.length; i++) {
            require(accounts[i] != address(0), "WhitelistToken: cannot whitelist zero address");
            whitelist[accounts[i]] = whitelisted;
            emit WhitelistUpdated(accounts[i], whitelisted);
        }
    }
    
    /**
     * @dev Sets whether transfers are restricted to whitelisted addresses only
     * @param restricted Whether transfers should be restricted
     */
    function setTransferRestrictions(bool restricted) external onlyOwner {
        transferRestricted = restricted;
        emit TransferRestrictionsUpdated(restricted);
    }
    
    /**
     * @dev Pauses all token transfers
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpauses all token transfers
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Checks if an address is whitelisted
     * @param account The address to check
     * @return Whether the address is whitelisted
     */
    function isWhitelisted(address account) external view returns (bool) {
        return whitelist[account];
    }
    
    /**
     * @dev Returns the remaining mintable supply
     * @return The amount of tokens that can still be minted
     */
    function remainingMintableSupply() external view returns (uint256) {
        return MAX_SUPPLY - totalSupply();
    }
    
    /**
     * @dev Override update function to include whitelist restrictions
     */
    function _update(
        address from,
        address to,
        uint256 value
    ) internal override(ERC20, ERC20Pausable) {
        // Apply whitelist restrictions if enabled (skip for minting/burning)
        if (transferRestricted && from != address(0) && to != address(0)) {
            require(
                whitelist[from] || whitelist[to],
                "WhitelistToken: transfer restricted to whitelisted addresses"
            );
        }
        
        super._update(from, to, value);
    }
    
    /**
     * @dev Emergency function to recover accidentally sent ERC20 tokens
     * @param token The token contract address
     * @param to The address to send the tokens to
     * @param amount The amount of tokens to recover
     */
    function recoverERC20(
        address token,
        address to,
        uint256 amount
    ) external onlyOwner nonReentrant {
        require(token != address(this), "WhitelistToken: cannot recover own tokens");
        require(to != address(0), "WhitelistToken: cannot recover to zero address");
        
        IERC20(token).transfer(to, amount);
    }
    
    /**
     * @dev Emergency function to recover accidentally sent ETH
     * @param to The address to send the ETH to
     */
    function recoverETH(address payable to) external onlyOwner nonReentrant {
        require(to != address(0), "WhitelistToken: cannot recover to zero address");
        require(address(this).balance > 0, "WhitelistToken: no ETH to recover");
        
        (bool success, ) = to.call{value: address(this).balance}("");
        require(success, "WhitelistToken: ETH recovery failed");
    }
    
    /**
     * @dev Fallback function to prevent accidental ETH deposits
     */
    receive() external payable {
        revert("WhitelistToken: contract does not accept ETH");
    }
}