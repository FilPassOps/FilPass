import { submitDraftTransferRequestById } from '../submitDraftTransferRequestById'

const mockPrismaTransaction = jest.fn()
const mockPrismaTransferRequest = jest.fn()
const mockPrismaTransferRequestDraft = jest.fn()
const mockPrismaUserFile = jest.fn()
const mockGetPrismaClient = jest.fn().mockImplementation(() => {
  return {
    transferRequest: mockPrismaTransferRequest(),
    transferRequestDraft: mockPrismaTransferRequestDraft(),
    userFile: mockPrismaUserFile(),
  }
})
jest.mock('lib/prisma', () => ({
  getPrismaClient: () => mockGetPrismaClient(),
  newPrismaTransaction: fn => mockPrismaTransaction(fn),
}))

const mockSubmittedNotification = jest.fn()
jest.mock('domain/notifications/sendSubmittedNotification', () => ({
  sendSubmittedNotification: params => mockSubmittedNotification(params),
}))

const mockValidator = jest.fn()
jest.mock('domain/transferRequestDraft/validation', () => ({
  submitDraftTransferRequestByIdValidator: () => mockValidator(),
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
  mockPrismaTransferRequestDraft.mockReset()
  mockSubmittedNotification.mockReset()
  mockValidate.mockReset()
  mockPrismaTransferRequest.mockReset()
  mockPrismaTransaction.mockReset()
  mockPrismaUserFile.mockReset()
})

describe('submitDraftTransferRequestById', () => {
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

    const { data, error } = await submitDraftTransferRequestById({})
    expect(data).toBeUndefined()
    expect(error).toEqual(expectedError)
    expect(mockPrismaTransaction).not.toBeCalled()
  })

  it('should throw an error when trying to create a new transfer request', async () => {
    mockValidate.mockImplementation((validator, params) => {
      expect(params).toEqual({
        userId: 1,
        publicId: 123,
        userFileId: 1,
        amount: 123,
        programId: 1,
        userWalletId: 1,
        team: 'team',
        terms: {},
        expectedTransferDate: '2020-01-01',
        currencyUnitId: 1,
        applyerId: 2,
      })
      return { fields: params }
    })

    mockPrismaUserFile.mockImplementation(() => ({
      findMany: () => [{ id: 1 }],
    }))

    mockPrismaTransferRequest.mockImplementation(() => ({
      create: () => null,
    }))

    mockPrismaTransaction.mockImplementation(async fn => {
      let error
      try {
        await fn(mockGetPrismaClient())
      } catch (err) {
        error = err
      }
      expect(error.message).toBe('Transfer request not found')
      expect(error.status).toBe(404)

      return { error: {} }
    })

    const { data, error } = await submitDraftTransferRequestById({
      userId: 1,
      publicId: 123,
      userFileId: 1,
      amount: 123,
      programId: 1,
      userWalletId: 1,
      team: 'team',
      terms: {},
      expectedTransferDate: '2020-01-01',
      currencyUnitId: 1,
      applyerId: 2,
    })
    expect(data).toBeUndefined()
    expect(error).toBeDefined()
    expect(mockPrismaTransaction).toBeCalled()
  })

  it('should throw an error when trying to update a draft transfer request', async () => {
    mockValidate.mockImplementation((validator, params) => {
      expect(params).toEqual({
        userId: 1,
        publicId: 123,
        userFileId: 1,
        amount: 123,
        programId: 1,
        userWalletId: 1,
        team: 'team',
        terms: {},
        expectedTransferDate: '2020-01-01',
        currencyUnitId: 1,
        applyerId: 2,
      })
      return { fields: params }
    })

    mockPrismaUserFile.mockImplementation(() => ({
      findMany: () => [{ id: 1 }],
    }))

    mockPrismaTransferRequest.mockImplementation(() => ({
      create: () => ({ id: 1 }),
    }))

    mockPrismaTransferRequestDraft.mockImplementation(() => ({
      updateMany: () => ({ count: 0 }),
    }))

    mockPrismaTransaction.mockImplementation(async fn => {
      let error
      try {
        await fn(mockGetPrismaClient())
      } catch (err) {
        error = err
      }
      expect(error.message).toBe('Draft Transfer request not found')
      expect(error.status).toBe(404)

      return { error: {} }
    })

    const { data, error } = await submitDraftTransferRequestById({
      userId: 1,
      publicId: 123,
      userFileId: 1,
      amount: 123,
      programId: 1,
      userWalletId: 1,
      team: 'team',
      terms: {},
      expectedTransferDate: '2020-01-01',
      currencyUnitId: 1,
      applyerId: 2,
    })
    expect(data).toBeUndefined()
    expect(error).toBeDefined()
    expect(mockPrismaTransaction).toBeCalled()
  })

  it('should return the created transfer request', async () => {
    mockValidate.mockImplementation((validator, params) => {
      expect(params).toEqual({
        userId: 1,
        publicId: 123,
        userFileId: 1,
        amount: 123,
        programId: 1,
        userWalletId: 1,
        team: 'team',
        terms: {},
        expectedTransferDate: '2020-01-01',
        currencyUnitId: 1,
        applyerId: 2,
      })
      return { fields: params }
    })

    mockPrismaUserFile.mockImplementation(() => ({
      findMany: () => [{ id: 1 }],
    }))

    mockPrismaTransferRequest.mockImplementation(() => ({
      create: () => ({
        id: 1,
        wallet: {
          id: 1,
          address: 'wallet_address',
        },
      }),
    }))

    mockPrismaTransferRequestDraft.mockImplementation(() => ({
      updateMany: () => ({ count: 1 }),
    }))

    mockPrismaTransaction.mockImplementation(async fn => {
      const data = await fn(mockGetPrismaClient())

      return { data }
    })

    const { data, error } = await submitDraftTransferRequestById({
      userId: 1,
      publicId: 123,
      userFileId: 1,
      amount: 123,
      programId: 1,
      userWalletId: 1,
      team: 'team',
      terms: {},
      expectedTransferDate: '2020-01-01',
      currencyUnitId: 1,
      applyerId: 2,
    })
    expect(data).toBeDefined()
    expect(error).toBeUndefined()
    expect(mockPrismaTransaction).toBeCalled()
  })
})
