import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre from "hardhat";
import networks from "@unlock-protocol/networks";
import UP_ABI from "../lib/UP.json";

const lockArgs = {
  expirationDuration: 60 * 60 * 24 * 30, // 30 days
  currencyContractAddress: "0xac27fa800955849d6d17cc8952ba9dd6eaa66187", // UP
  keyPrice: hre.ethers.parseUnits("1000"), // 1000 UP
  maxNumberOfKeys: 10000,
  name: "Unlock Prime",
  unlockAddress: networks[8453].unlockAddress,
};

const swapContract = "0x12be7322070cFA75E2f001C6B3d6Ac8C2efEF5Ea";
const up = "0xac27fa800955849d6d17cc8952ba9dd6eaa66187";
const oracle = "0xfa7AC1c24339f629826C419eC95961Df58563438";
const weth = "0x4200000000000000000000000000000000000006";

describe("UnlockPrimeHook", function () {
  async function deployContracts() {
    const [deployer] = await hre.ethers.getSigners();

    // Deploy lock
    const { lock } = await hre.unlock.createLock(lockArgs);

    // Deploy hook
    const Hook = await hre.ethers.getContractFactory("UnlockPrimeHook");
    const hook = await Hook.deploy(lock.getAddress(), oracle, weth);

    // Set the hook
    await (
      await lock.setEventHooks(
        await hook.getAddress(), // _onKeyPurchaseHook
        hre.ethers.ZeroAddress,
        hre.ethers.ZeroAddress,
        hre.ethers.ZeroAddress,
        hre.ethers.ZeroAddress,
        await hook.getAddress(), // _onKeyExtendHook
        hre.ethers.ZeroAddress
      )
    ).wait();

    // Fund the hook
    await hre.network.provider.send("hardhat_setBalance", [
      await hook.getAddress(),
      "0x10000000000000000000",
    ]);

    // Fund the deployer with some UP
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [swapContract],
    });
    await hre.network.provider.send("hardhat_setBalance", [
      swapContract,
      "0x10000000000000000000",
    ]);
    const swapContractSigner = await hre.ethers.getSigner(swapContract);
    const upContract = await hre.ethers.getContractAt(
      UP_ABI,
      up,
      swapContractSigner
    );
    await (
      await upContract.transfer(
        deployer.getAddress(),
        hre.ethers.parseUnits("1000000") // 1M UP
      )
    ).wait();

    return { lock, hook };
  }

  it("should return the right keyPrice", async function () {
    const { lock, hook } = await loadFixture(deployContracts);
    const [deployer] = await hre.ethers.getSigners();

    expect(await lock.purchasePriceFor(deployer, deployer, "0x")).to.equal(
      lockArgs.keyPrice
    );
    expect(await lock.onKeyPurchaseHook()).to.equal(await hook.getAddress());
  });

  it("should let the user make a purchase", async () => {
    const { lock, hook } = await loadFixture(deployContracts);
    const [deployer] = await hre.ethers.getSigners();

    // Approve UP to be spent!
    const upContract = await hre.ethers.getContractAt(UP_ABI, up, deployer);
    await (
      await upContract.approve(lock.getAddress(), lockArgs.keyPrice)
    ).wait();

    const initialRefund = await hook.refunds(await deployer.getAddress(), 0);
    const initialDeadline = await hook.refunds(await deployer.getAddress(), 1);
    expect(initialRefund).to.equal(0);
    expect(initialDeadline).to.equal(0);

    // Make a purchase!
    await (
      await lock.purchase(
        [lockArgs.keyPrice],
        [deployer.getAddress()],
        [deployer.getAddress()],
        [deployer.getAddress()],
        ["0x"]
      )
    ).wait();

    // Refund should be set to be not 0 and set in the future!
    const refund = await hook.refunds(await deployer.getAddress(), 0);
    const deadline = await hook.refunds(await deployer.getAddress(), 1);
    expect(refund).to.greaterThan(0);
    expect(Number(deadline)).to.greaterThan(
      Math.floor(new Date().getTime() / 1000) + 60 * 60 * 24 * 10
    );
  });

  it("should let the user claim a refund once if enough time has passed", async () => {
    const { lock, hook } = await loadFixture(deployContracts);
    const [deployer] = await hre.ethers.getSigners();

    // Approve UP to be spent!
    const upContract = await hre.ethers.getContractAt(UP_ABI, up, deployer);
    await (
      await upContract.approve(lock.getAddress(), lockArgs.keyPrice)
    ).wait();

    // Make a purchase!
    await (
      await lock.purchase(
        [lockArgs.keyPrice],
        [deployer.getAddress()],
        [deployer.getAddress()],
        [deployer.getAddress()],
        ["0x"]
      )
    ).wait();

    await expect(hook.claimRefund()).to.be.revertedWith(
      "Refund not available yet"
    );
    const deadline = await hook.refunds(await deployer.getAddress(), 1);
    const refund = await hook.refunds(await deployer.getAddress(), 0);
    await time.increaseTo(BigInt(deadline));

    const balanceBefore = await hre.ethers.provider.getBalance(
      deployer.getAddress()
    );

    const receipt = await (await hook.claimRefund()).wait();
    const transactionCost = receipt!.gasUsed * receipt!.gasPrice;
    const balanceAfter = await hre.ethers.provider.getBalance(
      deployer.getAddress()
    );
    expect(balanceAfter).to.equal(balanceBefore + refund - transactionCost);

    // Withdraw again should fail!
    await expect(hook.claimRefund()).to.be.revertedWith("No refund available");
  });

  it("should handle extensions", async () => {
    const { lock, hook } = await loadFixture(deployContracts);
    const [deployer] = await hre.ethers.getSigners();

    // Approve UP to be spent!
    const upContract = await hre.ethers.getContractAt(UP_ABI, up, deployer);
    await (
      await upContract.approve(lock.getAddress(), lockArgs.keyPrice * 10n)
    ).wait();

    // Make a purchase!
    await (
      await lock.purchase(
        [lockArgs.keyPrice],
        [deployer.getAddress()],
        [deployer.getAddress()],
        [deployer.getAddress()],
        ["0x"]
      )
    ).wait();

    const refund = await hook.refunds(await deployer.getAddress(), 0);
    const delay = await hook.refunds(await deployer.getAddress(), 1);

    // We only minted token 1
    const expiration = await lock.keyExpirationTimestampFor(1);
    // ok, let's wait for the key to expire!
    await time.increaseTo(BigInt(expiration));

    // And now let's extend the key
    await (
      await lock.extend(lockArgs.keyPrice, 1, deployer.getAddress(), "0x")
    ).wait();

    expect(await hook.refunds(await deployer.getAddress(), 0)).to.greaterThan(
      refund
    );
    expect(await hook.refunds(await deployer.getAddress(), 1)).to.greaterThan(
      delay
    );
  });

  it("should handle early extensions and not increase the refund", async () => {
    const { lock, hook } = await loadFixture(deployContracts);
    const [deployer] = await hre.ethers.getSigners();

    // Approve UP to be spent!
    const upContract = await hre.ethers.getContractAt(UP_ABI, up, deployer);
    await (
      await upContract.approve(lock.getAddress(), lockArgs.keyPrice * 10n)
    ).wait();

    // Make a purchase!
    await (
      await lock.purchase(
        [lockArgs.keyPrice],
        [deployer.getAddress()],
        [deployer.getAddress()],
        [deployer.getAddress()],
        ["0x"]
      )
    ).wait();

    const refund = await hook.refunds(await deployer.getAddress(), 0);

    // We only minted token 1
    const expiration = await lock.keyExpirationTimestampFor(1);

    // Ok let's cancel the key.
    await (await lock.cancelAndRefund(1)).wait();
    expect(await hook.refunds(await deployer.getAddress(), 0)).to.equal(refund);

    // And now let's extend the key
    await (
      await lock.extend(lockArgs.keyPrice, 1, deployer.getAddress(), "0x")
    ).wait();

    expect(await hook.refunds(await deployer.getAddress(), 0)).to.equal(refund);
  });

  it("should let the lock manager change the oracle", async () => {
    const { lock, hook } = await loadFixture(deployContracts);
    const [deployer, randomUser] = await hre.ethers.getSigners();

    expect(await hook.oracle()).to.equal(oracle);

    const newOracle = "0x2411336105D4451713d23B5156038A48569EcE3a";
    await expect(
      hook.connect(randomUser).setOracle(newOracle)
    ).to.be.revertedWith("Caller is not a lock manager");
    await (await hook.setOracle(newOracle)).wait();
    expect(await hook.oracle()).to.equal(newOracle);
  });

  it("should let the lock manager change the weth contract", async () => {
    const { lock, hook } = await loadFixture(deployContracts);
    const [deployer, randomUser] = await hre.ethers.getSigners();

    expect(await hook.weth()).to.equal(weth);

    const newWeth = "0x4200000000000000000000000000000000000007";
    await expect(hook.connect(randomUser).setWeth(newWeth)).to.be.revertedWith(
      "Caller is not a lock manager"
    );
    await (await hook.setWeth(newWeth)).wait();
    expect(await hook.weth()).to.equal(newWeth);
  });

  it("should let the lock manager change the unlock prime contract", async () => {
    const { lock, hook } = await loadFixture(deployContracts);
    const [deployer, randomUser] = await hre.ethers.getSigners();

    const { lock: newLock } = await hre.unlock.createLock(lockArgs);

    expect(await hook.unlockPrime()).to.equal(await lock.getAddress());

    await expect(
      hook.connect(randomUser).setUnlockPrime(await newLock.getAddress())
    ).to.be.revertedWith("Caller is not a lock manager");
    await (await hook.setUnlockPrime(await newLock.getAddress())).wait();
    expect(await hook.unlockPrime()).to.equal(await newLock.getAddress());
  });
});
