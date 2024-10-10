import { Blockchain } from '@prisma/client'
import { hash } from 'bcrypt'

import { loadEnvConfig } from '@next/env'
import { PrismaClient } from '@prisma/client'
import { AppConfig } from '../config'
import { encryptPII } from '../lib/emissary-crypto'
loadEnvConfig(process.cwd(), true)

const prisma = new PrismaClient()
const salt = process.env.EMAIL_KEY || ''
const password = '$2b$10$uRaqhFBl8ox3GFuZc2GE6euiv3AWKLmN8dbfPUmkSZh2P7u8km6wC' // password

let blockchainList: Blockchain[] = []

async function main() {
  blockchainList = await getBlockchainValues()

  await Promise.all([createSuperAdmin(), createViewer()])

  for (let i = 0; i < 150; i++) {
    await createUser(i)
  }
}

async function createUser(index: number) {
  const user = await prisma.user.create({
    data: {
      email: await encryptPII(`user${index}@test.com`),
      emailHash: await hash(`user${index}@test.com`, salt),
      isActive: true,
      isVerified: true,
      password: password,
      terms: true,
    },
  })

  const promises = AppConfig.network.chains.map((chain, index) => {
    const blockchainId = blockchainList.find(blockchain => blockchain.name === chain.name)?.id

    if (!blockchainId) throw new Error(`Blockchain ${chain.name} not found`)

    return prisma.userWallet.create({
      data: {
        address: '0xe1d4a6d35d980ef93cc3be03c543edec2948c3d1',
        userId: user.id,
        blockchainId,
        isDefault: index === 0,
      },
    })
  })

  const userWallets = await Promise.all(promises)

  const userRole = await prisma.userRole.create({
    data: {
      userId: user.id,
      role: 'USER',
    },
  })

  return { user, userRole, userWallets }
}

async function createViewer() {
  const viewer = await prisma.user.create({
    data: {
      email: await encryptPII(`test-viewer${AppConfig.app.emailConfig.domain}`),
      emailHash: await hash(`test-viewer${AppConfig.app.emailConfig.domain}`, salt),
      isActive: true,
      isVerified: true,
      password: password,
    },
  })

  await prisma.userRole.create({
    data: {
      userId: viewer.id,
      role: 'USER',
    },
  })

  const viewerRole = await prisma.userRole.create({
    data: {
      userId: viewer.id,
      role: 'VIEWER',
    },
  })

  return viewerRole
}

async function getBlockchainValues() {
  return await prisma.blockchain.findMany({})
}

async function createSuperAdmin() {
  const superAdm = await prisma.user.create({
    data: {
      email: await encryptPII(`test-super${AppConfig.app.emailConfig.domain}`),
      emailHash: await hash(`test-super${AppConfig.app.emailConfig.domain}`, salt),
      isActive: true,
      isVerified: true,
      password: password,
    },
  })

  const superAdmRole = await prisma.userRole.create({
    data: {
      userId: superAdm.id,
      role: 'SUPERADMIN',
    },
  })
  await prisma.userRole.create({
    data: {
      userId: superAdm.id,
      role: 'USER',
    },
  })

  return [superAdm, superAdmRole]
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
