const { decryptPII, decrypt } = require('lib/emissaryCrypto')
const { DateTime } = require('luxon')

const isFind = action => action === 'findOne' || action === 'findUnique' || action === 'findMany' || action === 'findFirst'

const parseDateOfBirth = async dateOfBirth => {
  const isoDateOfBirth = DateTime.fromISO(await decryptPII(dateOfBirth)).toUTC()
  const month = isoDateOfBirth.month.toString()
  const day = isoDateOfBirth.day.toString()
  const year = isoDateOfBirth.year.toString()
  return `${month.padStart(2, '0')}/${day.padStart(2, '0')}/${year}`
}

const decryptUser = async ({ email, firstName, lastName, dateOfBirth, countryResidence, ...rest }) => ({
  ...rest,
  ...(email && { email: await decryptPII(email) }),
  ...(firstName && { firstName: await decryptPII(firstName) }),
  ...(lastName && { lastName: await decryptPII(lastName) }),
  ...(dateOfBirth && { dateOfBirth: await parseDateOfBirth(dateOfBirth) }),
  ...(countryResidence && { countryResidence: await decryptPII(countryResidence) }),
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

const decryptTransferRequest = async ({ amount, team, firstName, lastName, dateOfBirth, countryResidence, ...rest }) => ({
  ...rest,
  ...(amount && { amount: await decrypt(amount) }),
  ...(team && { team: await decryptPII(team) }),
  ...(firstName && { firstName: await decryptPII(firstName) }),
  ...(lastName && { lastName: await decryptPII(lastName) }),
  ...(dateOfBirth && { dateOfBirth: await parseDateOfBirth(dateOfBirth) }),
  ...(countryResidence && { countryResidence: await decryptPII(countryResidence) }),
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
        }))
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
