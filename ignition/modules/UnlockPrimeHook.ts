// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export const proxyModule = buildModule("ProxyModule", (m) => {
  const proxyAdminOwner = m.getAccount(0);

  const unlockPrimeHookModule = m.contract("UnlockPrimeHook", [
    "0x01D8412eE898A74cE44187F4877Bf9303E3C16e5", // Unlock Prime
    "0xfa7AC1c24339f629826C419eC95961Df58563438", // Oracle
    "0x4200000000000000000000000000000000000006", // Weth
  ]);

  const encodedFunctionCall = m.encodeFunctionCall(
    unlockPrimeHookModule,
    "initialize",
    [
      "0x01D8412eE898A74cE44187F4877Bf9303E3C16e5", // Unlock Prime
      "0xfa7AC1c24339f629826C419eC95961Df58563438", // Oracle
      "0x4200000000000000000000000000000000000006", // Weth
    ]
  );

  const proxy = m.contract("TransparentUpgradeableProxy", [
    unlockPrimeHookModule,
    proxyAdminOwner,
    encodedFunctionCall,
  ]);

  const proxyAdminAddress = m.readEventArgument(
    proxy,
    "AdminChanged",
    "newAdmin"
  );

  const proxyAdmin = m.contractAt("ProxyAdmin", proxyAdminAddress);

  return { proxyAdmin, proxy };
});

const unlockPrimeHookModule = buildModule("UnlockPrimeHookModule", (m) => {
  const { proxy, proxyAdmin } = m.useModule(proxyModule);

  const unlockPrimeHook = m.contractAt("UnlockPrimeHook", proxy);

  return { unlockPrimeHook, proxy, proxyAdmin };
});

export default unlockPrimeHookModule;
