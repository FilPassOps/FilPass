import { NetworkPrefix, SignatureType, Transaction, Wallet } from '@zondax/izari-filecoin'
import Big from 'big.js'
import config from 'chains.config'
import * as filecoinModule from 'lib/filecoin'

const NODE_ENV = process.env.NODE_ENV
const ENV_NAME = process.env.ENV_NAME
const MASTER_WALLET_PK = process.env.MASTER_WALLET_PK

type FilecoinScaleType = keyof typeof FILECOIN_SCALE_MAP

export function getMasterWallet() {
  if (!MASTER_WALLET_PK) throw new Error('Master wallet not found')

  const wallet = Wallet.recoverAccount(config.networkPrefix as NetworkPrefix, SignatureType.SECP256K1, MASTER_WALLET_PK)

  if (!wallet) throw new Error('Master wallet not found')

  return {
    address: wallet.address.toString(),
  }
}

export async function signMessage(message: unknown) {
  if (!MASTER_WALLET_PK) throw new Error('Master wallet not found')
  const wallet = Wallet.recoverAccount(config.networkPrefix as NetworkPrefix, SignatureType.SECP256K1, MASTER_WALLET_PK)
  if (!wallet) throw new Error('Master wallet not found')

  return (await Wallet.signTransaction(wallet, Transaction.fromJSON(message))).toJSON()
}

export const FIL = 'FIL'

export const NANOFIL = 'NANOFIL'

export const ATTOFIL = 'ATTOFIL'

export const FILECOIN_SCALE_MAP = {
  [FIL]: 0,
  [NANOFIL]: -9,
  [ATTOFIL]: -18,
}

export function getVerificationAmount(fromProtocol: boolean) {
  const valueScale = filecoinModule.getVerificationAmountScale()
  let value = Math.ceil(Math.random() * 10) / valueScale

  if (fromProtocol && ENV_NAME === 'production') {
    value = Number((0.2 + Math.round(Math.random() * 10) / 1000).toFixed(3))
  }

  if (fromProtocol && ENV_NAME !== 'production') {
    value = Number((0.000002 + Math.round(Math.random() * 10) / 10000000).toFixed(7))
  }
  return {
    value: value,
    scale: FIL as FilecoinScaleType,
  }
}

export function getVerificationAmountScale() {
  return NODE_ENV === 'production' ? 1000 : 1000000
}

export function convert(amount: string, from: keyof typeof FILECOIN_SCALE_MAP, to: keyof typeof FILECOIN_SCALE_MAP) {
  if (from === to) {
    return amount
  }

  const fromScale = FILECOIN_SCALE_MAP[from]
  if (isNaN(fromScale)) {
    throw new Error(`Filecoin scale '${from}' not found`)
  }

  const toScale = FILECOIN_SCALE_MAP[to]
  if (isNaN(toScale)) {
    throw new Error(`Filecoin scale '${to}' not found`)
  }

  let diff
  if (fromScale > toScale) {
    diff = Math.abs(fromScale - toScale)
  } else {
    diff = Math.abs(toScale - fromScale) * -1
  }

  return new Big(amount).times(new Big(10).pow(diff))
}
