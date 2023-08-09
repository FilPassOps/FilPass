const { loadEnvConfig } = require('@next/env')
loadEnvConfig(process.cwd(), true)
const { getPrismaClient } = require('../../lib/prisma')
const { hash } = require('bcrypt')

async function run() {
  const salt = process.env.EMAIL_KEY

  const prisma = await getPrismaClient()

  console.log('Fetching users...')
  const users = await prisma.user.findMany({
    where: {
      isActive: true,
    },
    select: {
      id: true,
      email: true,
    },
  })

  console.log('Creating promises...')
  await Promise.all(
    users.map(async (user) => {
      return prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          emailHash: await hash(user.email, salt),
        },
      })
    })
  )
  console.log('Finished')
}

run()
  .then(() => {
    process.exit(0)
  })
  .catch((err) => {
    console.log('Failed to update default wallet: ', err)
    process.exit(1)
  })
