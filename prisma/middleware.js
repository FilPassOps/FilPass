const { decryptPII, decrypt } = require('lib/emissaryCrypto')

const isFind = action => action === 'findOne' || action === 'findUnique' || action === 'findMany' || action === 'findFirst'

const decryptUser = async ({ email, ...rest }) => ({
  ...rest,
  ...(email && { email: await decryptPII(email) }),
})

const userMiddleware = async (params, next) => {
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

const decryptTransferRequest = async transferRequest => ({
  ...transferRequest,
})

const transferRequestMiddleware = async (params, next) => {
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

const transferMiddleware = async (params, next) => {
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

module.exports = {
  userMiddleware,
  transferRequestMiddleware,
  transferMiddleware,
}
