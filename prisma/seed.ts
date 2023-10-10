import { loadEnvConfig } from '@next/env'
import { PrismaClient } from '@prisma/client'
import { hash } from 'bcrypt'
import { AppConfig } from '../config'
import { encryptPII } from '../lib/emissaryCrypto'

loadEnvConfig(process.cwd(), true)

const prisma = new PrismaClient()
const salt = process.env.EMAIL_KEY || ''

async function main() {
  await createSystemUser()
  await createCurrencies()
}

async function createSystemUser() {
  const systemUser = await prisma.user.create({
    data: {
      email: await encryptPII(`system${AppConfig.app.emailConfig.domain}`),
      emailHash: await hash(`system${AppConfig.app.emailConfig}`, salt),
      isActive: true,
      isVerified: true,
    },
  })

  await prisma.userRole.create({
    data: {
      userId: systemUser.id,
      role: 'SUPERADMIN',
    },
  })
  await prisma.userRole.create({
    data: {
      userId: systemUser.id,
      role: 'USER',
    },
  })
}

async function createCurrencies() {
  const usdCurrency = await prisma.currency.create({
    data: {
      name: 'USD',
      rate: 0,
    },
  })
  await prisma.currencyUnit.create({
    data: {
      currencyId: usdCurrency.id,
      name: 'USD',
      scale: 0,
    },
  })

  for (const chain of AppConfig.network.chains) {
    const [blockchain] = await prisma.$transaction([
      prisma.blockchain.create({
        data: {
          name: chain.name,
          chainId: chain.chainId,
          Currency: {
            create: {
              name: chain.symbol,
              rate: 1,
            },
          },
        },
      }),
    ])
    await prisma.currencyUnit.createMany({
      data: [
        { currencyId: blockchain.currencyId, name: chain.symbol, scale: 0 },
        { currencyId: blockchain.currencyId, name: chain.units['-9'].name, scale: chain.units['-9'].scale },
        { currencyId: blockchain.currencyId, name: chain.units['-18'].name, scale: chain.units['-18'].scale },
      ],
    })
  }
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
