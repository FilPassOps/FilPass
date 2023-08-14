import jwt from 'jsonwebtoken'
import { newPrismaTransaction } from 'lib/prisma'
import { validate } from 'lib/yup'
import errorsMessages from 'wordings-and-errors/errors-messages'
import { setDefaultValidator } from './validation'
import { logger } from 'lib/logger'

export const setDefault = async params => {
  const { fields, errors } = await validate(setDefaultValidator, params)

  if (errors) {
    return {
      error: {
        status: 400,
        errors,
      },
    }
  }

  const { token } = fields

  let data
  try {
    const decoded = jwt.verify(token, process.env.APP_SECRET)
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
