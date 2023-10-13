import { Blockchain, ProgramCurrencyType, TransferRequestReviewStatus, TransferRequestStatus, TransferStatus } from '@prisma/client'
import { hash } from 'bcrypt'

import { loadEnvConfig } from '@next/env'
import { PrismaClient } from '@prisma/client'
import { AppConfig } from '../config'
import { encrypt, encryptPII } from '../lib/emissary-crypto'
loadEnvConfig(process.cwd(), true)

const prisma = new PrismaClient()
const salt = process.env.EMAIL_KEY || ''
const teamSalt = process.env.TEAM_KEY || ''
const password = '$2b$10$uRaqhFBl8ox3GFuZc2GE6euiv3AWKLmN8dbfPUmkSZh2P7u8km6wC' // password

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

let blockchainList: Blockchain[] = []

async function main() {
  blockchainList = await getBlockchainValues()
  await Promise.all([createSuperAdmin()])
  const [[approver, approverRole], controllerRole, viewerRole, oneTimePrograms] = await Promise.all([
    createApprover(),
    createController(),
    createViewer(),
    createOneTimeProgramIds(),
  ])

  for (const program of oneTimePrograms) {
    await Promise.all([
      prisma.userRoleProgram.create({
        data: {
          programId: program.id,
          userRoleId: approverRole.id,
        },
      }),
      prisma.userRoleProgram.create({
        data: {
          programId: program.id,
          userRoleId: viewerRole.id,
        },
      }),
    ])
  }

  for await (const team of teamNames) {
    teams[team] = {
      hash: await hash(team, teamSalt),
      pii: await encryptPII(team),
    }
  }

  for (let i = 0; i < 150; i++) {
    const { user, userRole, userWallets } = await createUser(i)

    for (let index = 0; index < oneTimePrograms.length; index++) {
      const walletId = userWallets.find(wallet => wallet.blockchainId === oneTimePrograms[index].blockchainId)?.id

      if (!walletId) throw new Error(`Wallet not found for user ${user.id}`)

      await Promise.all([
        createTransferRequest({
          receiverId: user.id,
          requesterId: userRole.userId,
          amount: 0.1,
          program: oneTimePrograms[index],
          team: 'First team',
          userWalletId: walletId,
        }),
        createTransferRequest({
          receiverId: user.id,
          requesterId: user.id,
          amount: 0.2,
          program: oneTimePrograms[index],
          team: 'Second team',
          userWalletId: walletId,
          status: 'VOIDED',
        }),
        createTransferRequest({
          receiverId: user.id,
          requesterId: user.id,
          amount: 0.01,
          program: oneTimePrograms[index],
          team: 'Third team',
          userWalletId: walletId,
          status: 'APPROVED',
          review: {
            approverId: approverRole.id,
            status: 'APPROVED',
          },
        }),
        createTransferRequest({
          receiverId: user.id,
          requesterId: user.id,
          amount: 0.01,
          program: oneTimePrograms[index],
          team: 'Third team',
          userWalletId: walletId,
          status: 'APPROVED',
          review: {
            approverId: approverRole.id,
            status: 'APPROVED',
          },
        }),
        createTransferRequest({
          receiverId: user.id,
          requesterId: user.id,
          amount: 0.01,
          program: oneTimePrograms[index],
          team: 'Third team',
          userWalletId: walletId,
          status: 'APPROVED',
          review: {
            approverId: approverRole.id,
            status: 'APPROVED',
          },
        }),
        createTransferRequest({
          receiverId: user.id,
          requesterId: user.id,
          amount: 0.4,
          program: oneTimePrograms[index],
          team: 'Fourth team',
          userWalletId: walletId,
          status: 'REQUIRES_CHANGES',
          review: {
            approverId: approverRole.id,
            status: 'REQUIRES_CHANGES',
            notes: 'Change team name',
          },
        }),
        createTransferRequest({
          receiverId: user.id,
          requesterId: user.id,
          amount: 0.5,
          program: oneTimePrograms[index],
          team: 'Fifth team',
          userWalletId: walletId,
          status: 'REJECTED_BY_APPROVER',
          review: {
            approverId: approverRole.id,
            status: 'REJECTED',
            notes: 'I do not recognize this program',
          },
        }),
        createTransferRequest({
          receiverId: user.id,
          requesterId: user.id,
          amount: 0.6,
          program: oneTimePrograms[index],
          team: 'Sixth team',
          userWalletId: walletId,
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
        }),
        createTransferRequest({
          receiverId: user.id,
          requesterId: user.id,
          amount: 0.6,
          program: oneTimePrograms[index],
          team: 'Seventh team',
          userWalletId: walletId,
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
        }),
        createTransferRequest({
          receiverId: user.id,
          requesterId: approver.id,
          amount: 0.1,
          program: oneTimePrograms[index],
          team: 'First approver team',
          userWalletId: walletId,
        }),
        createTransferRequestDraft({
          receiverId: user.id,
          requesterId: approver.id,
          amount: 0.1,
          team: 'Draft team',
          program: oneTimePrograms[index],
        }),
      ])
    }
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

async function createOneTimeProgramIds() {
  const programs = []
  for (const chain of AppConfig.network.chains) {
    const blockchainId = blockchainList.find(blockchain => blockchain.name === chain.name)?.id

    if (!blockchainId) throw new Error(`Blockchain ${chain.name} not found`)

    const { id: currencyUnitId } = await prisma.currencyUnit.findFirstOrThrow({
      where: { name: chain.symbol },
    })

    const program = await prisma.program.create({
      data: {
        deliveryMethod: 'ONE_TIME',
        name: `ONE TIME PROGRAM - ${chain.symbol}`,
        visibility: 'EXTERNAL',
        programCurrency: {
          create: [
            {
              currencyUnitId,
              type: 'REQUEST',
            },
            {
              currencyUnitId,
              type: 'PAYMENT',
            },
          ],
        },
        blockchainId,
      },
      include: {
        programCurrency: true,
      },
    })
    programs.push(program)
  }
  return programs
}

async function createUser(index: number) {
  const user = await prisma.user.create({
    data: {
      email: await encryptPII(`user${index}@test.com`),
      emailHash: await hash(`user${index}@test.com`, salt),
      isActive: true,
      isVerified: true,
      password: password,
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

async function createController() {
  const controller = await prisma.user.create({
    data: {
      email: await encryptPII(`test-controller${AppConfig.app.emailConfig.domain}`),
      emailHash: await hash(`test-controller${AppConfig.app.emailConfig.domain}`, salt),
      isActive: true,
      isVerified: true,
      password: password,
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

  return controllerRole
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

async function createApprover() {
  const approver = await prisma.user.create({
    data: {
      email: await encryptPII(`test-approver${AppConfig.app.emailConfig.domain}`),
      emailHash: await hash(`test-approver${AppConfig.app.emailConfig.domain}`, salt),
      isActive: true,
      isVerified: true,
      password: password,
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
