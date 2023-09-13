import { Prisma } from '@prisma/client'
import { sendWalletVerificationNotification } from 'domain/notifications/sendWalletVerificationNotification'
import { validate } from 'lib/yup'
import errorsMessages from 'wordings-and-errors/errors-messages'
import { createWalletValidator } from './validation'

interface CreateWalletParams {
  name?: string
  verificationId: number
  userId: number
  address: string
  blockchain: string // TODO OPEN-SOURCE: should be the id of the blockchain table
  isDefault: boolean
  email: string
}

interface WalletSearchResult {
  wallet_exists: number
  verification_used: number
  verification_match: number
}

export async function createWallet(prisma: Prisma.TransactionClient, params: CreateWalletParams) {
  const { fields, errors } = await validate(createWalletValidator, params)

  if (errors || !fields) {
    return {
      error: {
        status: 400,
        errors,
      },
    }
  }

  const { name, address, blockchain, verificationId, userId, isDefault, email } = fields

  const blokchainEntity = await prisma.blockchain.findUnique({ where: { name: blockchain } })

  if (!blokchainEntity) {
    return {
      error: {
        status: 400,
        errors: {
          address: errorsMessages.wallet_blockchain_not_found,
        },
      },
    }
  }

  console.log({ address, verificationId, userId })

  const [walletSearchResult] = await prisma.$queryRaw<WalletSearchResult[]>`
  SELECT *
  FROM
    (
      SELECT
        SUM(CASE WHEN wallet.address = ${address} THEN 1 ELSE 0 END) wallet_exists,
        SUM(CASE WHEN wallet.verification_id = ${verificationId} THEN 1 ELSE 0 END) verification_used
      FROM user_wallet wallet
      WHERE
        wallet.is_active = TRUE
        AND wallet.user_id = ${userId}
    ) wallet,
    (
      SELECT
        SUM(1) verification_match
      FROM wallet_verification verification
      WHERE
        verification.id = ${verificationId}
        AND verification.address = ${address}
        AND verification.user_id = ${userId}
        AND verification.blockchain_id = blokchainEntity.id
        AND verification.is_active = TRUE
    ) verification;
  `

  // TODO OPEN-SOURCE: should the id of the blockchain table

  const { wallet_exists = 0, verification_used = 0, verification_match = 0 } = walletSearchResult
  if (wallet_exists > 0) {
    return {
      error: {
        status: 400,
        errors: {
          address: errorsMessages.wallet_address_in_use,
        },
      },
    }
  }

  //errors within the following block shouldn't happen when trying to create wallets from the application
  if (verificationId) {
    if (verification_used > 0) {
      return {
        error: {
          status: 400,
          message: 'Verification already being used',
        },
      }
    }

    if (verification_match === 0) {
      return {
        error: {
          status: 400,
          message: 'Verification does not match wallet',
        },
      }
    }
  }

  const wallet = await prisma.userWallet.upsert({
    where: {
      userId_address_blockchainId: { address, userId, blockchainId: blokchainEntity.id },
    },
    update: {
      verificationId,
      name,
      isDefault,
    },
    create: {
      userId,
      verificationId,
      name,
      address,
      blockchainId: blokchainEntity.id, // TODO OPEN-SOURCE: should get the value from params
      isDefault,
      isActive: false,
    },
  })

  await sendWalletVerificationNotification({ address, id: wallet.id, email, userId })

  return {
    data: wallet,
  }
}
