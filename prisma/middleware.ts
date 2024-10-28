import { decryptPII } from 'lib/crypto'

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
