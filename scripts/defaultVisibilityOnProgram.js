const { getPrismaClient } = require('../lib/prisma')

async function run() {
  const prisma = await getPrismaClient()
  return await prisma.program.updateMany({
    where: {
      visibility: {
        equals: null,
      },
    },
    data: {
      visibility: 'EXTERNAL',
    },
  })
}

run()
  .then((res) => {
    console.log(res)
    process.exit(0)
  })
  .catch((err) => {
    console.log('Failed: ', err)
    process.exit(1)
  })
