import { PAID_STATUS, REQUIRES_CHANGES_STATUS, SUBMITTED_STATUS } from '../constants'
import { updateTransferRequestById } from '../updateTransferRequestById'

const mockPrismaQueryRaw = jest.fn()
const mockPrismaTransaction = jest.fn()
const mockPrismaTransferRequest = jest.fn()
const mockPrismaUserFile = jest.fn()
const mockGetPrismaClient = jest.fn().mockImplementation(() => {
  return {
    transferRequest: mockPrismaTransferRequest(),
    userFile: mockPrismaUserFile(),
    $queryRaw: () => mockPrismaQueryRaw(),
  }
})

jest.mock('lib/prisma', () => ({
  getPrismaClient: () => mockGetPrismaClient(),
  newPrismaTransaction: fn => mockPrismaTransaction(fn),
}))

const mockNotification = jest.fn()
jest.mock('domain/notifications/sendSubmittedNotification', () => ({
  sendSubmittedNotification: params => mockNotification(params),
}))

const mockValidator = jest.fn()
jest.mock('domain/transferRequest/validation', () => ({
  updateTransferRequestValidator: () => mockValidator(),
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

const mockIsEditable = jest.fn()
jest.mock('domain/transferRequest/shared', () => ({
  isEditable: transferRequest => mockIsEditable(transferRequest),
}))

const mockCreateHistory = jest.fn()
jest.mock('domain/transferRequestHistory/createRequestChangeHistory', () => ({
  createRequestChangeHistory: (prisma, params) => mockCreateHistory(prisma, params),
}))

beforeEach(() => {
  mockNotification.mockReset()
  mockValidate.mockReset()
  mockPrismaTransferRequest.mockReset()
  mockPrismaTransaction.mockReset()
  mockIsEditable.mockReset()
  mockPrismaQueryRaw.mockReset()
})

describe('updateTransferRequestById', () => {
  it('should return error when validation fails', async () => {
    mockValidate.mockImplementation((_, params) => {
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

    const { data, error } = await updateTransferRequestById({})
    expect(data).toBeUndefined()
    expect(error).toEqual(expectedError)
    expect(mockPrismaTransaction).not.toBeCalled()
  })

  it('should return error when transfer request cannot be found', async () => {
    mockValidate.mockImplementation((_, params) => {
      return { fields: params }
    })

    mockPrismaTransferRequest.mockImplementation(() => ({
      findMany: ({ where }) => {
        expect(where.publicId).toEqual(10)
        expect(where.isActive).toEqual(true)
        return []
      },
    }))

    mockPrismaQueryRaw.mockResolvedValue([{ id: 10 }])

    mockPrismaTransaction.mockImplementation(async fn => {
      let err
      try {
        await fn(mockGetPrismaClient())
      } catch (error) {
        err = error
      }

      expect(err.message).toBe('Transfer request not found')
      expect(err.status).toBe(404)
      return { error: {} }
    })

    const { data, error } = await updateTransferRequestById({ transferRequestId: 10 })
    expect(data).toBeUndefined()
    expect(error).toBeDefined()
    expect(mockIsEditable).not.toBeCalled()
  })

  it('should return error when user does not have permissions', async () => {
    mockValidate.mockImplementation((validator, params) => {
      return { fields: params }
    })

    mockPrismaTransferRequest.mockImplementation(() => ({
      findMany: () => [{ id: 10 }],
    }))

    mockPrismaQueryRaw.mockResolvedValue([{ id: undefined }])

    mockPrismaTransaction.mockImplementation(async fn => {
      let err
      try {
        await fn(mockGetPrismaClient())
      } catch (error) {
        err = error
      }

      expect(err.message).toBe('Transfer request not found')
      expect(err.status).toBe(404)
      return { error: {} }
    })

    const { data, error } = await updateTransferRequestById({ transferRequestId: 10 })
    expect(data).toBeUndefined()
    expect(error).toBeDefined()
    expect(mockIsEditable).not.toBeCalled()
  })

  it('should return error when transfer quest cannot be edited', async () => {
    mockValidate.mockImplementation((_, params) => {
      return { fields: params }
    })

    const mockUpdate = jest.fn()

    mockPrismaTransferRequest.mockImplementation(() => ({
      findMany: () => [{ id: 10 }],
      update: () => mockUpdate(),
    }))

    mockIsEditable.mockImplementation(({ id }) => {
      expect(id).toBe(10)
      return false
    })

    mockPrismaQueryRaw.mockResolvedValue([{ id: 10 }])

    mockPrismaTransaction.mockImplementation(async fn => {
      let err
      try {
        await fn(mockGetPrismaClient())
      } catch (error) {
        err = error
      }

      expect(err.message).toBe('Transfer request is not editable')
      expect(err.status).toBe(400)
      return { error: {} }
    })

    const { data, error } = await updateTransferRequestById({ transferRequestId: 10 })
    expect(data).toBeUndefined()
    expect(error).toBeDefined()
    expect(mockUpdate).not.toBeCalled()
  })

  it('should return error when files are not found', async () => {
    mockValidate.mockImplementation((_, params) => {
      return { fields: params }
    })

    const mockUpdate = jest.fn().mockImplementation(({ where, data }) => {
      expect(where.id).toBe(10)
      expect(data.status).toBe(SUBMITTED_STATUS)
      return { id: 10 }
    })

    mockPrismaTransferRequest.mockImplementation(() => ({
      findMany: () => [{ id: 10, status: REQUIRES_CHANGES_STATUS }],
      update: params => mockUpdate(params),
    }))

    mockPrismaUserFile.mockImplementation(() => ({
      findMany: () => [],
    }))

    mockIsEditable.mockImplementation(() => true)
    mockPrismaQueryRaw.mockResolvedValue([{ id: 10 }])

    mockPrismaTransaction.mockImplementation(async fn => {
      let err
      try {
        await fn(mockGetPrismaClient())
      } catch (error) {
        err = error
      }

      expect(err.message).toBe('Error updating transfer request')
      expect(err.status).toBe(500)
      return { error: {} }
    })

    const { data, error } = await updateTransferRequestById({ transferRequestId: 10 })
    expect(data).toBeUndefined()
    expect(error).toBeDefined()
    expect(mockUpdate).not.toBeCalled()
  })

  it('should call update replacing request changes status', async () => {
    mockValidate.mockImplementation((_, params) => {
      return { fields: params }
    })

    const mockUpdate = jest.fn().mockImplementation(({ where, data }) => {
      expect(where.id).toBe(10)
      expect(data.status).toBe(SUBMITTED_STATUS)
      return { id: 10 }
    })

    mockPrismaTransferRequest.mockImplementation(() => ({
      findMany: () => [{ id: 10, status: REQUIRES_CHANGES_STATUS }],
      update: params => mockUpdate(params),
    }))

    mockPrismaUserFile.mockImplementation(() => ({
      findMany: () => [{ id: 1, publicId: 'public_id' }],
    }))

    mockIsEditable.mockImplementation(() => true)
    mockPrismaQueryRaw.mockResolvedValue([{ id: 10 }])

    mockPrismaTransaction.mockImplementation(async fn => {
      const data = await fn(mockGetPrismaClient())
      return { data }
    })

    const { data, error } = await updateTransferRequestById({
      transferRequestId: 10,
      amount: 100,
      team: 'test',
    })

    expect(data).toBeDefined()
    expect(error).toBeUndefined()
  })

  it('should call update not replacing current status', async () => {
    mockValidate.mockImplementation((_, params) => {
      return { fields: params }
    })

    const mockUpdate = jest.fn().mockImplementation(({ where, data }) => {
      expect(where.id).toBe(10)
      expect(data.status).toBe(PAID_STATUS)
      return { id: 10 }
    })

    mockPrismaTransferRequest.mockImplementation(() => ({
      findMany: () => [{ id: 10, status: PAID_STATUS }],
      update: params => mockUpdate(params),
    }))

    mockPrismaUserFile.mockImplementation(() => ({
      findMany: () => [{ id: 1, publicId: 'public_id' }],
    }))

    mockIsEditable.mockImplementation(() => true)
    mockPrismaQueryRaw.mockResolvedValue([{ id: 10 }])

    mockPrismaTransaction.mockImplementation(async fn => {
      const data = await fn(mockGetPrismaClient())
      return { data }
    })

    const { data, error } = await updateTransferRequestById({
      transferRequestId: 10,
    })

    expect(data).toBeDefined()
    expect(error).toBeUndefined()
  })

  it('should call history without encrypted values', async () => {
    mockValidate.mockImplementation((_, params) => {
      return { fields: params }
    })

    const mockUpdate = jest.fn().mockImplementation(({ where, data }) => {
      expect(where.id).toBe(10)
      expect(data.status).toBe(SUBMITTED_STATUS)
      expect(data.amount).toBe('encrypted_value')
      expect(data.team).toBe('encrypted_value')
      return {
        id: 10,
        team: 'encrypted_value',
        amount: 'encrypted_value',
        status: SUBMITTED_STATUS,
        userFileId: 1,
        programId: 2,
        userWalletId: 3,
        terms: 'terms',
        expectedTransferDate: 'date',
        createdAt: 'created',
        currencyUnitId: 4,
        publicId: 99,
        wallet: {
          id: 1,
          address: 'wallet_address',
        },
      }
    })

    mockPrismaTransferRequest.mockImplementation(() => ({
      findMany: () => [
        {
          id: 10,
          status: REQUIRES_CHANGES_STATUS,
          requesterId: 9,
          wallet: {
            id: 1,
            address: 'wallet_address',
          },
        },
      ],
      update: params => mockUpdate(params),
    }))

    mockPrismaUserFile.mockImplementation(() => ({
      findMany: () => [{ id: 1, publicId: 'public_id' }],
    }))

    mockIsEditable.mockImplementationOnce(() => true).mockImplementationOnce(() => false)
    mockPrismaQueryRaw.mockResolvedValue([{ id: 20 }])

    const transactionPrisma = mockGetPrismaClient()
    mockPrismaTransaction.mockImplementation(async fn => {
      const data = await fn(transactionPrisma)
      return { data }
    })

    mockEncrypt.mockImplementation(() => 'encrypted_value')

    const { data, error } = await updateTransferRequestById({
      transferRequestId: 10,
      amount: 100,
      team: 'test',
      userFileId: 1,
      programId: 2,
      userWalletId: 3,
      terms: 'terms',
      expectedTransferDate: 'date',
      createdAt: 'created',
      currencyUnitId: 4,
      attachmentId: '',
    })

    const expectedHistoryParam = {
      id: 10,
      team: 'test',
      amount: 100,
      userFileId: 1,
      programId: 2,
      userWalletId: 3,
      expectedTransferDate: 'date',
      currencyUnitId: 4,
      requesterId: 9,
      status: SUBMITTED_STATUS,
      attachmentId: '',
      wallet: {
        id: 1,
        address: 'wallet_address',
      },
    }

    const expectedReturn = {
      ...expectedHistoryParam,
      isEditable: false,
    }

    expect(data).toEqual(expectedReturn)
    expect(error).toBeUndefined()
    expect(mockEncrypt).toBeCalledWith(100)
    expect(mockEncrypt).toBeCalledWith('test')
    expect(mockCreateHistory).toBeCalledWith(transactionPrisma, {
      newValue: expectedHistoryParam,
      oldValue: {
        id: 10,
        status: REQUIRES_CHANGES_STATUS,
        requesterId: 9,
        attachmentId: '',
        wallet: {
          id: 1,
          address: 'wallet_address',
        },
      },
      transferRequestId: 10,
      userRoleId: 20,
    })
    expect(mockNotification).toBeCalledWith({ programId: 2, transferRequestId: 99 })
  })

  it('should call log to github when wallet changes', async () => {
    mockValidate.mockImplementation((validator, params) => {
      return { fields: params }
    })

    const mockUpdate = jest.fn().mockImplementation(({ where, data }) => {
      expect(where.id).toBe(10)
      expect(data.status).toBe(SUBMITTED_STATUS)
      expect(data.amount).toBe('encrypted_value')
      expect(data.team).toBe('encrypted_value')
      return {
        id: 10,
        team: 'encrypted_value',
        amount: 'encrypted_value',
        status: SUBMITTED_STATUS,
        userFileId: 1,
        programId: 2,
        userWalletId: 2,
        terms: 'terms',
        expectedTransferDate: 'date',
        createdAt: 'created',
        currencyUnitId: 4,
        publicId: 99,
        wallet: {
          id: 2,
          address: 'new_wallet_address',
        },
      }
    })

    mockPrismaTransferRequest.mockImplementation(() => ({
      findMany: () => [
        {
          id: 10,
          status: REQUIRES_CHANGES_STATUS,
          requesterId: 9,
          userWalletId: 1,
          wallet: {
            id: 1,
            address: 'old_wallet_address',
          },
        },
      ],
      update: params => mockUpdate(params),
    }))

    mockIsEditable.mockImplementationOnce(() => true).mockImplementationOnce(() => false)
    mockPrismaQueryRaw.mockResolvedValue([{ id: 20 }])

    const transactionPrisma = mockGetPrismaClient()
    mockPrismaTransaction.mockImplementation(async fn => {
      const data = await fn(transactionPrisma)
      return { data }
    })

    mockEncrypt.mockImplementation(() => 'encrypted_value')

    const { data, error } = await updateTransferRequestById({
      transferRequestId: 10,
      amount: 100,
      team: 'test',
      userFileId: 1,
      programId: 2,
      userWalletId: 2,
      terms: 'terms',
      expectedTransferDate: 'date',
      createdAt: 'created',
      currencyUnitId: 4,
      attachmentId: '',
      userAttachmentId: 1,
    })

    const expectedHistoryParam = {
      id: 10,
      team: 'test',
      amount: 100,
      userFileId: 1,
      programId: 2,
      userWalletId: 2,
      expectedTransferDate: 'date',
      currencyUnitId: 4,
      requesterId: 9,
      status: SUBMITTED_STATUS,
      attachmentId: 1,
      wallet: {
        id: 1,
        address: 'old_wallet_address',
      },
    }

    const expectedReturn = {
      ...expectedHistoryParam,
      isEditable: false,
    }

    expect(data).toEqual(expectedReturn)
    expect(error).toBeUndefined()
    expect(mockEncrypt).toBeCalledWith(100)
    expect(mockEncrypt).toBeCalledWith('test')
    expect(mockCreateHistory).toBeCalledWith(transactionPrisma, {
      newValue: expectedHistoryParam,
      oldValue: {
        id: 10,
        status: REQUIRES_CHANGES_STATUS,
        requesterId: 9,
        attachmentId: 1,
        userWalletId: 1,
        wallet: {
          id: 1,
          address: 'old_wallet_address',
        },
      },
      transferRequestId: 10,
      userRoleId: 20,
    })
    expect(mockNotification).toBeCalledWith({ programId: 2, transferRequestId: 99 })
  })
})
