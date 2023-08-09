import { APPROVED_STATUS, REJECTED_BY_CONTROLLER_STATUS } from 'domain/transferRequest/constants'
import { rejectTransferRequest } from '../rejectTransferRequest'

const mockPrismaTransaction = jest.fn()
const mockPrismaTransfer = jest.fn()
const mockPrismaTransferRequest = jest.fn()

const mockGetPrismaClient = jest.fn().mockImplementation(() => {
  return {
    transfer: mockPrismaTransfer(),
    transferRequest: mockPrismaTransferRequest(),
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
const mockValidator = jest.fn()
jest.mock('domain/transfer/validation', () => ({
  transferRejectValidator: () => mockValidator(),
}))
const mockDecrypt = jest.fn()
jest.mock('lib/emissaryCrypto', () => ({
  decrypt: field => mockDecrypt(field),
  decryptPII: field => mockDecrypt(field),
}))
const mockNotification = jest.fn()
jest.mock('domain/notifications/sendRejectedNotification', () => ({
  sendRejectedNotification: params => mockNotification(params),
}))
const mockCreateHistory = jest.fn()
jest.mock('domain/tranferRequestHistory/createRequestChangeHistory', () => ({
  createRequestChangeHistory: (prisma, params) => mockCreateHistory(prisma, params),
}))

beforeEach(() => {
  mockValidate.mockReset()
  mockPrismaTransfer.mockReset()
  mockPrismaTransferRequest.mockReset()
  mockPrismaTransaction.mockReset()
})

describe('rejectTransferRequest', () => {
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

    const { data, error } = await rejectTransferRequest({})
    expect(data).toBeUndefined()
    expect(error).toEqual(expectedError)
    expect(mockPrismaTransaction).not.toBeCalled()
  })

  it('should transaction throw error when transfer request is not found', async () => {
    mockValidate.mockImplementation((validator, params) => {
      return { fields: params }
    })

    mockPrismaTransferRequest.mockImplementation(() => ({
      findMany: () => [],
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

    const { data, error } = await rejectTransferRequest({
      transferRequestId: [1],
      controllerId: 1,
      notes: 'testing',
    })
    expect(data).toBeUndefined()
    expect(error).toBeDefined()
  })

  it('should update transfer request status to REJECTED_BY_CONTROLLER', async () => {
    mockValidate.mockImplementation((validator, params) => {
      expect(params).toEqual({ transferRequestId: [1], controllerId: 1, notes: 'testing' })
      return { fields: { transferRequestId: [1], controllerId: 1, notes: 'testing' } }
    })

    const mockUpdate = jest.fn().mockImplementation(({ where, data }) => {
      expect(where).toEqual({ id: 1 })
      expect(data).toEqual({ status: REJECTED_BY_CONTROLLER_STATUS })
      return { id: 1, status: REJECTED_BY_CONTROLLER_STATUS }
    })

    mockPrismaTransferRequest.mockImplementation(() => ({
      findMany: () => [{ id: 1, status: APPROVED_STATUS, receiver: { email: 'test@test.com' } }],
      update: params => mockUpdate(params),
    }))

    mockPrismaTransfer.mockImplementation(() => ({
      create: () => ({ id: 1 }),
    }))

    mockNotification.mockImplementation(() => ({ error: undefined }))

    mockPrismaTransaction.mockImplementation(async fn => {
      const data = await fn(mockGetPrismaClient())
      return { data }
    })

    const { error } = await rejectTransferRequest({
      transferRequestId: [1],
      controllerId: 1,
      notes: 'testing',
    })

    expect(error).toBeUndefined()
  })

  it('should throw an error if sending rejected notification fails', async () => {
    mockValidate.mockImplementation((validator, params) => {
      return { fields: params }
    })

    mockPrismaTransferRequest.mockImplementation(() => ({
      findMany: () => [{ id: 1, status: APPROVED_STATUS, receiver: { email: 'test@test.com' } }],
      update: () => ({ id: 1, status: REJECTED_BY_CONTROLLER_STATUS }),
    }))

    mockPrismaTransfer.mockImplementation(() => ({
      create: () => ({ id: 1 }),
    }))

    mockNotification.mockImplementation(() => {
      return { error: { message: 'error test' } }
    })

    mockPrismaTransaction.mockImplementation(async fn => {
      let error
      try {
        await fn(mockGetPrismaClient())
      } catch (err) {
        error = err
      }
      return { error }
    })

    const { error } = await rejectTransferRequest({
      transferRequestId: [1],
      controllerId: 1,
      notes: 'testing',
    })

    expect(error).toBeDefined()
  })
})
