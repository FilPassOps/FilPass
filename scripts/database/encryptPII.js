const { loadEnvConfig } = require('@next/env')
loadEnvConfig(process.cwd(), true)
const { decrypt, encryptPII, decryptPII } = require('../../lib/emissaryCrypto')
const { DateTime } = require('luxon')
const { getDatabaseURL, getPrismaClient } = require('../../lib/prisma')
const { PrismaClient } = require('@prisma/client')
const assert = require('assert')

const isFind = action => action === 'findOne' || action === 'findUnique' || action === 'findMany' || action === 'findFirst'

let prisma
let tokenExpiration

async function createPrismaClient() {
  const databaseURL = await getDatabaseURL()

  const prismaClient = new PrismaClient({
    datasources: {
      db: {
        url: databaseURL,
      },
    },
  })

  prismaClient.$use(async (params, next) => {
    if (params.model === 'User') {
      if (isFind(params.action)) {
        const result = await next(params)
        if (Array.isArray(result)) {
          return await Promise.all(result.map(async data => ({ ...data, email: await decrypt(data.email) })))
        }

        if (result) {
          return { ...result, email: await decrypt(result.email) }
        }

        return result
      }
      return await next(params)
    }
    if (params.model === 'TransferRequest') {
      if (isFind(params.action)) {
        const result = await next(params)

        if (Array.isArray(result)) {
          return Promise.all(
            result.map(async data => ({
              ...data,
              team: await decrypt(data.team),
            }))
          )
        }

        if (result) {
          return { ...result, team: await decrypt(result.team) }
        }

        return result
      }
    }
    if (params.model === 'TransferRequestDraft') {
      if (isFind(params.action)) {
        const result = await next(params)

        if (Array.isArray(result)) {
          return Promise.all(
            result.map(async data => ({
              ...data,
              team: await decrypt(data.team),
            }))
          )
        }

        if (result) {
          return { ...result, team: await decrypt(result.team) }
        }

        return result
      }
    }
    if (params.model === 'TransferRequestHistory') {
      if (isFind(params.action)) {
        const result = await next(params)

        if (Array.isArray(result)) {
          return Promise.all(
            result.map(async data => ({
              ...data,
              oldValue: await decrypt(data.oldValue),
              newValue: await decrypt(data.newValue),
            }))
          )
        }

        if (result) {
          return { ...result, oldValue: await decrypt(result.oldValue), newValue: await decrypt(result.newValue) }
        }

        return result
      }

      return await next(params)
    }

    return await next(params)
  })

  return prismaClient
}

async function getLocalPrismaClient() {
  if (process && process.env.NODE_ENV !== 'development') {
    if (DateTime.now() >= tokenExpiration) {
      await prisma.$disconnect()
    }
    if (!prisma || DateTime.now() >= tokenExpiration) {
      tokenExpiration = DateTime.now().plus({ minutes: 14 })
      prisma = await createPrismaClient()
    }
    return prisma
  }

  if (!global.localprisma) {
    global.localprisma = await createPrismaClient()
  }
  return global.localprisma
}

async function run() {
  const prisma = await getLocalPrismaClient()

  console.log('Fetching users...')
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
    },
  })

  const oldEmails = users.map(user => user.email).sort()

  console.log('Creating promises for users...')
  await Promise.all(
    users.map(async user => {
      return prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          email: await encryptPII(user.email),
        },
      })
    })
  )
  console.log('Finished users')

  console.log('Fetching TransferRequests...')
  const transferRequests = await prisma.transferRequest.findMany({
    select: {
      id: true,
      team: true,
    },
  })

  const oldTeamNames = transferRequests.map(t => t.team).sort()

  console.log('Creating promises for TransferRequest...')
  await Promise.all(
    transferRequests.map(async transferRequest => {
      return prisma.transferRequest.update({
        where: {
          id: transferRequest.id,
        },
        data: {
          team: await encryptPII(transferRequest.team),
        },
      })
    })
  )
  console.log('Finished TransferRequests')

  console.log('Fetching TransferRequestDrafts...')
  const transferRequestDrafts = await prisma.transferRequestDraft.findMany({
    select: {
      id: true,
      team: true,
    },
  })

  const oldDraftTeamNames = transferRequestDrafts.map(t => t.team).sort()

  console.log('Creating promises for TransferRequestDraft...')
  await Promise.all(
    transferRequestDrafts.map(async draft => {
      return prisma.transferRequestDraft.update({
        where: {
          id: draft.id,
        },
        data: {
          team: await encryptPII(draft.team),
        },
      })
    })
  )
  console.log('Finished TransferRequestDrafts')

  console.log('Fetching TransferRequestsHistory...')
  const transferRequestsHistory = await prisma.transferRequestHistory.findMany({
    select: {
      id: true,
      oldValue: true,
      newValue: true,
    },
    where: {
      field: 'team',
    },
  })

  const oldRequestHistory = transferRequestsHistory.flatMap(t => [t.oldValue, t.newValue]).sort()

  console.log('Creating promises for TransferRequestsHistory...')
  await Promise.all(
    transferRequestsHistory.map(async history => {
      return prisma.transferRequestHistory.update({
        where: {
          id: history.id,
        },
        data: {
          oldValue: await encryptPII(history.oldValue),
          newValue: await encryptPII(history.newValue),
        },
      })
    })
  )
  console.log('Finished TransferRequestsHistory')

  console.log('Fetch and decrypt data test')

  const defaultPrisma = await getPrismaClient()

  console.log('Fetching users reencrypted user data...')
  const updatedUsers = await defaultPrisma.user.findMany({
    select: {
      id: true,
      email: true,
    },
  })

  const updatedEmails = updatedUsers.map(user => user.email).sort()

  assert.deepEqual(oldEmails, updatedEmails, 'Emails dont match')

  console.log('Fetching reencrypted TransferRequests...')
  const updateTransferRequests = await defaultPrisma.transferRequest.findMany({
    select: {
      id: true,
      team: true,
    },
  })

  const updatedTeamNames = updateTransferRequests.map(t => t.team).sort()
  assert.deepEqual(oldTeamNames, updatedTeamNames, 'Team names dont match')

  console.log('Fetching reencrypted TransferRequestDrafts...')
  const updateTransferRequestDrafts = await defaultPrisma.transferRequestDraft.findMany({
    select: {
      id: true,
      team: true,
    },
  })

  const updatedDraftTeamNames = await (await Promise.all(updateTransferRequestDrafts.map(async t => decryptPII(t.team)))).sort()
  assert.deepEqual(oldDraftTeamNames, updatedDraftTeamNames)

  console.log('Fetching updated TransferRequestsHistory...')
  const updateTransferRequestsHistory = await defaultPrisma.transferRequestHistory.findMany({
    select: {
      id: true,
      oldValue: true,
      newValue: true,
    },
    where: {
      field: 'team',
    },
  })

  const updatedHistory = await (
    await Promise.all(updateTransferRequestsHistory.flatMap(async t => [decryptPII(t.oldValue), decryptPII(t.newValue)]))
  ).sort()
  assert.deepEqual(oldRequestHistory, updatedHistory, "History don't match")
}

run()
  .then(() => {
    process.exit(0)
  })
  .catch(err => {
    console.log('Failed: ', err)
    process.exit(1)
  })
