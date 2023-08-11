import { sendMetaMaskConnectionReward } from 'domain/reward/sendMetaMaskConnectionReward'
import { decryptPII } from 'lib/emissaryCrypto'
import { getDelegatedAddress } from 'lib/getDelegatedAddress'
import { verify } from 'lib/jwt'
import { logger } from 'lib/logger'
import prisma from 'lib/prisma'
import errorsMessages from 'wordings-and-errors/errors-messages'

interface SetWalletActiveParams {
  token: string
}

const METAMASK_CONNECTION_REWARD_DOMAIN = process.env.METAMASK_CONNECTION_REWARD_DOMAIN || '@protocol.ai'

export const setWalletActive = async ({ token }: SetWalletActiveParams) => {
  try {
    const { data: decoded } = verify(token) as any

    const [hasDefaultActive] = await prisma.userWallet.findMany({
      where: { userId: decoded?.userId, isDefault: true, isActive: true },
    })

    const isEthereumWallet = decoded.address?.startsWith('0x') || decoded.address?.startsWith('f4') || decoded.address?.startsWith('t4')

    const { address, user } = await prisma.userWallet.update({
      where: { id: decoded?.id },
      data: { isActive: true, isDefault: !hasDefaultActive && !isEthereumWallet },
      select: {
        address: true,
        user: {
          select: {
            email: true,
          },
        },
      },
    })

    const email = await decryptPII(user.email)

    if (email?.endsWith(METAMASK_CONNECTION_REWARD_DOMAIN) && address.startsWith('0x')) {
      const delegatedAddress = getDelegatedAddress(address)

      if (!delegatedAddress?.fullAddress) {
        logger.error('Delegated address not found while rewarding')
        return {
          error: null,
        }
      }

      sendMetaMaskConnectionReward({
        address: delegatedAddress.fullAddress,
      })
    }

    return {
      error: null,
    }
  } catch (error: any) {
    const tokenExpired = error?.name === 'TokenExpiredError'
    return {
      error: {
        status: tokenExpired ? 400 : 500,
        message: tokenExpired ? errorsMessages.expired_token_link.message : errorsMessages.something_went_wrong.message,
      },
    }
  }
}
