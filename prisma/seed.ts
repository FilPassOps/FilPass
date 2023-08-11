import { loadEnvConfig } from '@next/env'
import { PrismaClient } from '@prisma/client'
import { hash } from 'bcrypt'
import { encryptPII } from '../lib/emissaryCrypto'
import { EMAIL_DOMAIN, TOKEN } from '../system.config'

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
  const [tokenCurrency, usdCurrency] = await prisma.$transaction([
    prisma.currency.create({
      data: {
        id: 1,
        name: TOKEN.symbol,
        rate: 1,
      },
    }),
    prisma.currency.create({
      data: {
        id: 2,
        name: TOKEN.paymentUnit,
        rate: 0,
      },
    }),
    prisma.blockchain.create({
      data: {
        id: 1,
        name: TOKEN.name,
      },
    }),
  ])
  await prisma.currencyUnit.createMany({
    data: [
      { id: 1, currencyId: tokenCurrency.id, name: TOKEN.symbol, scale: 0 },
      { id: 2, currencyId: tokenCurrency.id, name: TOKEN.units['-9'].name, scale: TOKEN.units['-9'].scale },
      { id: 3, currencyId: tokenCurrency.id, name: TOKEN.units['-18'].name, scale: TOKEN.units['-18'].scale },
      { id: 4, currencyId: usdCurrency.id, name: TOKEN.paymentUnit, scale: 0 },
    ],
  })
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
