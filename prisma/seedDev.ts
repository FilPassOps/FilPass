import { ProgramCurrencyType, TransferRequestReviewStatus, TransferRequestStatus, TransferStatus } from '@prisma/client'
import { hash } from 'bcrypt'

import { loadEnvConfig } from '@next/env'
import { PrismaClient } from '@prisma/client'
import { encrypt, encryptPII } from '../lib/emissaryCrypto'
loadEnvConfig(process.cwd(), true)

import { EMAIL_DOMAIN } from '../system.config'

const prisma = new PrismaClient()
const salt = process.env.EMAIL_KEY || ''
const teamSalt = process.env.TEAM_KEY || ''

const teamNames = [
  'First team',
  'Second team',
  'Third team',
  'Fourth team',
  'Fifth team',
  'Sixth team',
  'Seventh team',
  'Draft team',
  'First controller team',
  'First approver team',
]

interface Teams {
  [key: string]: {
    hash: string
    pii: string
  }
}

const teams: Teams = {}

const defaultTerms = {
  tax: true,
  release: true,
  soleControl: true,
  walletAddress: true,
  informedDecision: true,
  transferAuthorization: true,
  satisfactionOfObligations: true,
}

async function main() {
  await createSuperAdmin()

  const [approver, approverRole] = await createApprover()
  const [controller, controllerRole] = await createController()
  const viewerRole = await createViewer()

  const linearVestingProgram = await createLinearVestingProgram()
  const oneTimeProgram = await createOneTimeProgram()

  await prisma.userRoleProgram.create({
    data: {
      programId: oneTimeProgram.id,
      userRoleId: approverRole.id,
    },
  })

  await prisma.userRoleProgram.create({
    data: {
      programId: linearVestingProgram.id,
      userRoleId: approverRole.id,
    },
  })

  await prisma.userRoleProgram.create({
    data: {
      programId: oneTimeProgram.id,
      userRoleId: viewerRole.id,
    },
  })

  await prisma.userRoleProgram.create({
    data: {
      programId: linearVestingProgram.id,
      userRoleId: viewerRole.id,
    },
  })

  for await (const team of teamNames) {
    teams[team] = {
      hash: await hash(team, teamSalt),
      pii: await encryptPII(team),
    }
  }

  for (let i = 0; i < 150; i++) {
    const { user, t1Wallet, t3Wallet, userRole } = await createUser(i)
    await createTransferRequest({
      receiverId: user.id,
      requesterId: userRole.userId,
      amount: 0.1,
      program: oneTimeProgram,
      team: 'First team',
      userWalletId: t1Wallet.id,
    })

    await createTransferRequest({
      receiverId: user.id,
      requesterId: user.id,
      amount: 0.2,
      program: oneTimeProgram,
      team: 'Second team',
      userWalletId: t1Wallet.id,
      status: 'VOIDED',
    })

    await createTransferRequest({
      receiverId: user.id,
      requesterId: user.id,
      amount: 0.3,
      program: oneTimeProgram,
      team: 'Third team',
      userWalletId: t1Wallet.id,
      status: 'APPROVED',
      review: {
        approverId: approverRole.id,
        status: 'APPROVED',
      },
    })

    await createTransferRequest({
      receiverId: user.id,
      requesterId: user.id,
      amount: 0.3,
      program: oneTimeProgram,
      team: 'Third team',
      userWalletId: t1Wallet.id,
      status: 'APPROVED',
      review: {
        approverId: approverRole.id,
        status: 'APPROVED',
      },
    })

    await createTransferRequest({
      receiverId: user.id,
      requesterId: user.id,
      amount: 0.32,
      program: oneTimeProgram,
      team: 'Third team',
      userWalletId: t3Wallet.id,
      status: 'APPROVED',
      review: {
        approverId: approverRole.id,
        status: 'APPROVED',
      },
    })

    await createTransferRequest({
      receiverId: user.id,
      requesterId: user.id,
      amount: 0.4,
      program: oneTimeProgram,
      team: 'Fourth team',
      userWalletId: t1Wallet.id,
      status: 'REQUIRES_CHANGES',
      review: {
        approverId: approverRole.id,
        status: 'REQUIRES_CHANGES',
        notes: 'Change team name',
      },
    })

    await createTransferRequest({
      receiverId: user.id,
      requesterId: user.id,
      amount: 0.5,
      program: oneTimeProgram,
      team: 'Fifth team',
      userWalletId: t1Wallet.id,
      status: 'REJECTED_BY_APPROVER',
      review: {
        approverId: approverRole.id,
        status: 'REJECTED',
        notes: 'I do not recognize this program',
      },
    })

    await createTransferRequest({
      receiverId: user.id,
      requesterId: user.id,
      amount: 0.6,
      program: oneTimeProgram,
      team: 'Sixth team',
      userWalletId: t1Wallet.id,
      status: 'REJECTED_BY_CONTROLLER',
      review: {
        approverId: approverRole.id,
        status: 'APPROVED',
      },
      payment: {
        controllerId: controllerRole.id,
        status: 'REJECTED',
        notes: 'Too expensive',
      },
    })

    await createTransferRequest({
      receiverId: user.id,
      requesterId: user.id,
      amount: 0.6,
      program: oneTimeProgram,
      team: 'Seventh team',
      userWalletId: t1Wallet.id,
      status: 'PAID',
      review: {
        approverId: approverRole.id,
        status: 'APPROVED',
      },
      payment: {
        controllerId: controllerRole.id,
        status: 'SUCCESS',
        transferRef: 'TRANSFER_REF',
        txHash: 'bafy2bzaceched74v5i5rvhkkv7czbenicibcyafsfnbedayzeupauer7mdqni',
      },
    })

    await createTransferRequest({
      receiverId: user.id,
      requesterId: approver.id,
      amount: 0.1,
      program: oneTimeProgram,
      team: 'First approver team',
      userWalletId: t1Wallet.id,
    })

    await createTransferRequest({
      receiverId: user.id,
      requesterId: controller.id,
      amount: 0.1,
      program: linearVestingProgram,
      team: 'First controller team',
      userWalletId: t1Wallet.id,
    })

    await createTransferRequestDraft({
      receiverId: user.id,
      requesterId: approver.id,
      amount: 0.1,
      team: 'Draft team',
      program: oneTimeProgram,
    })
  }
}

interface CreateTransferRequestType {
  status?: TransferRequestStatus
  receiverId: number
  requesterId: number
  program: {
    id: number
    programCurrency: {
      type: ProgramCurrencyType
      currencyUnitId: number
    }[]
  }
  userWalletId: number
  team: string
  amount: number
  review?: {
    approverId: number
    status: TransferRequestReviewStatus
    notes?: string
  }
  payment?: {
    controllerId: number
    status: TransferStatus
    notes?: string
    transferRef?: string
    txHash?: string
  }
}

async function createTransferRequest({
  status,
  receiverId,
  requesterId,
  program,
  userWalletId,
  team,
  amount,
  review,
  payment,
}: CreateTransferRequestType) {
  const request = await prisma.transferRequest.create({
    data: {
      status,
      receiver: {
        connect: {
          id: receiverId,
        },
      },
      requester: {
        connect: {
          id: requesterId,
        },
      },
      program: {
        connect: {
          id: program.id,
        },
      },
      wallet: {
        connect: {
          id: userWalletId,
        },
      },
      team: teams[team].pii,
      teamHash: teams[team].hash,
      amount: await encrypt(amount.toString()),
      expectedTransferDate: new Date(),
      terms: defaultTerms,
      currency: {
        connect: {
          id: program.programCurrency.find(curr => curr.type === 'REQUEST')?.currencyUnitId,
        },
      },
    },
  })

  if (review) {
    const { approverId, status, notes } = review
    await prisma.transferRequestReview.create({
      data: {
        status,
        approverId,
        notes,
        transferRequestId: request.id,
      },
    })
  }

  if (payment) {
    const paymentCurrencyUnitId = program.programCurrency.find(curr => curr.type === 'PAYMENT')?.currencyUnitId
    const { controllerId, status, notes, transferRef, txHash } = payment
    await prisma.transfer.create({
      data: {
        notes,
        status,
        controllerId,
        transferRequestId: request.id,
        transferRef,
        txHash,
        amount: await encrypt(amount.toString()),
        amountCurrencyUnitId: paymentCurrencyUnitId,
      },
    })
  }
}

interface CreateTransferRequestDraftType {
  receiverId: number
  requesterId: number
  program: {
    id: number
    programCurrency: {
      type: ProgramCurrencyType
      currencyUnitId: number
    }[]
  }
  team: string
  amount: number
}

async function createTransferRequestDraft({ requesterId, receiverId, program, team, amount }: CreateTransferRequestDraftType) {
  await prisma.transferRequestDraft.create({
    data: {
      receiver: {
        connect: {
          id: receiverId,
        },
      },
      requester: {
        connect: {
          id: requesterId,
        },
      },
      program: {
        connect: {
          id: program.id,
        },
      },
      currency: {
        connect: {
          id: program.programCurrency.find(curr => curr.type === 'REQUEST')?.currencyUnitId,
        },
      },
      team: teams[team].pii,
      teamHash: teams[team].hash,
      amount: await encrypt(amount.toString()),
    },
  })
}

async function createLinearVestingProgram() {
  return prisma.program.create({
    data: {
      deliveryMethod: 'LINEAR_VESTING',
      name: 'LINEAR VESTING USD TO FIL PROGRAM',
      visibility: 'EXTERNAL',
      programCurrency: {
        create: [
          {
            currency: {
              connect: {
                name: 'USD',
              },
            },
            type: 'REQUEST',
          },
          {
            currency: {
              connect: {
                name: 'FIL',
              },
            },
            type: 'PAYMENT',
          },
        ],
      },
    },
    include: {
      programCurrency: true,
    },
  })
}

async function createOneTimeProgram() {
  return prisma.program.create({
    data: {
      deliveryMethod: 'ONE_TIME',
      name: 'FIL ONE TIME PROGRAM',
      visibility: 'EXTERNAL',
      programCurrency: {
        create: [
          {
            currency: {
              connect: {
                name: 'FIL',
              },
            },
            type: 'REQUEST',
          },
          {
            currency: {
              connect: {
                name: 'FIL',
              },
            },
            type: 'PAYMENT',
          },
        ],
      },
    },
    include: {
      programCurrency: true,
    },
  })
}

async function createUser(index: number) {
  const user = await prisma.user.create({
    data: {
      email: await encryptPII(`user${index}@email.com`),
      emailHash: await hash(`user${index}@email.com`, salt),
      isActive: true,
      isVerified: true,
      password: '$2b$10$JNEr1LRmoUgPWzbt8ve/a.ZcDIpMQK9II2OCj42kjNdWkG0.yluky',
    },
  })

  const t1Wallet = await prisma.userWallet.create({
    data: {
      address: 't1d6udrjruc3iqhyhrd2rjnjkhzsa6gd6tb63oi6i',
      blockchain: 'FILECOIN',
      userId: user.id,
      isDefault: true,
    },
  })

  const t3Wallet = await prisma.userWallet.create({
    data: {
      address: 't3vw7ph2pbdvwfmkhjy52pfnjkglspzq45batjybrpgrw7etpii3nc7l2sz6x6uumpc32hnhkf5qc3kj5zimeq',
      blockchain: 'FILECOIN',
      userId: user.id,
      isDefault: false,
    },
  })

  const userRole = await prisma.userRole.create({
    data: {
      userId: user.id,
      role: 'USER',
    },
  })

  return { user, userRole, t1Wallet, t3Wallet }
}

async function createController() {
  const controller = await prisma.user.create({
    data: {
      email: await encryptPII(`test-controller${EMAIL_DOMAIN}`),
      emailHash: await hash(`test-controller${EMAIL_DOMAIN}`, salt),
      isActive: true,
      isVerified: true,
      password: '$2b$10$JNEr1LRmoUgPWzbt8ve/a.ZcDIpMQK9II2OCj42kjNdWkG0.yluky',
    },
  })

  await prisma.userRole.create({
    data: {
      userId: controller.id,
      role: 'USER',
    },
  })

  const controllerRole = await prisma.userRole.create({
    data: {
      userId: controller.id,
      role: 'CONTROLLER',
    },
  })

  return [controller, controllerRole]
}

async function createViewer() {
  const viewer = await prisma.user.create({
    data: {
      email: await encryptPII(`test-viewer${EMAIL_DOMAIN}`),
      emailHash: await hash(`test-viewer${EMAIL_DOMAIN}`, salt),
      isActive: true,
      isVerified: true,
      password: '$2b$10$JNEr1LRmoUgPWzbt8ve/a.ZcDIpMQK9II2OCj42kjNdWkG0.yluky',
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

async function createApprover() {
  const approver = await prisma.user.create({
    data: {
      email: await encryptPII(`test-approver${EMAIL_DOMAIN}`),
      emailHash: await hash(`test-approver${EMAIL_DOMAIN}`, salt),
      isActive: true,
      isVerified: true,
      password: '$2b$10$JNEr1LRmoUgPWzbt8ve/a.ZcDIpMQK9II2OCj42kjNdWkG0.yluky',
    },
  })

  await prisma.userRole.create({
    data: {
      userId: approver.id,
      role: 'USER',
    },
  })

  const approverRole = await prisma.userRole.create({
    data: {
      userId: approver.id,
      role: 'APPROVER',
    },
  })

  return [approver, approverRole]
}

async function createSuperAdmin() {
  const superAdm = await prisma.user.create({
    data: {
      email: await encryptPII(`test-super${EMAIL_DOMAIN}`),
      emailHash: await hash(`test-super${EMAIL_DOMAIN}`, salt),
      isActive: true,
      isVerified: true,
      password: '$2b$10$JNEr1LRmoUgPWzbt8ve/a.ZcDIpMQK9II2OCj42kjNdWkG0.yluky',
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
