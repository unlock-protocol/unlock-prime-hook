import "@unlock-protocol/contracts/dist/PublicLock/IPublicLockV13.sol";

// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.27;

// Uncomment this line to use console.log
import "hardhat/console.sol";

interface IUniswapOracleV3 {
    function PERIOD() external returns (uint256);

    function factory() external returns (address);

    function update(address _tokenIn, address _tokenOut) external;

    function consult(
        address _tokenIn,
        uint256 _amountIn,
        address _tokenOut
    ) external view returns (uint256 _amountOut);

    function updateAndConsult(
        address _tokenIn,
        uint256 _amountIn,
        address _tokenOut
    ) external returns (uint256 _amountOut);
}

contract UnlockPrimeHook {
    address public unlockPrime;
    address public oracle;
    address public weth;
    mapping(address => uint[2]) refunds; // [amount, time]

    event UnlockPrimeSet(address);
    event OracleSet(address);
    event WethSet(address);
    event RefundSet(address, uint256, uint256);
    event RefundPaid(address, uint256);

    constructor(address _unlockPrime, address _oracle, address _weth) {
        unlockPrime = _unlockPrime;
        emit UnlockPrimeSet(_unlockPrime);
        oracle = _oracle;
        emit OracleSet(_oracle);
        weth = _weth;
        emit WethSet(_weth);
    }

    // Set the unlock prime address, only callable by lock manager
    function setUnlockPrime(address _unlockPrime) public {
        if (IPublicLockV13(unlockPrime).isLockManager(msg.sender)) {
            unlockPrime = _unlockPrime;
            emit UnlockPrimeSet(_unlockPrime);
        }
    }

    // Set the oracle address, only callable by lock manager
    function setOracle(address _oracle) public {
        if (IPublicLockV13(unlockPrime).isLockManager(msg.sender)) {
            oracle = _oracle;
            emit OracleSet(_oracle);
        }
    }

    // Set the WETH address, only callable by lock manager
    function setWeth(address _weth) public {
        if (IPublicLockV13(unlockPrime).isLockManager(msg.sender)) {
            weth = _weth;
            emit WethSet(_weth);
        }
    }

    // Return the price of a key
    function keyPurchasePrice(
        address /* from */,
        address /* recipient */,
        address /* referrer */,
        bytes calldata /* data */
    ) external view returns (uint256 minKeyPrice) {
        return IPublicLockV13(msg.sender).keyPrice();
    }

    // This function is called by Unlock when a key is purchased
    function onKeyPurchase(
        uint256 /* tokenId */,
        address from,
        address /* recipient */,
        address /* referrer */,
        bytes calldata /* data */,
        uint256 /* minKeyPrice */,
        uint256 pricePaid
    ) external {
        if (msg.sender == unlockPrime) {
            address UPAddress = IPublicLockV13(msg.sender).tokenAddress();
            // At this point, check the pricePaid and its value against Uniswap oracles
            uint valueInETH = IUniswapOracleV3(oracle).updateAndConsult(
                UPAddress,
                pricePaid,
                weth
            );
            // Store the refund and the delay
            uint refundAmount = refunds[from][0] + (valueInETH * 11) / 10; // 10% bonus
            uint delay = block.timestamp + 60 * 60 * 24 * 14; // 2 weeks delay!

            refunds[from] = [refundAmount, delay];
            emit RefundSet(from, refundAmount, delay);
        }
    }

    // Claim the refund!
    function clainRefund() external {
        uint[2] memory refund = refunds[msg.sender];
        require(refund[0] > 0, "No refund available");
        require(refund[1] < block.timestamp, "Refund not available yet");
        refunds[msg.sender] = [0, 0];
        emit RefundPaid(msg.sender, refund[0]);
        payable(msg.sender).transfer(refund[0]);
    }
}
