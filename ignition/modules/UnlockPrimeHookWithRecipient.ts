// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { proxyModule } from "./UnlockPrimeHook";

const upgradeModule = buildModule("UpgradeModule", (m) => {
  const proxyAdminOwner = m.getAccount(0);
  const { proxyAdmin, proxy } = m.useModule(proxyModule);

  const UnlockPrimeHookWithRecipient = m.contract(
    "UnlockPrimeHookWithRecipient",
    [
      "0x01D8412eE898A74cE44187F4877Bf9303E3C16e5", // Unlock Prime
      "0xfa7AC1c24339f629826C419eC95961Df58563438", // Oracle
      "0x4200000000000000000000000000000000000006", // Weth
    ]
  );

  m.call(
    proxyAdmin,
    "upgradeAndCall",
    [proxy, UnlockPrimeHookWithRecipient, "0x"],
    {
      from: proxyAdminOwner,
    }
  );

  return { proxyAdmin, proxy };
});

const unlockPrimeHookWithRecipientModule = buildModule(
  "UnlockPrimeHookWithRecipientModule",
  (m) => {
    const { proxy, proxyAdmin } = m.useModule(upgradeModule);

    const unlockPrimeHook = m.contractAt("UnlockPrimeHookWithRecipient", proxy);

    return { unlockPrimeHook, proxy, proxyAdmin };
  }
);

export default unlockPrimeHookWithRecipientModule;

// // // This setup uses Hardhat Ignition to manage smart contract deployments.
// // // Learn more about it at https://hardhat.org/ignition

// // import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

// // const UnlockPrimeHook = buildModule("UnlockPrimeHook", (m) => {
// //   const hook = m.contract("UnlockPrimeHook", [
// //     "0x01D8412eE898A74cE44187F4877Bf9303E3C16e5", // Unlock Prime
// //     "0xfa7AC1c24339f629826C419eC95961Df58563438", // Oracle
// //     "0x4200000000000000000000000000000000000006", // Weth
// //   ]);

// //   return { hook };
// // });

// // export default UnlockPrimeHook;
