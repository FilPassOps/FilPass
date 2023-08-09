import { createTransferRequest } from '../createTransferRequest'

const mockPrismaTransaction = jest.fn()
const mockPrismaTransferRequest = jest.fn()
const mockPrismaUserFile = jest.fn()
const mockGetPrismaClient = jest.fn().mockImplementation(() => {
  return {
    transferRequest: mockPrismaTransferRequest(),
    userFile: mockPrismaUserFile(),
  }
})
jest.mock('lib/prisma', () => ({
  getPrismaClient: () => mockGetPrismaClient(),
  newPrismaTransaction: fn => mockPrismaTransaction(fn),
}))

const mockSubmittedNotification = jest.fn()
const mockCreatedNotification = jest.fn()
jest.mock('domain/notifications/sendSubmittedNotification', () => ({
  sendSubmittedNotification: params => mockSubmittedNotification(params),
}))
jest.mock('domain/notifications/sendCreatedNotification', () => ({
  sendCreatedNotification: params => mockCreatedNotification(params),
}))

const mockValidator = jest.fn()
jest.mock('domain/transferRequest/validation', () => ({
  createTransferRequestValidator: () => mockValidator(),
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

beforeEach(() => {
  mockCreatedNotification.mockReset()
  mockSubmittedNotification.mockReset()
  mockValidate.mockReset()
  mockPrismaTransferRequest.mockReset()
  mockPrismaTransaction.mockReset()
})

describe('createTransferRequest', () => {
  it('should return error when validation fails', async () => {
    mockValidate.mockImplementation((validator, params) => {
      expect(params).toEqual({})

      return {
        errors: {
          test: 'test',
        },
      }
    })

    const expectedError = {
      status: 400,
      errors: {
        test: 'test',
      },
    }

    const { data, error } = await createTransferRequest({})
    expect(data).toBeUndefined()
    expect(error).toEqual(expectedError)
    expect(mockPrismaTransaction).not.toBeCalled()
  })

  it('should return error when files are not found', async () => {
    mockValidate.mockImplementation((validator, params) => {
      return { fields: params }
    })

    mockPrismaUserFile.mockImplementation(() => ({
      findMany: () => [],
    }))

    mockPrismaTransaction.mockImplementation(fn => fn(mockGetPrismaClient()))

    const requestParams = {
      amount: 1,
      userFileId: 2,
      programId: 3,
      userWalletId: 4,
      team: 'Team',
      isUSResident: true,
      terms: {},
      expectedTransferDate: 'expectedDate',
      currencyUnitId: 7,
      user: {
        id: 8,
        email: 'test@test.com',
      },
    }

    try {
      const response = await createTransferRequest(requestParams)
      expect(response).toBeUndefined()
    } catch (err) {
      expect(err).toBeDefined()
    }
  })

  it('should return created request', async () => {
    mockEncrypt
      .mockImplementationOnce(params => {
        expect(params).toEqual(1)
        return 'Encrypted amount'
      })
      .mockImplementationOnce(params => {
        expect(params).toEqual('Team')
        return 'Encrypted team'
      })

    mockValidate.mockImplementation((validator, params) => {
      return { fields: params }
    })

    mockPrismaUserFile.mockImplementation(() => ({
      findMany: () => [{ id: 1, publicId: 'public_id' }],
    }))

    mockPrismaTransferRequest.mockImplementation(() => ({
      create: ({ data }) => {
        expect(data.amount).toEqual('Encrypted amount')
        expect(data.userFileId).toEqual(1)
        expect(data.programId).toEqual(3)
        expect(data.userWalletId).toEqual(4)
        expect(data.team).toEqual('Encrypted team')
        expect(data.isUSResident).toEqual(true)
        expect(data.terms).toEqual({})
        expect(data.expectedTransferDate).toEqual('expectedDate')
        expect(data.currencyUnitId).toEqual(7)
        expect(data.receiverId).toEqual(8)
        expect(data.requesterId).toEqual(8)
        return {
          publicId: 10,
          userWalletId: 4,
          wallet: {
            id: 1,
            address: 'wallet_address',
          },
        }
      },
    }))

    mockSubmittedNotification.mockImplementation(({ programId, transferRequestId }) => {
      expect(programId).toEqual(3)
      expect(transferRequestId).toEqual(10)
      return {}
    })
    mockCreatedNotification.mockImplementation(({ email, expectedTransferDate, transferRequestId }) => {
      expect(email).toEqual('test@test.com')
      expect(expectedTransferDate).toEqual('expectedDate')
      expect(transferRequestId).toEqual(10)
      return {}
    })

    mockPrismaTransaction.mockImplementation(fn => fn(mockGetPrismaClient()))

    const requestParams = {
      amount: 1,
      userFileId: 2,
      programId: 3,
      userWalletId: 4,
      team: 'Team',
      isUSResident: true,
      terms: {},
      expectedTransferDate: 'expectedDate',
      currencyUnitId: 7,
      user: {
        id: 8,
        email: 'test@test.com',
      },
      userAttachmentId: 1,
    }

    const expectedData = {
      publicId: 10,
      userWalletId: 4,
      wallet: {
        id: 1,
        address: 'wallet_address',
      },
    }

    const response = await createTransferRequest(requestParams)
    expect(response).toEqual(expectedData)
    expect(mockLogChanges).toBeCalledWith({
      requestId: 10,
      oldAddress: '-',
      newAddress: 'wallet_address',
    })
  })

  it('should return created request without user attachment', async () => {
    mockEncrypt
      .mockImplementationOnce(params => {
        expect(params).toEqual(1)
        return 'Encrypted amount'
      })
      .mockImplementationOnce(params => {
        expect(params).toEqual('Team')
        return 'Encrypted team'
      })

    mockValidate.mockImplementation((validator, params) => {
      return { fields: params }
    })

    mockPrismaUserFile.mockImplementation(() => ({
      findMany: () => [{ id: 1, publicId: 'public_id' }],
    }))

    mockPrismaTransferRequest.mockImplementation(() => ({
      create: ({ data }) => {
        expect(data.amount).toEqual('Encrypted amount')
        expect(data.userFileId).toEqual(1)
        expect(data.programId).toEqual(3)
        expect(data.userWalletId).toEqual(4)
        expect(data.team).toEqual('Encrypted team')
        expect(data.isUSResident).toEqual(true)
        expect(data.terms).toEqual({})
        expect(data.expectedTransferDate).toEqual('expectedDate')
        expect(data.currencyUnitId).toEqual(7)
        expect(data.receiverId).toEqual(8)
        expect(data.requesterId).toEqual(8)
        return {
          publicId: 10,
          userWalletId: 4,
          wallet: {
            id: 1,
            address: 'wallet_address',
          },
        }
      },
    }))

    mockSubmittedNotification.mockImplementation(({ programId, transferRequestId }) => {
      expect(programId).toEqual(3)
      expect(transferRequestId).toEqual(10)
      return {}
    })
    mockCreatedNotification.mockImplementation(({ email, expectedTransferDate, transferRequestId }) => {
      expect(email).toEqual('test@test.com')
      expect(expectedTransferDate).toEqual('expectedDate')
      expect(transferRequestId).toEqual(10)
      return {}
    })

    mockPrismaTransaction.mockImplementation(fn => fn(mockGetPrismaClient()))

    const requestParams = {
      amount: 1,
      userFileId: 2,
      programId: 3,
      userWalletId: 4,
      team: 'Team',
      isUSResident: true,
      terms: {},
      expectedTransferDate: 'expectedDate',
      currencyUnitId: 7,
      user: {
        id: 8,
        email: 'test@test.com',
      },
    }

    const expectedData = {
      publicId: 10,
      userWalletId: 4,
      wallet: {
        id: 1,
        address: 'wallet_address',
      },
    }

    const response = await createTransferRequest(requestParams)
    expect(response).toEqual(expectedData)
    expect(mockLogChanges).toBeCalledWith({
      requestId: 10,
      oldAddress: '-',
      newAddress: 'wallet_address',
    })
  })
})
