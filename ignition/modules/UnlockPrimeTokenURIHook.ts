import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("UnlockPrimeTokenURIHook", (m) => {
  const apollo = m.contract("UnlockPrimeTokenURIHook", []);
  return { apollo };
});

