import { PROGRAM_TYPE_EXTERNAL } from 'domain/programs/constants'
import { APPROVED_STATUS, SUBMITTED_STATUS } from 'domain/transferRequest/constants'
import * as yup from 'lib/yup'
import errorsMessages from 'wordings-and-errors/errors-messages'
import { approveTransferRequest, batchApproveTransferRequest } from '../approveTransferRequest'

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

jest.spyOn(yup, 'validate').mockImplementation((validator, params) => mockValidate(validator, params))

const mockValidator = jest.fn()
jest.mock('domain/transferRequestReview/validation', () => ({
  approveTransferRequestValidator: () => mockValidator(),
}))
const mockCreateHistory = jest.fn()
jest.mock('domain/tranferRequestHistory/createRequestChangeHistory', () => ({
  createRequestChangeHistory: (prisma, params) => mockCreateHistory(prisma, params),
}))
const mockApprovedNotification = jest.fn()
jest.mock('domain/notifications/sendApprovedNotification', () => ({
  sendApprovedNotification: params => mockApprovedNotification(params),
}))

beforeEach(() => {
  mockValidate.mockReset()
  mockPrismaTransferRequest.mockReset()
  mockPrismaTransaction.mockReset()
  mockApprovedNotification.mockReset()
})

describe('approveTransferRequest', () => {
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

    const { data, error } = await approveTransferRequest({})
    expect(data).toBeUndefined()
    expect(error).toEqual(expectedError)
    expect(mockPrismaTransaction).not.toBeCalled()
  })

  it('should return error when transfer request is not found', async () => {
    mockValidate.mockImplementation((_, params) => {
      expect(params).toEqual({
        transferRequestId: 10,
        approverId: 1,
      })
      return { fields: { transferRequestId: 10, approverId: 1 } }
    })

    mockPrismaTransferRequest.mockImplementation(() => ({
      findMany: () => [],
    }))

    mockPrismaUserRoleProgram.mockImplementation(() => ({
      findMany: () => [{ program: { id: 5 } }, { program: { id: 4 } }],
    }))

    const { data, error } = await approveTransferRequest({ transferRequestId: 10, approverId: 1 })
    expect(data).toBeUndefined()
    expect(error).toBeDefined()
    expect(mockPrismaTransaction).not.toBeCalled()
  })

  it('should return error when approver does not have access to the program', async () => {
    mockValidate.mockImplementation((_, params) => {
      return { fields: params }
    })

    mockPrismaTransferRequest.mockImplementation(() => ({
      findMany: () => [{ programId: 10 }],
    }))
    mockPrismaUserRoleProgram.mockImplementation(() => ({
      findMany: () => [{ program: { id: 5 } }, { program: { id: 4 } }],
    }))

    const { data, error } = await approveTransferRequest({ transferRequestId: 10, approverId: 1 })
    expect(data).toBeUndefined()
    expect(error).toBeDefined()
    expect(mockPrismaTransaction).not.toBeCalled()
  })

  it('should return error when transaction fails', async () => {
    mockValidate.mockImplementation((_, params) => {
      return { fields: params }
    })

    mockPrismaTransferRequest.mockImplementation(() => ({
      findMany: () => [
        {
          programId: 4,
          id: 10,
          status: SUBMITTED_STATUS,
          expectedTransferDate: 'expectedDate',
          receiver: { email: 'test@test.com' },
        },
      ],
      update: () => [],
    }))

    mockPrismaUserRoleProgram.mockImplementation(() => ({
      findMany: () => [
        { program: { id: 5, userRoleProgramGroups: [{ _count: { userRoleProgramGroupMembers: 0 } }] } },
        { program: { id: 4, userRoleProgramGroups: [{ _count: { userRoleProgramGroupMembers: 0 } }] } },
      ],
    }))

    mockPrismaTransferRequestReview.mockImplementation(() => ({
      create: () => {
        throw { message: 'An error', status: 500 }
      },
    }))
    mockApprovedNotification.mockImplementation(() => {})

    mockPrismaTransaction.mockImplementation(async fn => {
      try {
        await fn(mockGetPrismaClient())
      } catch (error) {
        return { error }
      }
    })

    const { data, error } = await approveTransferRequest({ transferRequestId: 10, approverId: 1 })
    expect(data).toBeUndefined()
    expect(error).toBeDefined()
  })

  it('should update transfer request status to APPROVED', async () => {
    mockValidate.mockImplementation((_, params) => {
      return { fields: params }
    })

    const mockUpdate = jest.fn().mockImplementation(({ where, data }) => {
      expect(where.publicId).toBe(10)
      expect(data.status).toBe(APPROVED_STATUS)
      return {
        status: APPROVED_STATUS,
        publicId: 10,
      }
    })

    mockPrismaTransferRequest.mockImplementation(() => ({
      findMany: () => [
        {
          programId: 4,
          expectedTransferDate: 'expectedDate',
          receiver: { email: 'test@test.com' },
        },
      ],
      update: params => mockUpdate(params),
    }))
    mockPrismaUserRoleProgram.mockImplementation(() => ({
      findMany: () => [
        { program: { id: 5, userRoleProgramGroups: [{ _count: { userRoleProgramGroupMembers: 0 } }] } },
        { program: { id: 4, userRoleProgramGroups: [{ _count: { userRoleProgramGroupMembers: 0 } }] } },
      ],
    }))
    mockPrismaTransferRequestReview.mockImplementation(() => ({
      create: () => [],
    }))

    mockApprovedNotification.mockImplementation(({ encryptedEmail, expectedTransferDate, transferRequestId }) => {
      expect(encryptedEmail).toEqual('test@test.com')
      expect(expectedTransferDate).toEqual('expectedDate')
      expect(transferRequestId).toEqual(10)
      return {}
    })

    mockPrismaTransaction.mockImplementation(async fn => {
      const data = await fn(mockGetPrismaClient())
      return { data }
    })

    const { data, error } = await approveTransferRequest({ transferRequestId: 10, approverId: 1 })
    expect(data).toBeDefined()
    expect(error).toBeUndefined()
  })

  it('should create a transfer request review', async () => {
    mockValidate.mockImplementation((_, params) => {
      return { fields: params }
    })

    const mockCreateReview = jest.fn().mockImplementation(({ data }) => {
      expect(data.status).toBe(APPROVED_STATUS)
      expect(data.transferRequestId).toBe(10)
      expect(data.approverId).toBe(1)
      return {
        status: APPROVED_STATUS,
        transferRequestId: 10,
        approverId: 1,
      }
    })

    mockPrismaTransferRequest.mockImplementation(() => ({
      findMany: () => [
        {
          id: 10,
          programId: 4,
          expectedTransferDate: 'expectedDate',
          receiver: { email: 'test@test.com' },
        },
      ],
      update: () => [],
    }))
    mockPrismaUserRoleProgram.mockImplementation(() => ({
      findMany: () => [
        { program: { id: 5, userRoleProgramGroups: [{ _count: { userRoleProgramGroupMembers: 0 } }] } },
        { program: { id: 4, userRoleProgramGroups: [{ _count: { userRoleProgramGroupMembers: 0 } }] } },
      ],
    }))
    mockPrismaTransferRequestReview.mockImplementation(() => ({
      create: params => mockCreateReview(params),
    }))
    mockApprovedNotification.mockImplementation(() => {})

    mockPrismaTransaction.mockImplementation(async fn => {
      const data = await fn(mockGetPrismaClient())
      return { data }
    })

    const { data, error } = await approveTransferRequest({ transferRequestId: 10, approverId: 1 })
    expect(data).toBeDefined()
    expect(error).toBeUndefined()
  })

  it('should create a transfer request history', async () => {
    mockValidate.mockImplementation((_, params) => {
      return { fields: params }
    })

    mockPrismaTransferRequest.mockImplementation(() => ({
      findMany: () => [
        {
          programId: 4,
          id: 10,
          status: SUBMITTED_STATUS,
          expectedTransferDate: 'expectedDate',
          receiver: { email: 'test@test.com' },
        },
      ],
      update: () => [],
    }))
    mockPrismaUserRoleProgram.mockImplementation(() => ({
      findMany: () => [
        { program: { id: 5, userRoleProgramGroups: [{ _count: { userRoleProgramGroupMembers: 0 } }] } },
        { program: { id: 4, userRoleProgramGroups: [{ _count: { userRoleProgramGroupMembers: 0 } }] } },
      ],
    }))
    mockPrismaTransferRequestReview.mockImplementation(() => ({
      create: () => ({
        status: APPROVED_STATUS,
        transferRequestId: 10,
        approverId: 1,
      }),
    }))
    mockApprovedNotification.mockImplementation(() => {})

    const transactionPrisma = mockGetPrismaClient()
    mockPrismaTransaction.mockImplementation(async fn => {
      const data = await fn(transactionPrisma)
      return { data }
    })

    const { data, error } = await approveTransferRequest({ transferRequestId: 10, approverId: 1 })
    expect(data).toBeDefined()
    expect(error).toBeUndefined()
    expect(mockCreateHistory).toBeCalledWith(transactionPrisma, {
      newValue: {
        id: 10,
        programId: 4,
        status: APPROVED_STATUS,
        expectedTransferDate: 'expectedDate',
        receiver: { email: 'test@test.com' },
      },
      oldValue: {
        id: 10,
        programId: 4,
        status: SUBMITTED_STATUS,
        expectedTransferDate: 'expectedDate',
        receiver: { email: 'test@test.com' },
      },
      transferRequestId: 10,
      userRoleId: 1,
    })
  })
})

describe('batchApproveTransferRequest', () => {
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

    const { data, error } = await batchApproveTransferRequest({})
    expect(data).toBeUndefined()
    expect(error).toEqual(expectedError)
    expect(mockGetPrismaClient).not.toBeCalled()
  })

  it('should return error if one of the request are not found', async () => {
    mockValidate.mockImplementation((_, params) => {
      return { fields: params }
    })

    mockPrismaTransferRequest.mockImplementation(() => ({
      findMany: () => [],
    }))

    mockPrismaUserRoleProgram.mockImplementation(() => ({
      findMany: () => [],
    }))

    const sentData = {
      requests: [1, 2, 3],
      approverId: 1,
    }

    const expectedError = {
      status: 404,
      message: errorsMessages.transfer_request_not_found.message,
    }
    const { data, error } = await batchApproveTransferRequest(sentData)
    expect(data).toBeUndefined()
    expect(error).toEqual(expectedError)
    expect(mockPrismaTransaction).not.toBeCalled()
  })

  it('should return error if transaction fails', async () => {
    mockValidate.mockImplementation((_, params) => {
      return { fields: params }
    })

    mockPrismaTransferRequest.mockImplementation(() => ({
      findMany: () => [
        { id: 1, programId: 1 },
        { id: 2, programId: 1 },
        { id: 3, programId: 1 },
      ],
      update: () => ({ count: 1 }),
    }))

    mockPrismaUserRoleProgram.mockImplementation(() => ({
      findMany: () => [{ id: 1, program: { id: 1, userRoleProgramGroups: [{ _count: { userRoleProgramGroupMembers: 0 } }] } }],
    }))

    mockPrismaTransferRequestReview.mockImplementation(() => ({
      create: () => {
        throw 'error'
      },
    }))

    mockPrismaTransaction.mockImplementation(async fn => {
      try {
        await fn(mockGetPrismaClient())
      } catch (error) {
        return { error }
      }
    })

    const sentData = {
      requests: [1, 2, 3],
      approverId: 1,
    }

    const expectedError = {
      status: 400,
      message: errorsMessages.error_approving_transfer_request.message,
    }
    const { error, data } = await batchApproveTransferRequest(sentData)
    expect(data).toBeUndefined()
    expect(error).toEqual(expectedError)
  })

  it('should approve transfer requests', async () => {
    mockValidate.mockImplementation((_, params) => {
      return { fields: params }
    })

    mockPrismaTransferRequest.mockImplementation(() => ({
      findMany: () => [
        {
          id: 1,
          programId: 1,
          status: SUBMITTED_STATUS,
          receiver: {
            email: 'email@email.com',
          },
          expectedTransferDate: '01/01/2020',
        },
      ],
      update: () => ({ count: 1 }),
    }))

    mockPrismaUserRoleProgram.mockImplementation(() => ({
      findMany: () => [
        {
          id: 1,
          program: { id: 1, visibility: PROGRAM_TYPE_EXTERNAL, userRoleProgramGroups: [{ _count: { userRoleProgramGroupMembers: 0 } }] },
        },
      ],
    }))

    mockPrismaTransferRequestReview.mockImplementation(() => ({
      create: ({ data }) => {
        expect(data).toEqual({
          approverId: 1,
          transferRequestId: 1,
          status: APPROVED_STATUS,
        })
        return
      },
    }))

    mockCreateHistory.mockImplementation((_, params) => {
      expect(params).toEqual({
        newValue: {
          id: 1,
          programId: 1,
          status: APPROVED_STATUS,
          expectedTransferDate: '01/01/2020',
          receiver: {
            email: 'email@email.com',
          },
        },
        oldValue: {
          id: 1,
          programId: 1,
          status: SUBMITTED_STATUS,
          receiver: {
            email: 'email@email.com',
          },
          expectedTransferDate: '01/01/2020',
        },
        transferRequestId: 1,
        userRoleId: 1,
      })

      return params.newValue
    })

    mockPrismaTransaction.mockImplementation(async fn => {
      try {
        return { data: await fn(mockGetPrismaClient()) }
      } catch (error) {
        console.log(error)
        return { error }
      }
    })

    const sentData = {
      requests: [1],
      approverId: 1,
    }

    const expectedData = [
      {
        id: 1,
        expectedTransferDate: '01/01/2020',
        programId: 1,
        receiver: {
          email: 'email@email.com',
        },
        status: APPROVED_STATUS,
      },
    ]

    const { data, error } = await batchApproveTransferRequest(sentData)
    expect(data).toEqual(expectedData)
    expect(error).toBeUndefined()
  })
})
