import { ProgramCurrencyType, TransferRequestReviewStatus, TransferRequestStatus, TransferStatus } from '@prisma/client'
import { hash } from 'bcrypt'

import { loadEnvConfig } from '@next/env'
import { PrismaClient } from '@prisma/client'
import { DateTime } from 'luxon'
import { encrypt, encryptPII } from '../lib/emissaryCrypto'
loadEnvConfig(process.cwd(), true)

import { CONFIG, EMAIL_DOMAIN } from '../system.config'

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

const usersInfoData = [
  {
    firstName: 'John',
    lastName: 'Doe',
    country: 'CUB',
    dateOfBirth: DateTime.fromJSDate(new Date(754149600000)).toISO(),
  },
]

interface Teams {
  [key: string]: {
    hash: string
    pii: string
  }
}

interface UserInfo {
  [key: string]: {
    firstName: string
    lastName: string
    country: string
    dateOfBirth: string
  }
}

const teams: Teams = {}
const usersInfo: UserInfo = {}

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
  await Promise.all([createSuperAdmin(), createCompliance(), createFinance()])
  const [[approver, approverRole], [controller, controllerRole], viewerRole, vestingPrograms, oneTimePrograms] = await Promise.all([
    createApprover(),
    createController(),
    createViewer(),
    createLinearVestingPrograms(),
    createOneTimeProgramIds(),
  ])

  for (const program of vestingPrograms) {
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

  for await (const userInfo of usersInfoData) {
    usersInfo[userInfo.firstName] = {
      firstName: await encryptPII(userInfo.firstName),
      lastName: await encryptPII(userInfo.lastName),
      country: await encryptPII(userInfo.country),
      dateOfBirth: userInfo.dateOfBirth ? await encryptPII(userInfo.dateOfBirth) : '',
    }
  }

  for (let i = 0; i < 150; i++) {
    const { user, w9, w8, t1Wallet, t3Wallet, userRole } = await createUser(i)
    for (let index = 0; index < vestingPrograms.length; index++) {
      await Promise.all([
        createTransferRequest({
          receiverId: user.id,
          requesterId: userRole.userId,
          amount: 0.1,
          isUSResident: true,
          userFileId: w9.id,
          program: oneTimePrograms[index],
          team: 'First team',
          userWalletId: t1Wallet.id,
        }),
        createTransferRequest({
          receiverId: user.id,
          requesterId: user.id,
          amount: 0.2,
          isUSResident: true,
          userFileId: w9.id,
          program: oneTimePrograms[index],
          team: 'Second team',
          userWalletId: t1Wallet.id,
          status: 'VOIDED',
        }),
        createTransferRequest({
          receiverId: user.id,
          requesterId: user.id,
          amount: 0.3,
          isUSResident: true,
          userFileId: w9.id,
          program: oneTimePrograms[index],
          team: 'Third team',
          userWalletId: t1Wallet.id,
          status: 'APPROVED',
          review: {
            approverId: approverRole.id,
            status: 'APPROVED',
          },
        }),
        createTransferRequest({
          receiverId: user.id,
          requesterId: user.id,
          amount: 0.3,
          isUSResident: true,
          userFileId: w9.id,
          program: oneTimePrograms[index],
          team: 'Third team',
          userWalletId: t1Wallet.id,
          status: 'APPROVED',
          review: {
            approverId: approverRole.id,
            status: 'APPROVED',
          },
        }),
        createTransferRequest({
          receiverId: user.id,
          requesterId: user.id,
          amount: 0.32,
          isUSResident: true,
          userFileId: w9.id,
          program: oneTimePrograms[index],
          team: 'Third team',
          userWalletId: t3Wallet.id,
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
          isUSResident: true,
          userFileId: w9.id,
          program: oneTimePrograms[index],
          team: 'Fourth team',
          userWalletId: t1Wallet.id,
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
          isUSResident: true,
          userFileId: w9.id,
          program: oneTimePrograms[index],
          team: 'Fifth team',
          userWalletId: t1Wallet.id,
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
          isUSResident: true,
          userFileId: w9.id,
          program: oneTimePrograms[index],
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
        }),
        createTransferRequest({
          receiverId: user.id,
          requesterId: user.id,
          amount: 0.6,
          isUSResident: true,
          userFileId: w9.id,
          program: oneTimePrograms[index],
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
        }),
        createTransferRequest({
          receiverId: user.id,
          requesterId: approver.id,
          amount: 0.1,
          isUSResident: true,
          userFileId: w9.id,
          program: oneTimePrograms[index],
          team: 'First approver team',
          userWalletId: t1Wallet.id,
        }),
        createTransferRequest({
          receiverId: user.id,
          requesterId: controller.id,
          amount: 0.1,
          isUSResident: true,
          userFileId: w9.id,
          program: vestingPrograms[index],
          team: 'First controller team',
          userWalletId: t1Wallet.id,
        }),
        createTransferRequestDraft({
          receiverId: user.id,
          requesterId: approver.id,
          amount: 0.1,
          team: 'Draft team',
          program: oneTimePrograms[index],
        }),
        createTransferRequest({
          receiverId: user.id,
          requesterId: user.id,
          amount: 0.1,
          isUSResident: false,
          userFileId: w8.id,
          program: oneTimePrograms[index],
          team: 'First team',
          userWalletId: t1Wallet.id,
          status: 'BLOCKED',
          firstName: 'John',
          sanctionReason: 'Country of residence is sanctioned',
          isSanctioned: true,
        }),
        createTransferRequest({
          receiverId: user.id,
          requesterId: user.id,
          amount: 0.1,
          isUSResident: false,
          userFileId: w8.id,
          program: oneTimePrograms[index],
          team: 'Second team',
          userWalletId: t1Wallet.id,
          status: 'BLOCKED',
          firstName: 'John',
          sanctionReason: 'Country of residence is sanctioned',
          isSanctioned: true,
        }),
        createTransferRequest({
          receiverId: user.id,
          requesterId: user.id,
          amount: 0.1,
          isUSResident: false,
          userFileId: w8.id,
          program: oneTimePrograms[index],
          team: 'Third team',
          userWalletId: t1Wallet.id,
          status: 'BLOCKED',
          firstName: 'John',
          sanctionReason: `
        SDNT(Specially Designated Narcotics Traffickers).<br/>
        Entity Number: 1234; Sanctioned Since: 11-9-2005; DOB 24-11-1993; POB Armenia, Quindio, Colombia; POB Roldanillo, Valle, Colombia;
        Cedula No. 123456789 (Colombia); Cedula No. 123456789 (Colombia); Citizenship Colombia; Passport AB12345 (Colombia)`,
          isSanctioned: true,
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
  userFileId: number
  team: string
  amount: number
  isUSResident: boolean
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
  firstName?: string
  isSanctioned?: boolean
  sanctionReason?: string
}

async function createTransferRequest({
  status,
  receiverId,
  requesterId,
  program,
  userWalletId,
  userFileId,
  team,
  amount,
  isUSResident,
  review,
  payment,
  firstName,
  isSanctioned,
  sanctionReason,
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
      form: {
        connect: {
          id: userFileId,
        },
      },
      team: teams[team].pii,
      teamHash: teams[team].hash,
      amount: await encrypt(amount.toString()),
      dateOfBirth: firstName && usersInfo[firstName].dateOfBirth,
      firstName: firstName && usersInfo[firstName].firstName,
      lastName: firstName && usersInfo[firstName].lastName,
      countryResidence: firstName && usersInfo[firstName].country,
      sanctionReason: sanctionReason ? await encryptPII(sanctionReason) : null,
      isUSResident,
      isSanctioned,
      isLegacy: true,
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

async function createLinearVestingPrograms() {
  const programs = []
  for (const chain of CONFIG.chains) {
    const { id: requestCurrencyUnitId } = await prisma.currencyUnit.findFirstOrThrow({
      where: {
        name: CONFIG.fiatPaymentUnit,
      },
    })

    const { id: paymentCurrencyUnitId } = await prisma.currencyUnit.findFirstOrThrow({
      where: { name: chain.symbol },
    })

    const program = await prisma.program.create({
      data: {
        deliveryMethod: 'LINEAR_VESTING',
        name: `LINEAR VESTING USD TO ${chain.symbol} PROGRAM`,
        visibility: 'EXTERNAL',
        programCurrency: {
          create: [
            {
              currencyUnitId: requestCurrencyUnitId,
              type: 'REQUEST',
            },
            {
              currencyUnitId: paymentCurrencyUnitId,
              type: 'PAYMENT',
            },
          ],
        },
      },
      include: {
        programCurrency: true,
      },
    })
    programs.push(program)
  }
  return programs
}

async function createOneTimeProgramIds() {
  const programs = []
  for (const chain of CONFIG.chains) {
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
      userId: user.id,
      blockchainId: 1,
      isDefault: true,
    },
  })

  const t3Wallet = await prisma.userWallet.create({
    data: {
      address: 't3vw7ph2pbdvwfmkhjy52pfnjkglspzq45batjybrpgrw7etpii3nc7l2sz6x6uumpc32hnhkf5qc3kj5zimeq',
      blockchainId: 1,
      userId: user.id,
      isDefault: false,
    },
  })

  const [w8, w9] = await Promise.all([
    prisma.userFile.create({
      data: {
        type: 'W8_FORM',
        userId: user.id,
        isApproved: false,
        isActive: false,
        filename: 'w8-form.pdf',
        key: `w8.pdf`,
      },
    }),
    prisma.userFile.create({
      data: {
        type: 'W9_FORM',
        userId: user.id,
        isApproved: false,
        isActive: false,
        filename: 'w9-form.pdf',
        key: `w9.pdf`,
      },
    }),
  ])

  const userRole = await prisma.userRole.create({
    data: {
      userId: user.id,
      role: 'USER',
    },
  })

  return { user, userRole, w8, w9, t1Wallet, t3Wallet }
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

async function createCompliance() {
  const compliance = await prisma.user.create({
    data: {
      email: await encryptPII(`test-compliance${EMAIL_DOMAIN}`),
      emailHash: await hash(`test-compliance${EMAIL_DOMAIN}`, salt),
      isActive: true,
      isVerified: true,
      password: '$2b$10$JNEr1LRmoUgPWzbt8ve/a.ZcDIpMQK9II2OCj42kjNdWkG0.yluky',
    },
  })

  await prisma.userRole.create({
    data: {
      userId: compliance.id,
      role: 'USER',
    },
  })

  const complianceRole = await prisma.userRole.create({
    data: {
      userId: compliance.id,
      role: 'COMPLIANCE',
    },
  })

  return [compliance, complianceRole]
}

async function createFinance() {
  const finance = await prisma.user.create({
    data: {
      email: await encryptPII(`test-finance${EMAIL_DOMAIN}`),
      emailHash: await hash(`test-finance${EMAIL_DOMAIN}`, salt),
      isActive: true,
      isVerified: true,
      password: '$2b$10$JNEr1LRmoUgPWzbt8ve/a.ZcDIpMQK9II2OCj42kjNdWkG0.yluky',
    },
  })

  await prisma.userRole.create({
    data: {
      userId: finance.id,
      role: 'USER',
    },
  })

  const financeRole = await prisma.userRole.create({
    data: {
      userId: finance.id,
      role: 'FINANCE',
    },
  })

  return [finance, financeRole]
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
