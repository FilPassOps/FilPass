import { loadEnvConfig } from '@next/env'
import { PrismaClient } from '@prisma/client'
import { hash } from 'bcrypt'
import { encryptPII } from '../lib/emissaryCrypto'
import { CONFIG, EMAIL_DOMAIN } from '../system.config'

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
      email: await encryptPII(`system${EMAIL_DOMAIN}`),
      emailHash: await hash(`system${EMAIL_DOMAIN}`, salt),
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

  for (const chain of CONFIG.chains) {
    const [tokenCurrency] = await prisma.$transaction([
      prisma.currency.create({
        data: {
          name: chain.symbol,
          rate: 1,
        },
      }),
      prisma.blockchain.create({
        data: {
          name: chain.name,
        },
      }),
    ])
    await prisma.currencyUnit.createMany({
      data: [
        { currencyId: tokenCurrency.id, name: chain.symbol, scale: 0 },
        { currencyId: tokenCurrency.id, name: chain.units['-9'].name, scale: chain.units['-9'].scale },
        { currencyId: tokenCurrency.id, name: chain.units['-18'].name, scale: chain.units['-18'].scale },
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
