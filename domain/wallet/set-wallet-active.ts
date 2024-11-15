import { verify } from 'lib/jwt'
import { newPrismaTransaction } from 'lib/prisma'
import errorsMessages from 'wordings-and-errors/errors-messages'

interface SetWalletActiveParams {
  token: string
}

export const setWalletActive = async ({ token }: SetWalletActiveParams) => {
  try {
    const { data: decoded } = verify(token) as any

    return await newPrismaTransaction(async prisma => {
      await prisma.userWallet.update({
        where: { id: decoded?.id },
        data: { isActive: true },
      })

      return {
        error: null,
      }
    })
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
