import jwt from 'jsonwebtoken'
import { newPrismaTransaction } from 'lib/prisma'
import { validate } from 'lib/yup'
import errorsMessages from 'wordings-and-errors/errors-messages'
import { setDefaultValidator } from './validation'
import { logger } from 'lib/logger'

interface SetDefaultParams {
  token?: string
}

interface DecodedData {
  newDefaultWallet: {
    id: number
    userId: number
    address: string
  }
}

export const setDefault = async (params: SetDefaultParams) => {
  const { fields, errors } = await validate(setDefaultValidator, params)

  if (errors || !fields) {
    return {
      error: {
        status: 400,
        errors,
      },
    }
  }

  const { token } = fields

  let data: DecodedData

  try {
    const secret = process.env.APP_SECRET

    if (!secret) {
      return {
        error: {
          status: 500,
          errors: [errorsMessages.something_went_wrong.message],
        },
      }
    }

    const decoded = jwt.verify(token, secret) as DecodedData
    data = decoded
  } catch (error) {
    logger.error('Error verifying token. ', JSON.stringify(error))
    return {
      error: {
        status: 400,
        errors: { token: { message: errorsMessages.invalid_token.message } },
      },
    }
  }

  if (
    data.newDefaultWallet.address.startsWith('0x') ||
    data.newDefaultWallet.address.startsWith('f4') ||
    data.newDefaultWallet.address.startsWith('t4')
  ) {
    return {
      error: {
        status: 400,
        message: errorsMessages.invalid_default_wallet_ethereum.message,
      },
    }
  }

  return await newPrismaTransaction(async prisma => {
    await prisma.userWallet.updateMany({
      where: { userId: data.newDefaultWallet.userId },
      data: { isDefault: false },
    })

    await prisma.userWallet.update({
      where: { id: data.newDefaultWallet.id },
      data: { isDefault: true },
    })

    return { success: true }
  })
}
