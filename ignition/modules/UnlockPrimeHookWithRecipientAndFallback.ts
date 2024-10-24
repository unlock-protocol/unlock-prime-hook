// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { upgradeModule as proxyModule } from "./UnlockPrimeHookWithRecipient";

const upgradeModule = buildModule("UpgradeModuleWithFallback", (m) => {
  // Deploy new implementation contract
  const UnlockPrimeHookWithRecipientAndFallback = m.contract(
    "UnlockPrimeHookWithRecipientAndFallback",
    [
      "0x01D8412eE898A74cE44187F4877Bf9303E3C16e5", // Unlock Prime
      "0xfa7AC1c24339f629826C419eC95961Df58563438", // Oracle
      "0x4200000000000000000000000000000000000006", // Weth
    ]
  );

  const proxyAdminOwner = m.getAccount(0);
  const { proxyAdmin, proxy } = m.useModule(proxyModule);

  m.call(
    proxyAdmin,
    "upgradeAndCall",
    [proxy, UnlockPrimeHookWithRecipientAndFallback, "0x"],
    {
      from: proxyAdminOwner,
    }
  );

  return { proxyAdmin, proxy };
});

// const unlockPrimeHookWithRecipientAndFallbackModule = buildModule(
//   "UnlockPrimeHookWithRecipientAndFallbackModule",
//   (m) => {
//     const { proxy, proxyAdmin } = m.useModule(upgradeModule);

//     const unlockPrimeHook = m.contractAt(
//       "UnlockPrimeHookWithRecipientAndFallback",
//       proxy
//     );

//     return { unlockPrimeHook, proxy, proxyAdmin };
//   }
// );

// export default unlockPrimeHookWithRecipientAndFallbackModule;
export default upgradeModule;
