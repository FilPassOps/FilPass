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

  it('should return erro, if user transaction fails', async () => {
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

  // it("should create transfer request", async () => {
  //   mockPrismaUserRoleProgram.mockImplementation(() => ({
  //     findMany: () => [{}]
  //   }))

  //   mockEncrypt.mockImplementation(() => 'Encrypted value')

  //   mockPrismaTransferRequest.mockImplementation(() => ({
  //     create: ({ data }) => {
  //       return data
  //     }
  //   }))

  //   mockPrismaTransaction.mockImplementation(async (fn) => {
  //     const data = await fn(mockGetPrismaClient())
  //     return { data }
  //   })

  //   luxon.DateTime.now.mockImplementation(() => ({
  //     plus: () => ({
  //       toISO: () => 'date'
  //     })
  //   }))

  //   const requests = [{
  //     programId: 1,
  //     wallet: { id: 1 },
  //     receiver: { id: 1 },
  //     team: 'team test',
  //     amount: '0.01',
  //     currencyUnitId: 1
  //   }]

  //   const requesterId = 1
  //   const approverRoleId = 1

  //   const { data, error } = await prismaCreateTransferRequest(requests, requesterId, approverRoleId)
  //   expect(data).toBeDefined()
  //   expect(error).toBeUndefined()
  // })

  // it("should return error, if transfer request transaction fails", async () => {
  //   mockPrismaUserRoleProgram.mockImplementation(() => ({
  //     findMany: () => [{}]
  //   }))

  //   mockPrismaTransferRequest.mockImplementation(() => ({
  //     create: () => { throw 'An error'}
  //   }))

  //   mockPrismaTransaction.mockImplementation(async (fn) => {
  //     try {
  //       return await fn(mockGetPrismaClient)
  //     } catch (err) {
  //       return {error: err}
  //     }
  //   })

  //   const requests = [{
  //     programId: 1
  //   }]
  //   const requesterId = 1
  //   const approverRoleId = 1

  //   const { data, error } = await prismaCreateTransferRequest(requests, requesterId, approverRoleId)
  //   expect(data).toBeUndefined()
  //   expect(error).toBeDefined()
  // })
})
