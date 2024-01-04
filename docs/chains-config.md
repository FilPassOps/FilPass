# Chains Configuration

The chains configuration file is located at `src/config/chains-config.ts`. This file contains the configuration data for the chains that the application will use.

Here's a breakdown of its properties:

- `name`: This is a string that represents the name of the chain. It will be used in diverse parts of the system when referring to this chain and also on emails.

- `networkName`: This is a string that represents the name of the network. It will be used in diverse parts of the system when referring to this network and also when connecting to MetaMask.

- `symbol`: This is a string that represents the symbol of the token. It will be used in diverse parts of the system when referring to this token and also as a representation of the token on MetaMask.

- `chainId`: This is a string that represents the chain id of the chain. It will be used on the system as a unique identifier of the chain and also when connecting to MetaMask.

- `coinMarketApiCode`: This is a number that represents the code of the chain on CoinMarketCap. It will be used on the system to fetch the price of the token. (Optional)

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
const ethereum = {
  name: 'Ethereum',
  networkName: 'Sepolia',
  symbol: 'ETH',
  chainId: '0xaa36a7',
  coinMarketApiCode: 1027, // from https://pro-api.coinmarketcap.com/v1/cryptocurrency/map?symbol=MATIC
  units: {
    0: {
      name: 'ETH',
      scale: 0,
    },
    '-9': {
      name: 'GWEI',
      scale: -9,
    },
    '-18': {
      name: 'WEI',
      scale: -18,
    },
  },
  rpcUrls: ['https://ethereum-sepolia.blockpi.network/v1/rpc/public'],
  blockExplorer: { name: 'Etherscan', url: 'https://sepolia.etherscan.io/tx' },
  contractAddress: '0x9697210C47cFb1460eE60809e7a6CB12c90d4a4e',
  iconFileName: 'ethereum-icon.svg',
} as const satisfies Chain

const chains = [ethereum]
```

**You can find the list of the chain and its configurations at [chainlist.org](https://chainlist.org/).**