import { validateWalletAddress } from "lib/blockchain-utils"
import { stateMinerInfo } from "lib/filecoin-rpc-api"

export const validateReceiverWallet = async (walletAddress: string) => {
  const isValid = validateWalletAddress(walletAddress)

  if (!isValid) {
    return false
  }

  const response = await stateMinerInfo(walletAddress)

  return response
}
