import { hash } from 'bcrypt'

import { loadEnvConfig } from '@next/env'
import { PrismaClient } from '@prisma/client'
import { AppConfig } from '../config'
import { encryptPII } from '../lib/crypto'
loadEnvConfig(process.cwd(), true)

const prisma = new PrismaClient()
const salt = process.env.EMAIL_KEY || ''
const password = '$2b$10$uRaqhFBl8ox3GFuZc2GE6euiv3AWKLmN8dbfPUmkSZh2P7u8km6wC' // password

async function main() {
  await Promise.all([createSuperAdmin()])

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

  const userRole = await prisma.userRole.create({
    data: {
      userId: user.id,
      role: 'USER',
    },
  })

  return { user, userRole }
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
