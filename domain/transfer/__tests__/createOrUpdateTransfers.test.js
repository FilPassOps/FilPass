import { createOrUpdateTransfers } from '../createOrUpdateTransfers'

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
  createTransfersValidator: () => mockValidator(),
}))

const mockGenerateIdentifier = jest.fn()
jest.mock('domain/payment/generateIdentifier', () => ({
  generateIdentifier: () => mockGenerateIdentifier(),
}))

const mockDecrypt = jest.fn()
jest.mock('lib/emissaryCrypto', () => ({
  decrypt: params => mockDecrypt(params),
  decryptPII: params => mockDecrypt(params),
}))

beforeEach(() => {
  mockValidate.mockReset()
  mockPrismaTransfer.mockReset()
  mockPrismaTransaction.mockReset()
  mockPrismaTransferRequest.mockReset()
})

describe('createOrUpdateTransfers', () => {
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

    const { data, error } = await createOrUpdateTransfers({})
    expect(data).toBeUndefined()
    expect(error).toEqual(expectedError)
    expect(mockPrismaTransaction).not.toBeCalled()
  })

  it('should transaction throw error when transfer requests are not found', async () => {
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
      expect(error.message).toBe('Transfer requests not found')
      expect(error.status).toBe(404)

      return { error: {} }
    })

    const { data, error } = await createOrUpdateTransfers({ requests: [1], controllerId: 1 })
    expect(data).toBeUndefined()
    expect(error).toBeDefined()
  })

  it('should update the transfers if a transfer request has a transfer_id', async () => {
    mockValidate.mockImplementation((validator, params) => {
      expect(params).toEqual({ requests: [1], controllerId: 1 })
      return { fields: { requests: [1], controllerId: 1 } }
    })

    mockPrismaTransferRequest.mockImplementation(() => ({
      findMany: () => [
        {
          transfers: [
            {
              id: 1,
            },
          ],
        },
      ],
    }))

    const mockUpdate = jest.fn().mockImplementation(({ where }) => {
      expect(where.id).toBe(1)
      return {
        id: 2,
        updatedAt: '2022-01-07T14:23:03.598Z',
      }
    })

    mockPrismaTransfer.mockImplementation(() => ({
      update: params => mockUpdate(params),
    }))
    mockPrismaTransaction.mockImplementation(async fn => {
      await fn(mockGetPrismaClient())
      return { data: {} }
    })

    const { data, error } = await createOrUpdateTransfers({ requests: [1], controllerId: 1 })
    expect(data).toBeDefined()
    expect(error).toBeUndefined()
  })

  it('should create a transfer if a transfer request does not have a transfer_id', async () => {
    mockValidate.mockImplementation((validator, params) => {
      return { fields: params }
    })

    mockDecrypt.mockResolvedValue('decrypted_value')

    mockPrismaTransferRequest.mockImplementation(() => ({
      findMany: () => [
        {
          id: 1,
          transfers: [],
          receiver: { email: 'email@email.com' },
          wallet: { address: 'adress' },
          amount: 0.01,
          createdAt: 'date',
        },
      ],
    }))

    const mockCreate = jest.fn().mockImplementation(({ data }) => {
      expect(data.controllerId).toBe(1)
      expect(data.transferRequestId).toBe(1)
      expect(data.transferRef).toBe('PaymentIdentifier')
      return {
        controllerId: 1,
        transferRequestId: 1,
        transferRef: 'PaymentIdentifier',
      }
    })

    mockPrismaTransfer.mockImplementation(() => ({
      create: params => mockCreate(params),
    }))

    mockGenerateIdentifier.mockImplementation(() => 'PaymentIdentifier')

    mockPrismaTransaction.mockImplementation(async fn => {
      await fn(mockGetPrismaClient())
      return { data: {} }
    })

    const { data, error } = await createOrUpdateTransfers({ requests: [1], controllerId: 1 })
    expect(data).toBeDefined()
    expect(error).toBeUndefined()
  })
})
