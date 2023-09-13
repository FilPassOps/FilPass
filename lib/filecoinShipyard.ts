import { NodejsProvider } from '@filecoin-shipyard/lotus-client-provider-nodejs'
import { LotusRPC } from '@filecoin-shipyard/lotus-client-rpc'
import { mainnet } from '@filecoin-shipyard/lotus-client-schema'
import config from 'chains.config'
import { logger } from './logger'

const LOTUS_LITE_NODE_API_ENDPOINT = process.env.LOTUS_LITE_NODE_API_ENDPOINT
const LOTUS_LITE_TOKEN = process.env.LOTUS_LITE_TOKEN

if (!LOTUS_LITE_NODE_API_ENDPOINT) {
  throw new Error('Please define LOTUS_LITE_NODE_API_ENDPOINT environment variable')
}

if (!LOTUS_LITE_TOKEN) {
  throw new Error('Please define LOTUS_LITE_TOKEN environment variable')
}

const url = `${LOTUS_LITE_NODE_API_ENDPOINT}/rpc/v0?token=${LOTUS_LITE_TOKEN}`
const provider = new NodejsProvider(url)
const client = new LotusRPC(provider, { schema: mainnet.fullNode })

export const matchWalletAddress = async (address: string) => {
  try {
    if (!address.startsWith(config.coinType)) return false
    const validationResult = await client.walletValidateAddress(address)
    if (validationResult !== address) return false
    return true
  } catch (e) {
    logger.error('Error matching wallet address. ', e)
    return false
  }
}

export const validateWalletAddress = async (chainName: string, address: string) => {
  if (chainName !== 'Filecoin') return address
  if (!address.startsWith(config.coinType)) throw new Error('Invalid address')
  return client.walletValidateAddress(address)
}
