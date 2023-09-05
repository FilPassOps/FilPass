import {
  CurrencyUnit,
  Program,
  ProgramCurrency,
  Transfer,
  TransferRequest,
  TransferRequestDraft,
  TransferRequestReview,
  User,
  UserRole,
  UserWallet,
} from '@prisma/client'
import { hash } from 'bcrypt'
import { EMAIL_DOMAIN } from 'system.config'
import { encrypt, encryptPII } from 'lib/emissaryCrypto'
import prisma from 'lib/prisma'

const salt = '$2b$10$.J0sdgSE.in0MgyMhnS/q.'
const teamSalt = '$2b$10$Qhy1ImEvtwATUFGdoA7g9u'

const defaultTerms = {
  tax: true,
  release: true,
  soleControl: true,
  walletAddress: true,
  informedDecision: true,
  transferAuthorization: true,
  satisfactionOfObligations: true,
}
interface ProgramWithCurrency extends Program {
  programCurrency: ProgramCurrency[]
}

type CreateTransferRequestProps = Partial<
  Pick<TransferRequest, 'status' | 'team' | 'amount' | 'isActive' | 'vestingMonths' | 'vestingStartEpoch' | 'createdAt'>
> &
  Pick<TransferRequest, 'receiverId' | 'requesterId' | 'userWalletId'> & {
    program: ProgramWithCurrency
    review?: Pick<TransferRequestReview, 'status' | 'approverId' | 'notes'>
    payment?: Transfer
  }

export async function createTransferRequest({
  status = 'SUBMITTED',
  receiverId,
  requesterId,
  program,
  userWalletId,
  team = 'The Test Team',
  amount = '1000',
  review,
  payment,
  isActive = true,
  createdAt,
}: CreateTransferRequestProps) {
  const request = await prisma.transferRequest.create({
    data: {
      status,
      isActive,
      createdAt,
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
      team: await encryptPII(team),
      teamHash: await hash(team, teamSalt),
      amount: await encrypt(amount),
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
    const { controllerId, status, notes = '', transferRef = '', txHash = '' } = payment
    await prisma.transfer.create({
      data: {
        notes,
        status,
        controllerId,
        transferRequestId: request.id,
        transferRef,
        txHash,
        amount: await encrypt(amount),
        amountCurrencyUnitId: paymentCurrencyUnitId,
      },
    })
  }
  await prisma.$disconnect()

  return request
}

export async function createMultisigTransferRequest({
  status = 'SUBMITTED',
  receiverId,
  requesterId,
  program,
  userWalletId,
  team = 'The Test Team',
  amount = '1000',
  review,
  payment,
  isActive = true,
  vestingMonths,
  vestingStartEpoch,
}: CreateTransferRequestProps) {
  const request = await prisma.transferRequest.create({
    data: {
      status,
      isActive,
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
      team: await encryptPII(team),
      teamHash: await hash(team, teamSalt),
      amount: await encrypt(amount),
      expectedTransferDate: new Date(),
      terms: defaultTerms,
      robustAddress: 'bafy2bzaceamyexftc2r2vrpfvkg3gicktkelm6e6xpizxh2hbp27eutjbbpec',
      actorAddress: 'f012908',
      vestingMonths,
      vestingStartEpoch,
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
        amount: await encrypt(amount),
        amountCurrencyUnitId: paymentCurrencyUnitId,
      },
    })
  }

  await prisma.$disconnect()

  return request
}

type CreateTransferRequestDraftProps = Pick<TransferRequestDraft, 'requesterId' | 'receiverId'> &
  Partial<Pick<TransferRequestDraft, 'team' | 'amount' | 'createdAt'>> & {
    program: ProgramWithCurrency
  }

export async function createTransferRequestDraft({
  requesterId,
  receiverId,
  program,
  team = 'Test Team',
  amount = '1000',
  createdAt,
}: CreateTransferRequestDraftProps) {
  const result = await prisma.transferRequestDraft.create({
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
      team: await encryptPII(team),
      teamHash: await hash(team, teamSalt),
      amount: await encrypt(amount),
      createdAt,
    },
  })
  await prisma.$disconnect()

  return result
}

export interface CreateProgramCurrencyResult extends ProgramCurrency {
  currency: CurrencyUnit
}

export type CreateProgramResult = Program & {
  programCurrency: CreateProgramCurrencyResult[]
}

export async function createLinearVestingProgram(
  name: string | undefined = 'LINEAR VESTING USD TO FIL PROGRAM'
): Promise<CreateProgramResult> {
  const result = await prisma.program.create({
    data: {
      deliveryMethod: 'LINEAR_VESTING',
      name,
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
      programCurrency: {
        include: {
          currency: true,
        },
      },
    },
  })
  await prisma.$disconnect()

  return result
}

export async function createOneTimeProgram(name: string | undefined = 'FIL ONE TIME PROGRAM'): Promise<CreateProgramResult> {
  const result = await prisma.program.create({
    data: {
      deliveryMethod: 'ONE_TIME',
      name,
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
      programCurrency: {
        include: {
          currency: true,
        },
      },
    },
  })
  prisma.$disconnect()

  return result
}
export interface CreateUserResult {
  user: User
  userRole: UserRole
  wallets: [UserWallet]
}

/**
 *
 * @param email
 * @param fileKey should be an unique number
 * @returns User
 */
export async function createUser(email: string): Promise<CreateUserResult> {
  const user = await prisma.user.create({
    data: {
      email: await encryptPII(email),
      emailHash: await hash(email, salt),
      isActive: true,
      isVerified: true,
      password: '$2b$10$JNEr1LRmoUgPWzbt8ve/a.ZcDIpMQK9II2OCj42kjNdWkG0.yluky',
    },
  })

  const wallets = await Promise.all([
    prisma.userWallet.create({
      data: {
        address: 'f1ifoar2uwirdrmr5hylvhpphdph6z6ppgebummli',
        blockchain: 'FILECOIN',
        userId: user.id,
        isDefault: true,
      },
    }),
  ])


  const userRole = await prisma.userRole.create({
    data: {
      userId: user.id,
      role: 'USER',
    },
  })
  await prisma.$disconnect()

  return { user, userRole, wallets }
}

export async function createController(): Promise<[User, UserRole]> {
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
  await prisma.$disconnect()

  return [controller, controllerRole]
}

export async function createApprover(email: string | undefined = `test-approver${EMAIL_DOMAIN}`): Promise<[User, UserRole]> {
  const approver = await prisma.user.create({
    data: {
      email: await encryptPII(email),
      emailHash: await hash(email, salt),
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
  await prisma.$disconnect()

  return [approver, approverRole]
}

export async function createSuperAdmin(): Promise<[User, UserRole]> {
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
  await prisma.$disconnect()

  return [superAdm, superAdmRole]
}

export const addApproverToProgram = async (programId: number, userRoleId: number) => {
  await prisma.userRoleProgram.create({
    data: {
      programId,
      userRoleId,
    },
  })
  await prisma.$disconnect()
}

export const createTemporaryFile = async (userId: number) => {
  const result = await prisma.temporaryFile.create({
    data: {
      publicId: Date.now().toString(),
      uploaderId: userId,
      filename: 'file.pdf',
      key: Date.now().toString(),
      type: 'ATTACHMENT',
    },
  })
  await prisma.$disconnect()

  return result
}

export const createWallet = async (userId: number, address: string, isDefault = false): Promise<UserWallet> => {
  const result = await prisma.userWallet.create({
    data: {
      userId,
      address,
      isDefault,
      isActive: true,
      blockchain: 'FILECOIN',
    },
  })
  await prisma.$disconnect()

  return result
}

export const clearDatabase = async () => {
  await prisma.transfer.deleteMany()
  await prisma.transferRequestReview.deleteMany()
  await prisma.transferRequestHistory.deleteMany()
  await prisma.transferRequest.deleteMany()
  await prisma.transferRequestDraft.deleteMany()
  await prisma.userRoleProgram.deleteMany()
  await prisma.userFile.deleteMany()
  await prisma.userRole.deleteMany()
  await prisma.userWallet.deleteMany()
  await prisma.user.deleteMany()
  await prisma.programCurrency.deleteMany()
  await prisma.program.deleteMany()
  await prisma.$disconnect()
}
