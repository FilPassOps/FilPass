const { loadEnvConfig } = require('@next/env')
loadEnvConfig(process.cwd(), true)
const { hash } = require('bcrypt')
const { default: prisma } = require('lib/prisma')
const lodash = require('lodash')

async function run() {
  const salt = process.env.TEAM_KEY

  console.log('Fetching drafts...')
  const drafts = await prisma.transferRequestDraft.findMany({
    select: {
      id: true,
      team: true,
    },
    where: {},
  })

  console.log('Updating drafts...')
  const draftChunks = lodash.chunk(drafts, 200)

  for (const chunk of draftChunks) {
    const updateData = await Promise.all(
      chunk.map(async draft => ({
        where: {
          id: draft.id,
        },
        data: {
          teamHash: await hash(draft.team, salt),
        },
      }))
    )
    await prisma.$transaction(updateData.map(data => prisma.transferRequestDraft.update(data)))
  }

  console.log('Fetching requests...')
  const requests = await prisma.transferRequest.findMany({
    select: {
      id: true,
      team: true,
    },
    where: {},
  })

  console.log('Updating requests...')
  const requestChunks = lodash.chunk(requests, 200)

  for (const chunk of requestChunks) {
    const updateData = await Promise.all(
      chunk.map(async request => ({
        where: {
          id: request.id,
        },
        data: {
          teamHash: await hash(request.team, salt),
        },
      }))
    )
    await prisma.$transaction(updateData.map(data => prisma.transferRequest.update(data)))
  }

  console.log('Finished')
}

run()
  .then(() => {
    process.exit(0)
  })
  .catch(err => {
    console.log('Failed to update default wallet: ', err)
    process.exit(1)
  })
