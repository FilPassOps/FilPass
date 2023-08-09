import { deleteDraftTransferRequestById } from '../deleteDraftTransferRequestById'

const mockTransferRequestDraft = jest.fn()
const mockGetPrismaClient = jest.fn().mockImplementation(() => {
  return {
    transferRequestDraft: mockTransferRequestDraft(),
  }
})
jest.mock('lib/prisma', () => ({
  getPrismaClient: () => mockGetPrismaClient(),
}))
const mockValidate = jest.fn()
jest.mock('lib/yup', () => ({
  validate: (validator, params) => mockValidate(validator, params),
}))
const mockValidator = jest.fn()
jest.mock('domain/transferRequestDraft/validation', () => ({
  deleteDraftTransferRequestByIdValidator: () => mockValidator(),
}))

beforeEach(() => {
  mockValidate.mockReset()
  mockTransferRequestDraft.mockReset()
})

describe('deleteDraftTransferRequestById', () => {
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

    const { data, error } = await deleteDraftTransferRequestById({})
    expect(data).toBeUndefined()
    expect(error).toEqual(expectedError)
    expect(mockTransferRequestDraft).not.toBeCalled()
  })

  it('should be able to delete a draft transfer request', async () => {
    mockValidate.mockImplementation((validator, params) => {
      expect(params).toEqual({ publicId: 5192123, userId: 1 })
      return { fields: params }
    })

    const mockUpdateMany = jest.fn().mockImplementation(({ where }) => {
      expect(where).toEqual({
        publicId: 5192123,
        OR: [
          {
            receiverId: 1,
          },
          {
            requesterId: 1,
          },
        ],
      })
      return { count: 1 }
    })
    mockTransferRequestDraft.mockImplementation(() => ({
      updateMany: (params) => mockUpdateMany(params),
    }))

    const { data, error } = await deleteDraftTransferRequestById({ publicId: 5192123, userId: 1 })

    expect(data).toEqual({ count: 1 })
    expect(error).toBeUndefined()
    expect(mockTransferRequestDraft).toBeCalled()
  })

  it('should NOT be able to delete a draft transfer request', async () => {
    mockValidate.mockImplementation((validator, params) => {
      return { fields: params }
    })

    mockTransferRequestDraft.mockImplementation(() => ({
      updateMany: () => ({ count: 0 }),
    }))

    const { data, error } = await deleteDraftTransferRequestById({ publicId: 5192123, userId: 1 })

    expect(data).toBeUndefined()
    expect(error).toBeDefined()
    expect(mockTransferRequestDraft).toBeCalled()
  })
})
