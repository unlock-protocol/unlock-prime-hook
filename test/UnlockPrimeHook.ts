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

    // Set the hook on avatar
    await (
      await lock.setEventHooks(
        await hook.getAddress(),
        hre.ethers.ZeroAddress,
        hre.ethers.ZeroAddress,
        hre.ethers.ZeroAddress,
        hre.ethers.ZeroAddress,
        hre.ethers.ZeroAddress,
        hre.ethers.ZeroAddress
      )
    ).wait();

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

  describe("Deployment", function () {
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
    });
  });
});
