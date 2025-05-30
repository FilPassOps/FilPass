# Chains Configuration

The chains configuration file is located at `src/config/chains-config.ts`. This file contains the configuration data for the chains that the application will use.

Here's a breakdown of its properties:

- `name`: This is a string that represents the name of the chain. It will be used in diverse parts of the system when referring to this chain and also on emails.

- `networkName`: This is a string that represents the name of the network. It will be used in diverse parts of the system when referring to this network and also when connecting to MetaMask.

- `symbol`: This is a string that represents the symbol of the token. It will be used in diverse parts of the system when referring to this token and also as a representation of the token on MetaMask.

- `chainId`: This is a string that represents the chain id of the chain. It will be used on the system as a unique identifier of the chain and also when connecting to MetaMask.

- `units`: This is an object that represents the units of the token. It will be used on the system to convert the token amount to the correct unit. The object has the following properties:
  - `name`: This is a string that represents the name of the unit. It will be used on the system to convert the token amount to the correct unit.
  - `scale`: This is a number that represents the scale of the unit. It will be used on the system to convert the token amount to the correct unit.

- `rpcUrls`: This is an array of strings that represents the RPC URLs of the chain. It will be used on the system to connect to the chain.

- `blockExplorer`: This is an object that represents the block explorer of the chain. It will be used on the system to fetch the transaction details. The object has the following properties:
  - `name`: This is a string that represents the name of the block explorer. It will be used on the system to fetch the transaction details.
  - `url`: This is a string that represents the URL of the block explorer. It will be used on the system to fetch the transaction details.

- `contractAddress`: This is a string that represents the contract address of the token. It will be used on the system to fetch the token details.

- `iconFileName`: This is a string that represents the name of the icon file of the token. The icon needs to be located at `/public/blockchain-icons/`. It will be used on the system to display the token icon.


Here's an example of the system configuration file:

```typescript
const calibration = {
  name: 'Filecoin',
  networkName: 'Calibration',
  chainId: '0x4cb2f',
  rpcUrls: ['https://api.calibration.node.glif.io/rpc/v0'],
  blockExplorer: { name: 'Filfox', url: 'http://47.109.105.51/en/message' },
  contractAddress: '0x650413d87484FC2B9c9bC7b24963f7395a69909b',
  iconFileName: 'filecoin-icon.svg',
  tokens: [
    {
      symbol: 'tFIL',
      coinMarketApiCode: 2280, // from https://pro-api.coinmarketcap.com/v1/cryptocurrency/map?symbol=FIL
      decimals: 18,
      units: {
        0: {
          name: 'FIL',
          scale: 0,
        },
        '-9': {
          name: 'NANOFIL',
          scale: -9,
        },
        '-18': {
          name: 'ATTOFIL',
          scale: -18,
        },
      },
      iconFileName: 'filecoin-icon.svg',
    },
  ],
} as const satisfies Chain

const chains = [calibration]
```

**You can find the list of the chain and its configurations at [chainlist.org](https://chainlist.org/).**