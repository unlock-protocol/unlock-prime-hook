# Unlock Prime Hook

A custom hook contract for Unlock Prime.
The hook keeps tracks of the ETH to refund on purchase and renewals.

## How to generate the SVG

For debugging purposes, this will generate the svg as a `test.svg` file that can be seen in the browser

```
yarn svg
```

There is also a task that will "atch" rebuild the svg whenever it is edited

```
yarn watch:svg
```

## Deployment

_TokenURI hook_

```
yarn hardhat ignition deploy ignition/modules/UnlockPrimeTokenURI.ts
```
