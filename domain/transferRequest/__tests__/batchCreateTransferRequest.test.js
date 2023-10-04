import { prismaCreateUser } from '../batchCreateTransferRequest'

jest.mock('luxon')

const mockPrismaTransaction = jest.fn()
const mockPrismaTransferRequest = jest.fn()
const mockPrismaUser = jest.fn()
const mockPrismaUserWallet = jest.fn()
const mockPrismaUserRoleProgram = jest.fn()
const mockGetPrismaClient = jest.fn().mockImplementation(() => {
  return {
    transferRequest: mockPrismaTransferRequest(),
    user: mockPrismaUser(),
    userWallet: mockPrismaUserWallet(),
    userRoleProgram: mockPrismaUserRoleProgram(),
  }
})
jest.mock('lib/prisma', () => ({
  getPrismaClient: () => mockGetPrismaClient(),
  newPrismaTransaction: fn => mockPrismaTransaction(fn),
}))

const mockValidate = jest.fn()
jest.mock('lib/yup', () => ({
  validate: (validator, params) => mockValidate(validator, params),
}))

const mockEncrypt = jest.fn()
jest.mock('lib/emissaryCrypto', () => ({
  encrypt: field => mockEncrypt(field),
  encryptPII: field => mockEncrypt(field),
}))

const mockValidateWallet = jest.fn()
jest.mock('lib/filecoinApi', () => ({
  validateWallet: address => mockValidateWallet(address),
}))

const mockValidator = jest.fn()
jest.mock('domain/transferRequestDraft/validation', () => ({
  createTransferRequestSubmittedFormValidator: () => mockValidator(),
}))

beforeEach(() => {
  mockPrismaTransferRequest.mockReset()
  mockPrismaUser.mockReset()
  mockPrismaUserWallet.mockReset()
  mockPrismaUserRoleProgram.mockReset()
  mockEncrypt.mockReset()
})

describe('batchCreateTransferRequest', () => {
  it('should not create new user, if they are already on the database', async () => {
    mockPrismaUser.mockImplementation(() => ({
      findMany: () => [
        {
          id: 1,
          email: 'email@email.com',
        },
      ],
    }))

    const requests = [{ receiverEmail: 'email@email.com' }]

    const expectedData = [
      {
        id: 1,
        email: 'email@email.com',
      },
    ]

    const { users, error } = await prismaCreateUser(requests)
    expect(error).toBeUndefined()
    expect(users).toEqual(expectedData)
    expect(mockPrismaTransaction).not.toBeCalled()
  })

  it("should create new user, if they aren't already on the database", async () => {
    const mockCreate = jest.fn().mockResolvedValue({ id: 1, email: 'Encrypted email' })
    mockPrismaUser.mockImplementation(() => ({
      findMany: () => [],
      create: params => mockCreate(params),
    }))

    mockEncrypt.mockImplementation(() => 'Encrypted value')

    mockPrismaTransaction.mockImplementation(async fn => {
      const data = await fn(mockGetPrismaClient())
      return { data }
    })

    const requests = [{ receiverEmail: 'email@email.com' }]

    const expectedData = [
      {
        id: 1,
        email: 'email@email.com',
      },
    ]

    const { users, error } = await prismaCreateUser(requests)
    expect(error).toBeUndefined()
    expect(users).toEqual(expectedData)
    expect(mockCreate).toBeCalledWith({
      data: {
        email: 'Encrypted value',
        emailHash: '$2b$10$.J0sdgSE.in0MgyMhnS/q.6wkBo1QAz5GZDdh6rSCBz/dGP.qbHUW',
        isVerified: true,
        roles: {
          create: [
            {
              role: 'USER',
            },
          ],
        },
      },
    })
  })

  it('should return error, if user transaction fails', async () => {
    mockPrismaUser.mockImplementation(() => ({
      findMany: () => [],
      create: () => {
        throw 'An error'
      },
    }))

    mockEncrypt.mockImplementationOnce(params => {
      expect(params).toEqual('email@email.com')
      return 'Encrypted email'
    })

    mockPrismaTransaction.mockImplementation(async fn => {
      try {
        await fn(mockGetPrismaClient)
      } catch (err) {
        return { error: err }
      }
    })

    const requests = [{ receiverEmail: 'email@email.com' }]

    const { users, error } = await prismaCreateUser(requests)
    expect(error).toBeDefined()
    expect(users).toEqual([])
  })
})
