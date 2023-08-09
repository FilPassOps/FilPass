const { getPrismaClient } = require('../lib/prisma')

async function run() {
  const prisma = await getPrismaClient()
  return prisma.user.findMany({
    where: {
      isActive: true,
    },
    select: {
      id: true,
      email: true,
    },
  })
}

run()
  .then((res) => {
    console.log(res)
    process.exit(0)
  })
  .catch((err) => {
    console.log('Failed to load database users: ', err)
    process.exit(1)
  })
