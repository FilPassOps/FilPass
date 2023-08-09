const { getPrismaClient } = require('../../lib/prisma')

async function run() {
  const prisma = await getPrismaClient()

  const users = await prisma.user.findMany({
    where: {
      isActive: true,
    },
    select: {
      id: true,
      wallets: {
        select: {
          id: true,
          isDefault: true,
        },
      },
    },
  })

  const userWithNoDefaultWallet = users.filter((user) => {
    if (user.wallets.length > 0 && !user.wallets.find((wallet) => wallet.isDefault)) {
      return user
    }
  })

  await Promise.all(
    userWithNoDefaultWallet.map(async (user) => {
      const [wallet] = user.wallets
      await prisma.userWallet.updateMany({
        where: {
          id: wallet.id,
          isDefault: false,
        },
        data: {
          isDefault: true,
        },
      })
      console.log(`Updated default wallet for user ${user.id}`)
    })
  )
}

run()
  .then(() => {
    process.exit(0)
  })
  .catch((err) => {
    console.log('Failed to update default wallet: ', err)
    process.exit(1)
  })
