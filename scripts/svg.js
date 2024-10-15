const hre = require("hardhat");
const fs = require("fs-extra");

async function main({ filePath = "./test.svg" } = {}) {
  // re-compile contracts
  await hre.run("compile");

  // We get the contract to deploy
  const UnlockPrimeTokenURIHook = await hre.ethers.getContractFactory(
    "UnlockPrimeTokenURIHook"
  );
  const hook = await UnlockPrimeTokenURIHook.deploy();

  // default

  const [lockAddress, operator, owner] = await ethers.getSigners();
  const keyId = 1;
  const expirationTimestamp = Math.floor(Date.now() / 1000);

  console.log("Parsing SVG from eth node...");
  const tokenURI = await hook.tokenURI(
    lockAddress,
    operator,
    owner,
    keyId,
    expirationTimestamp
  );
  console.log("Done.");

  // decode
  const decoded = Buffer.from(
    tokenURI.replace("data:application/json;base64,", ""),
    "base64"
  ).toString("ascii");

  const { image } = JSON.parse(decoded);

  const svgDecoded = Buffer.from(
    image.replace("data:image/svg+xml;base64,", ""),
    "base64"
  ).toString("ascii");

  await fs.writeFile(filePath, svgDecoded.replace(/\\"/g, '"'));
  console.log(`File saved to ${filePath}.`);
  // console.log("Attributes:");
  // console.log(attributes.replace(/},{/g, "},\n{"));
  // console.log("\n");
}

// execute as standalone
if (require.main === module) {
  /* eslint-disable promise/prefer-await-to-then, no-console */
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

// exports
module.exports = main;
