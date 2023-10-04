import { SUBMITTED_STATUS, APPROVED_STATUS, REJECTED_BY_APPROVER_STATUS, REQUIRES_CHANGES_STATUS } from 'domain/transferRequest/constants'
import { submittedTransferRequest } from '../submittedTransferRequest'

const mockPrismaTransferRequest = jest.fn()
const mockPrismaTransaction = jest.fn()
const mockPrismaUserRoleProgram = jest.fn()
const mockPrismaTransferRequestReview = jest.fn()
const mockPrismaFindMany = jest.fn()
const mockTransferRequestApprovals = jest.fn()
const mockGetPrismaClient = jest.fn().mockImplementation(() => {
  return {
    transferRequest: mockPrismaTransferRequest(),
    userRoleProgram: mockPrismaUserRoleProgram(),
    transferRequestReview: mockPrismaTransferRequestReview(),
    transferRequestApprovals: mockTransferRequestApprovals(),
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
  submittedTransferRequestValidator: () => mockValidator(),
}))
const mockCreateHistory = jest.fn()
jest.mock('domain/tranferRequestHistory/createRequestChangeHistory', () => ({
  createRequestChangeHistory: (prisma, params) => mockCreateHistory(prisma, params),
}))

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

    const { data, error } = await submittedTransferRequest({})
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

    const { data, error } = await submittedTransferRequest({ transferRequestId: 10, approverId: 1 })
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

    const { data, error } = await submittedTransferRequest({ transferRequestId: 10, approverId: 1 })
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
      update: () => {
        throw { error: 'Transaction failed' }
      },
    }))

    mockPrismaUserRoleProgram.mockImplementation(() => ({
      findMany: () => [{ program: { id: 5 } }, { program: { id: 4 } }],
    }))

    mockPrismaTransaction.mockImplementation(async fn => {
      try {
        await fn(mockGetPrismaClient())
      } catch (error) {
        return { error }
      }
    })

    const { data, error } = await submittedTransferRequest({ transferRequestId: 10, approverId: 1 })
    expect(data).toBeUndefined()
    expect(error).toBeDefined()
  })

  it('should update transfer request status to SUBMITTED only when it was previously APPROVED_STATUS, REJECTED_BY_APPROVER_STATUS or REQUIRES_CHANGES_STATUS', async () => {
    mockValidate.mockImplementation((_, params) => {
      return { fields: params }
    })

    const mockUpdate = jest.fn().mockImplementation(({ where, data }) => {
      return {
        status: data?.status,
        publicId: where?.publicId,
      }
    })

    mockPrismaTransferRequest.mockImplementation(() => ({
      findMany: mockPrismaFindMany.mockImplementation(({ where }) => {
        const items = [
          {
            publicId: 1,
            programId: 4,
            status: APPROVED_STATUS,
            expectedTransferDate: 'expectedDate',
            receiver: { email: 'test@test.com' },
            _count: {
              approvals: 0,
            },
          },
          {
            publicId: 2,
            programId: 4,
            status: REJECTED_BY_APPROVER_STATUS,
            expectedTransferDate: 'expectedDate',
            receiver: { email: 'test@test.com' },
            _count: {
              approvals: 0,
            },
          },
          {
            publicId: 3,
            programId: 4,
            status: REQUIRES_CHANGES_STATUS,
            expectedTransferDate: 'expectedDate',
            receiver: { email: 'test@test.com' },
            _count: {
              approvals: 0,
            },
          },
          {
            publicId: 4,
            programId: 4,
            status: SUBMITTED_STATUS,
            expectedTransferDate: 'expectedDate',
            receiver: { email: 'test@test.com' },
            _count: {
              approvals: 0,
            },
          },
        ]
        return items.filter(item => item.publicId === where.publicId && where.status.in.indexOf(item.status) !== -1)
      }),
      update: params => mockUpdate(params),
    }))

    mockPrismaUserRoleProgram.mockImplementation(() => ({
      findMany: () => [{ program: { id: 5 } }, { program: { id: 4 } }],
    }))

    mockPrismaTransferRequestReview.mockImplementation(() => ({
      findFirst: () => ({}),
    }))

    mockTransferRequestApprovals.mockImplementation(() => ({
      deleteMany: () => ({ count: 1 }),
    }))

    mockPrismaTransaction.mockImplementation(async fn => {
      const data = await fn(mockGetPrismaClient())
      return { data }
    })

    // modify multiple transaction requests
    await submittedTransferRequest({ transferRequestId: 1, approverId: 1 })
    await submittedTransferRequest({ transferRequestId: 2, approverId: 1 })
    await submittedTransferRequest({ transferRequestId: 3, approverId: 1 })
    await submittedTransferRequest({ transferRequestId: 4, approverId: 1 })

    for (let i = 0; i < 4; i++) {
      if (i === 3) {
        // the 4th transfer request is not of the allowed statuses (APPROVED_STATUS, REJECTED_BY_APPROVER_STATUS or REQUIRES_CHANGES_STATUS)
        // we therefore expect nothing to have happened
        expect(mockPrismaFindMany.mock.results[i].value).toHaveLength(0)
        expect(mockUpdate.mock.calls).toHaveLength(3)
      } else {
        // the first three transfer requests are in a valid status and should switch the transfer request to submitted
        const findManyCalls = mockPrismaFindMany.mock.calls[i][0]
        const updateCalls = mockUpdate.mock.calls[i][0]
        expect(findManyCalls.where.status.in.indexOf(APPROVED_STATUS) !== -1).toEqual(true)
        expect(findManyCalls.where.status.in.indexOf(REJECTED_BY_APPROVER_STATUS) !== -1).toEqual(true)
        expect(findManyCalls.where.status.in.indexOf(REQUIRES_CHANGES_STATUS) !== -1).toEqual(true)
        expect(updateCalls.data.status).toEqual(SUBMITTED_STATUS)
        expect(updateCalls.where.publicId).toEqual(i + 1)
      }
    }
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
          status: APPROVED_STATUS,
          expectedTransferDate: 'expectedDate',
          receiver: { email: 'test@test.com' },
          _count: {
            approvals: 0,
          },
        },
      ],
      update: () => [],
    }))
    mockPrismaUserRoleProgram.mockImplementation(() => ({
      findMany: () => [{ program: { id: 5 } }, { program: { id: 4 } }],
    }))

    mockTransferRequestApprovals.mockImplementation(() => ({
      deleteMany: () => ({ count: 1 }),
    }))

    const transactionPrisma = mockGetPrismaClient()
    mockPrismaTransaction.mockImplementation(async fn => {
      const data = await fn(transactionPrisma)
      return { data }
    })

    const { data, error } = await submittedTransferRequest({ transferRequestId: 10, approverId: 1 })
    expect(data).toBeDefined()
    expect(error).toBeUndefined()
    expect(mockCreateHistory).toBeCalledWith(transactionPrisma, {
      newValue: {
        id: 10,
        programId: 4,
        status: SUBMITTED_STATUS,
        expectedTransferDate: 'expectedDate',
        receiver: { email: 'test@test.com' },
        _count: {
          approvals: 0,
        },
      },
      oldValue: {
        id: 10,
        programId: 4,
        status: APPROVED_STATUS,
        expectedTransferDate: 'expectedDate',
        receiver: { email: 'test@test.com' },
        _count: {
          approvals: 0,
        },
      },
      transferRequestId: 10,
      userRoleId: 1,
    })
  })
})
