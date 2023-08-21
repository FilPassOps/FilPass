import prisma, { newPrismaTransaction } from 'lib/prisma'
import { validate } from 'lib/yup'
import { verifyWalletValidator } from './validation'
import { createWallet } from 'domain/wallet/createWallet'
import { TransactionError } from 'lib/errors'
import * as verifyWalletModule from 'domain/walletVerification/verifyWallet'
import errorsMessages from 'wordings-and-errors/errors-messages'

interface VerifyWalletParams {
  amount: number
  unit: string
  verificationId: number
  userId: number
  name: string
  email: string
}

interface HandleWalletVerifiedParams {
  name?: string
  userId: number
  verificationId: number
  address: string
  blockchain: string
  email: string
}

export async function verifyWallet(params: VerifyWalletParams) {
  const { fields, errors } = await validate(verifyWalletValidator, params)
  if (errors || !fields) {
    return {
      error: {
        status: 400,
        errors,
      },
    }
  }

  const { userId, verificationId, amount, name, email } = fields

  const verification = await prisma.walletVerification.findUnique({ where: { id: verificationId } })

  if (!verification) {
    return {
      error: {
        status: 404,
        message: errorsMessages.wallet_verification_not_found.message,
      },
    }
  }

  const { transactionAmount, address, blockchain } = verification

  if (`${transactionAmount}` === `${amount}`) {
    return verifyWalletModule.handleWalletVerified({
      name,
      userId,
      verificationId,
      address,
      blockchain: blockchain,
      email,
    })
  }

  return {
    error: {
      status: 400,
      message: errorsMessages.wallet_verification_value_not_match.message,
    },
  }
}

export async function handleWalletVerified({ name, userId, verificationId, address, blockchain, email }: HandleWalletVerifiedParams) {
  return newPrismaTransaction(async fnPrisma => {
    const userWallets = await fnPrisma.userWallet.findMany({
      where: {
        userId,
        isActive: true,
      },
    })

    const hasDefaultWallet = userWallets?.find(wallet => wallet.isDefault)

    const { data: newWallet, error: walletError } = await createWallet(fnPrisma, {
      name,
      userId,
      verificationId,
      address,
      blockchain,
      isDefault: !hasDefaultWallet,
      email,
    })

    if (walletError) {
      throw new TransactionError('Could not create wallet', { errors: walletError.errors, status: walletError.status })
    }

    await fnPrisma.walletVerification.update({
      where: {
        id: verificationId,
      },
      data: {
        isVerified: true,
      },
    })

    return newWallet
  })
}
