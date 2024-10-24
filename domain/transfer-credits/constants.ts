import { AppConfig } from 'config/system'
import { ethers } from 'ethers'

export const MIN_CREDIT_PER_VOUCHER = ethers.utils.parseUnits('0.000001', 6)

export const FIL = AppConfig.network.getTokenBySymbolAndBlockchainName('tFIL', 'Filecoin')
