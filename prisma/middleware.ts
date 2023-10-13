import { TransferRequest } from '@prisma/client'
import { decryptPII, decrypt } from 'lib/emissary-crypto'

interface DecryptUserParams {
  email: string
  [key: string]: any
}

const isFind = (action: string) => action === 'findOne' || action === 'findUnique' || action === 'findMany' || action === 'findFirst'

const decryptUser = async ({ email, ...rest }: DecryptUserParams) => ({
  ...rest,
  ...(email && { email: await decryptPII(email) }),
})

export const userMiddleware = async (params: { action: any }, next: (params: any) => Promise<any>) => {
  if (isFind(params.action)) {
    const result = await next(params)
    if (Array.isArray(result)) {
      return await Promise.all(result.map(async data => await decryptUser(data)))
    }

    if (result) {
      return await decryptUser(result)
    }

    return result
  }
  return await next(params)
}

const decryptTransferRequest = async (transferRequest: TransferRequest) => ({
  ...transferRequest,
  ...(transferRequest.amount && { amount: await decrypt(transferRequest.amount) }),
  ...(transferRequest.team && { team: await decryptPII(transferRequest.team) }),
})

export const transferRequestMiddleware = async (params: { action: any }, next: (params: any) => Promise<any>) => {
  if (isFind(params.action)) {
    const result = await next(params)

    if (Array.isArray(result)) {
      return Promise.all(result.map(async data => await decryptTransferRequest(data)))
    }

    if (result) {
      return await decryptTransferRequest(result)
    }

    return result
  }

  return await next(params)
}

export const transferMiddleware = async (params: { action: any }, next: (params: any) => Promise<any>) => {
  if (isFind(params.action)) {
    const result = await next(params)

    if (Array.isArray(result)) {
      return Promise.all(
        await result.map(async data => ({
          ...data,
          amount: await decrypt(data.amount),
        })),
      )
    }

    if (result) {
      return { ...result, amount: await decrypt(result.amount) }
    }

    return result
  }

  return await next(params)
}
