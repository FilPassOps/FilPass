export const COMPANY_NAME = 'Protocol Labs'
export const PLATFORM_NAME = 'Emissary'

export const EMAIL_DOMAIN = '@protocol.ai'
export const EMAIL_FROM_NAME = 'Emissary Support'
export const SUPPORT_EMAIL = 'emissary@protocol.ai'

export const SANCTION_CHECK_ENABLED = true

// export const TOKEN = {
//   name: 'Filecoin',
//   symbol: 'FIL',
//   coinMarketApiCode: 2280, // from https://pro-api.coinmarketcap.com/v1/cryptocurrency/map?symbol=FIL
//   units: {
//     0: {
//       name: 'FIL',
//       scale: 0,
//     },
//     '-9': {
//       name: 'NANOFIL',
//       scale: -9,
//     },
//     '-18': {
//       name: 'ATTOFIL',
//       scale: -18,
//     },
//   },
//   paymentUnit: "USD"
// } as const

// export const TOKEN = {
//   name: 'Ether',
//   symbol: 'ETH',
//   coinMarketApiCode: 1027, // from https://pro-api.coinmarketcap.com/v1/cryptocurrency/map?symbol=ETH
//   units: {
//     0: {
//       name: 'ETH',
//       scale: 0,
//     },
//     '-9': {
//       name: 'GWEI',
//       scale: -9,
//     },
//     '-18': {
//       name: 'WEI',
//       scale: -18,
//     },
//   },
//   paymentUnit: 'USD',
// } as const

export const TOKEN = {
  name: 'Polygon',
  symbol: 'MATIC',
  coinMarketApiCode: 3890, // from https://pro-api.coinmarketcap.com/v1/cryptocurrency/map?symbol=MATIC
  units: {
    0: {
      name: 'MATIC',
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
  paymentUnit: 'USD',
} as const
