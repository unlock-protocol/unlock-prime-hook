import "@unlock-protocol/contracts/dist/PublicLock/IPublicLockV13.sol";

// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.27;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

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
    mapping(address => uint[2]) public refunds; // [amount, time]

    event UnlockPrimeSet(address);
    event OracleSet(address);
    event WethSet(address);
    event RefundSet(address, uint256, uint256);
    event RefundPaid(address, uint256);

    constructor(address _unlockPrime, address _oracle, address _weth) {
        initialize(_unlockPrime, _oracle, _weth);
    }

    function initialize(
        address _unlockPrime,
        address _oracle,
        address _weth
    ) public {
        if (unlockPrime != address(0)) {
            revert("Already initialized");
        }
        unlockPrime = _unlockPrime;
        emit UnlockPrimeSet(_unlockPrime);
        oracle = _oracle;
        emit OracleSet(_oracle);
        weth = _weth;
        emit WethSet(_weth);
    }

    // Set the unlock prime address, only callable by lock manager
    function setUnlockPrime(address _unlockPrime) public {
        if (!IPublicLockV13(unlockPrime).isLockManager(msg.sender)) {
            revert("Caller is not a lock manager");
        }
        unlockPrime = _unlockPrime;
        emit UnlockPrimeSet(_unlockPrime);
    }

    // Set the oracle address, only callable by lock manager
    function setOracle(address _oracle) public {
        if (!IPublicLockV13(unlockPrime).isLockManager(msg.sender)) {
            revert("Caller is not a lock manager");
        }
        oracle = _oracle;
        emit OracleSet(_oracle);
    }

    // Set the WETH address, only callable by lock manager
    function setWeth(address _weth) public {
        if (!IPublicLockV13(unlockPrime).isLockManager(msg.sender)) {
            revert("Caller is not a lock manager");
        }
        weth = _weth;
        emit WethSet(_weth);
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

    function recordRefund(address beneficiary, uint amount) private {
        address UPAddress = IPublicLockV13(unlockPrime).tokenAddress();
        // At this point, check the pricePaid and its value against Uniswap oracles
        uint valueInETH = IUniswapOracleV3(oracle).updateAndConsult(
            UPAddress,
            amount,
            weth
        );
        // Store the refund and the delay
        uint existingRefund = refunds[beneficiary][0];
        uint existingDelay = refunds[beneficiary][1];
        uint newRefund = (valueInETH * 11) / 10; // 10% bonus
        uint newDelay = block.timestamp + 60 * 60 * 24 * 14; // 2 weeks delay!

        if (existingDelay < block.timestamp) {
            refunds[beneficiary] = [existingRefund + newRefund, newDelay];
        } else {
            // One needs to wait for the delay to be able to increase their refund.
            refunds[beneficiary] = [newRefund, newDelay];
        }

        emit RefundSet(
            beneficiary,
            refunds[beneficiary][0],
            refunds[beneficiary][1]
        );
    }

    // This function is called by Unlock when a key is purchased
    function onKeyPurchase(
        uint256 /* tokenId */,
        address from,
        address /* recipient */,
        address /* referrer */,
        bytes calldata /* data */,
        uint256 /* minKeyPrice */,
        uint256 /* pricePaid */
    ) external {
        if (msg.sender == unlockPrime) {
            recordRefund(from, IPublicLockV13(msg.sender).keyPrice());
        }
    }

    // This function is called by Unlock when a key is extended
    function onKeyExtend(
        uint tokenId,
        address /* sender */,
        uint /* newTimestamp */,
        uint /* expirationTimestam p*/
    ) external {
        IPublicLockV13 lock = IPublicLockV13(msg.sender);
        if (msg.sender == unlockPrime) {
            recordRefund(lock.ownerOf(tokenId), lock.keyPrice());
        }
    }

    // Claim the refund!
    function claimRefund() external {
        uint[2] memory refund = refunds[msg.sender];
        require(refund[0] > 0, "No refund available");
        require(refund[1] < block.timestamp, "Refund not available yet");
        refunds[msg.sender] = [0, 0];
        payable(msg.sender).transfer(refund[0]);
        emit RefundPaid(msg.sender, refund[0]);
    }
}
