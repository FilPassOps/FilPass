import { REJECTED_BY_APPROVER_STATUS, SUBMITTED_STATUS } from 'domain/transferRequest/constants'
import { REJECTED } from '../constants'
import { rejectTransferRequest } from '../rejectTransferRequest'

const mockPrismaTransferRequest = jest.fn()
const mockPrismaTransaction = jest.fn()
const mockPrismaUserRoleProgram = jest.fn()
const mockPrismaTransferRequestReview = jest.fn()
const mockGetPrismaClient = jest.fn().mockImplementation(() => {
  return {
    transferRequest: mockPrismaTransferRequest(),
    userRoleProgram: mockPrismaUserRoleProgram(),
    transferRequestReview: mockPrismaTransferRequestReview(),
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
jest.mock('domain/transferRequestReview/validation', () => ({
  rejectTransferRequestValidator: () => mockValidator(),
}))
const mockCreateHistory = jest.fn()
jest.mock('domain/tranferRequestHistory/createRequestChangeHistory', () => ({
  createRequestChangeHistory: (prisma, params) => mockCreateHistory(prisma, params),
}))
const mockNotification = jest.fn()
jest.mock('domain/notifications/sendRejectedNotification', () => ({
  sendRejectedNotification: params => mockNotification(params),
}))
const mockDecrypt = jest.fn()
jest.mock('lib/emissaryCrypto', () => ({
  decrypt: field => mockDecrypt(field),
  decryptPII: field => mockDecrypt(field),
}))

beforeEach(() => {
  mockNotification.mockReset()
  mockValidate.mockReset()
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

  it('transaction should throw error when transfer request is not found', async () => {
    mockValidate.mockImplementation((validator, params) => {
      expect(params).toEqual({ transferRequestId: 10, approverId: 1, notes: 'testing' })
      return { fields: { transferRequestId: 10, approverId: 1, notes: 'testing' } }
    })

    mockPrismaTransferRequest.mockImplementation(() => ({
      findMany: () => [],
    }))
    mockPrismaUserRoleProgram.mockImplementation(() => ({
      findMany: () => [
        { programId: 5, program: { id: 5 } },
        { programId: 4, program: { id: 4 } },
      ],
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
      transferRequestId: 10,
      approverId: 1,
      notes: 'testing',
    })
    expect(data).toBeUndefined()
    expect(error).toBeDefined()
  })

  it('transaction should throw error when approver does not have access to the program', async () => {
    mockValidate.mockImplementation((validator, params) => {
      return { fields: params }
    })

    mockPrismaTransferRequest.mockImplementation(() => ({
      findMany: () => [{ programId: 10 }],
    }))
    mockPrismaUserRoleProgram.mockImplementation(() => ({
      findMany: () => [{ program: { id: 5 } }, { program: { id: 4 } }],
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
      transferRequestId: 10,
      approverId: 1,
      notes: 'testing',
    })
    expect(data).toBeUndefined()
    expect(error).toBeDefined()
  })

  it('should update transfer request status to REJECTED_BY_APPROVER', async () => {
    mockValidate.mockImplementation((validator, params) => {
      return { fields: params }
    })

    const mockUpdate = jest.fn().mockImplementation(({ where, data }) => {
      expect(where.id).toBe(10)
      expect(data.status).toBe(REJECTED_BY_APPROVER_STATUS)
      return {
        status: REJECTED_BY_APPROVER_STATUS,
        id: 10,
      }
    })

    mockPrismaTransferRequest.mockImplementation(() => ({
      findMany: () => [{ programId: 4, id: 10, status: SUBMITTED_STATUS, receiver: { email: 'test@test.com' } }],
      update: params => mockUpdate(params),
    }))
    mockPrismaUserRoleProgram.mockImplementation(() => ({
      findMany: () => [{ program: { id: 5 } }, { program: { id: 4 } }],
    }))
    mockPrismaTransferRequestReview.mockImplementation(() => ({
      create: () => [],
    }))
    mockNotification.mockImplementation(() => ({}))

    mockPrismaTransaction.mockImplementation(async fn => {
      const data = await fn(mockGetPrismaClient())
      return { data }
    })

    const { data, error } = await rejectTransferRequest({
      transferRequestId: 10,
      approverId: 1,
      notes: 'testing',
    })
    expect(data).toBeDefined()
    expect(error).toBeUndefined()
  })

  it('should create a tranfer request review', async () => {
    mockValidate.mockImplementation((validator, params) => {
      return { fields: params }
    })

    const mockCreateReview = jest.fn().mockImplementation(({ data }) => {
      expect(data.status).toBe(REJECTED)
      expect(data.transferRequestId).toBe(10)
      expect(data.approverId).toBe(1)
      expect(data.notes).toBe('testing')
      return {
        status: REJECTED,
        transferRequestId: 10,
        approverId: 1,
        notes: 'testing',
      }
    })

    mockPrismaTransferRequest.mockImplementation(() => ({
      findMany: () => [{ programId: 4, id: 10, status: SUBMITTED_STATUS, receiver: { email: 'test@test.com' } }],
      update: () => [
        {
          status: REJECTED_BY_APPROVER_STATUS,
          id: 10,
        },
      ],
    }))
    mockPrismaUserRoleProgram.mockImplementation(() => ({
      findMany: () => [{ program: { id: 5 } }, { program: { id: 4 } }],
    }))
    mockPrismaTransferRequestReview.mockImplementation(() => ({
      create: params => mockCreateReview(params),
    }))
    mockNotification.mockImplementation(() => ({}))

    mockPrismaTransaction.mockImplementation(async fn => {
      const data = await fn(mockGetPrismaClient())
      return { data }
    })

    const { data, error } = await rejectTransferRequest({
      transferRequestId: 10,
      approverId: 1,
      notes: 'testing',
    })
    expect(data).toBeDefined()
    expect(error).toBeUndefined()
  })

  it('should create a tranfer request history', async () => {
    mockValidate.mockImplementation((validator, params) => {
      return { fields: params }
    })

    mockPrismaTransferRequest.mockImplementation(() => ({
      findMany: () => [{ programId: 4, id: 10, status: SUBMITTED_STATUS, receiver: { email: 'test@test.com' } }],
      update: () => [
        {
          status: REJECTED_BY_APPROVER_STATUS,
          id: 10,
        },
      ],
    }))
    mockPrismaUserRoleProgram.mockImplementation(() => ({
      findMany: () => [{ program: { id: 5 } }, { program: { id: 4 } }],
    }))
    mockPrismaTransferRequestReview.mockImplementation(() => ({
      create: () => ({
        status: REJECTED_BY_APPROVER_STATUS,
        transferRequestId: 10,
        approverId: 1,
      }),
    }))
    mockNotification.mockImplementation(() => ({}))

    const transactionPrisma = mockGetPrismaClient()
    mockPrismaTransaction.mockImplementation(async fn => {
      const data = await fn(transactionPrisma)
      return { data }
    })

    const { data, error } = await rejectTransferRequest({ transferRequestId: 10, approverId: 1 })
    expect(data).toBeDefined()
    expect(error).toBeUndefined()
    expect(mockCreateHistory).toBeCalledWith(transactionPrisma, {
      newValue: { id: 10, programId: 4, status: REJECTED_BY_APPROVER_STATUS },
      oldValue: { id: 10, programId: 4, status: SUBMITTED_STATUS },
      transferRequestId: 10,
      userRoleId: 1,
    })
  })

  it('should throw an error if is not possible to send rejected notification', async () => {
    mockValidate.mockImplementation((validator, params) => {
      return { fields: params }
    })

    mockPrismaTransferRequest.mockImplementation(() => ({
      findMany: () => [{ programId: 4, id: 10, status: SUBMITTED_STATUS, receiver: { email: 'test@test.com' } }],
      update: () => [
        {
          status: REJECTED_BY_APPROVER_STATUS,
          id: 10,
        },
      ],
    }))
    mockPrismaUserRoleProgram.mockImplementation(() => ({
      findMany: () => [{ program: { id: 5 } }, { program: { id: 4 } }],
    }))
    mockPrismaTransferRequestReview.mockImplementation(() => ({
      create: () => ({
        status: REJECTED_BY_APPROVER_STATUS,
        transferRequestId: 10,
        approverId: 1,
      }),
    }))
    mockNotification.mockImplementation(() => {
      return { error: 'error' }
    })

    mockPrismaTransaction.mockImplementation(async fn => {
      let error
      try {
        await fn(mockGetPrismaClient())
      } catch (err) {
        error = err
      }
      expect(error.message).toBe('error')

      return { error: {} }
    })

    const { data, error } = await rejectTransferRequest({
      transferRequestId: 10,
      approverId: 1,
      notes: 'test',
    })
    expect(data).toBeUndefined()
    expect(error).toBeDefined()
  })
})
