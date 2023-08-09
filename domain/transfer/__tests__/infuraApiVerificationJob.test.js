import { APPROVED_STATUS } from 'domain/transferRequest/constants'
import { FILECOIN_CURRENCY_NAME, PENDING_STATUS, SUCCESS_STATUS } from '../constants'
import { run } from '../infuraApiVerificationJob'

const mockPrismaTransaction = jest.fn()
const mockPrismaTransfer = jest.fn()
const mockPrismaTransferRequest = jest.fn()
const mockPrismaCurrencyUnit = jest.fn()
const mockPrismaScriptTransaction = jest.fn()

const mockGetPrismaClient = jest.fn().mockImplementation(() => {
  return {
    transfer: mockPrismaTransfer(),
    currencyUnit: mockPrismaCurrencyUnit(),
    transferRequest: mockPrismaTransferRequest(),
    scriptTransaction: mockPrismaScriptTransaction(),
  }
})

const mockDecrypt = jest.fn()
const mockEncrypt = jest.fn()
jest.mock('lib/emissaryCrypto', () => ({
  decrypt: field => mockDecrypt(field),
  decryptPII: field => mockDecrypt(field),
  encrypt: field => mockEncrypt(field),
  encryptPII: field => mockEncrypt(field),
}))

const mockCreateHistory = jest.fn()
jest.mock('domain/tranferRequestHistory/createRequestChangeHistory', () => ({
  createRequestChangeHistory: (prisma, params) => mockCreateHistory(prisma, params),
}))

jest.mock('lib/prisma', () => ({
  getPrismaClient: () => mockGetPrismaClient(),
  newPrismaTransaction: fn => mockPrismaTransaction(fn),
}))

const mockChainGetMessageId = jest.fn()
jest.mock('lib/filecoinApi', () => ({
  chainGetMessageId: field => mockChainGetMessageId(field),
}))
const mockDecryptTransferRequest = jest.fn()
jest.mock('domain/transferRequest/crypto', () => ({
  decryptTransferRequest: field => mockDecryptTransferRequest(field),
}))
const mockConvert = jest.fn()
jest.mock('lib/filecoin', () => ({
  convert: field => mockConvert(field),
}))

const mockNotification = jest.fn()
jest.mock('domain/notifications/sendPaidNotification', () => ({
  sendPaidVerification: params => mockNotification(params),
}))

beforeEach(() => {
  mockPrismaTransfer.mockReset()
  mockPrismaTransferRequest.mockReset()
  mockPrismaTransaction.mockReset()
  mockPrismaCurrencyUnit.mockReset()
  mockPrismaScriptTransaction.mockReset()
})

describe('infuraApiVerificationJob', () => {
  it('should return a message when there are no pending transfers to process', async () => {
    mockPrismaScriptTransaction.mockImplementation(() => ({
      findMany: () => [],
    }))

    const result = await run()

    expect(result).toEqual({
      data: {
        found: 0,
        message: 'There are no pending transfers to process',
      },
    })
  })

  it('should return failed when getting the message id throw an error', async () => {
    mockPrismaScriptTransaction.mockImplementation(() => ({
      findMany: () => [{ id: 1, transaction: 'xyz' }],
    }))
    mockChainGetMessageId.mockImplementation(() => ({ data: { error: {} } }))

    const result = await run()

    expect(result).toEqual({
      data: { found: 1, updated: 0, failed: 1, remaining: 1 },
    })
  })

  it('should return failed when params is not found', async () => {
    mockPrismaScriptTransaction.mockImplementation(() => ({
      findMany: () => [{ id: 1, transaction: 'xyz' }],
    }))
    mockChainGetMessageId.mockImplementation(() => ({ data: {} }))

    const result = await run()

    expect(result).toEqual({
      data: { found: 1, updated: 0, failed: 1, remaining: 1 },
    })
  })

  it('should return failed when transfer is not found', async () => {
    mockPrismaScriptTransaction.mockImplementation(() => ({
      findMany: () => [{ id: 1, transaction: 'xyz' }],
    }))
    mockChainGetMessageId.mockImplementation(() => ({ data: { result: { Params: 'yxz' } } }))

    mockPrismaTransfer.mockImplementation(() => ({
      findMany: () => [],
    }))

    const result = await run()

    expect(result).toEqual({
      data: { found: 1, updated: 0, failed: 1, remaining: 1 },
    })
  })

  it('should return failed when the wallet address is different', async () => {
    mockPrismaScriptTransaction.mockImplementation(() => ({
      findMany: () => [{ id: 1, transaction: 'xyz' }],
    }))
    mockChainGetMessageId.mockImplementation(() => ({
      data: { result: { Params: 'yxz', To: '123' } },
    }))

    mockPrismaTransfer.mockImplementation(() => ({
      findMany: () => [{ id: 1, transferRequest: { id: 2, wallet: { id: 1, address: '321' } } }],
    }))

    const result = await run()

    expect(result).toEqual({
      data: { found: 1, updated: 0, failed: 1, remaining: 1 },
    })
  })

  it('should throw an error if currency is not found', async () => {
    mockPrismaScriptTransaction.mockImplementation(() => ({
      findMany: () => [{ id: 1, transaction: 'xyz' }],
      updateMany: () => ({ count: 1 }),
    }))
    mockChainGetMessageId.mockImplementation(() => ({
      data: { result: { Params: 'yxz', To: '123' } },
    }))

    mockPrismaTransfer.mockImplementation(() => ({
      findMany: () => [{ id: 1, transferRequest: { id: 2, wallet: { id: 1, address: '123' } } }],
    }))

    mockPrismaCurrencyUnit.mockImplementation(() => ({
      findUnique: () => null,
    }))

    mockPrismaTransaction.mockImplementation(async fn => {
      let error
      try {
        await fn(mockGetPrismaClient())
      } catch (err) {
        error = err
      }
      expect(error.message).toEqual('FIL currency not found')
      expect(error.status).toEqual(404)
      return { error }
    })

    const result = await run()

    expect(result).toEqual({
      data: { found: 1, updated: 0, failed: 1, remaining: 1 },
    })
  })

  it('should throw an error when updating the transfer', async () => {
    mockPrismaScriptTransaction.mockImplementation(() => ({
      findMany: () => [{ id: 1, transaction: 'xyz' }],
      updateMany: () => ({ count: 1 }),
    }))
    mockChainGetMessageId.mockImplementation(() => ({
      data: { result: { Params: 'yxz', To: '123' } },
    }))

    mockPrismaTransfer.mockImplementation(() => ({
      findMany: () => [{ id: 1, transferRequest: { id: 2, wallet: { id: 1, address: '123' } } }],
      updateMany: () => ({ count: 0 }),
    }))

    mockPrismaCurrencyUnit.mockImplementation(() => ({
      findUnique: () => ({ id: 1 }),
    }))
    mockConvert.mockImplementation(() => 123)

    mockPrismaTransaction.mockImplementation(async fn => {
      let error
      try {
        await fn(mockGetPrismaClient())
      } catch (err) {
        error = err
      }
      expect(error.message).toEqual('Transfer not found')
      expect(error.status).toEqual(404)
      return { error }
    })

    const result = await run()

    expect(result).toEqual({
      data: { found: 1, updated: 0, failed: 1, remaining: 1 },
    })
  })

  it('should throw an error when updating the transfer request', async () => {
    mockPrismaScriptTransaction.mockImplementation(() => ({
      findMany: () => [{ id: 1, transaction: 'xyz' }],
      updateMany: () => ({ count: 1 }),
    }))
    mockChainGetMessageId.mockImplementation(() => ({
      data: { result: { Params: 'yxz', To: '123' } },
    }))

    mockPrismaTransfer.mockImplementation(() => ({
      findMany: () => [{ id: 1, transferRequest: { id: 2, wallet: { id: 1, address: '123' } } }],
      updateMany: () => ({ count: 1 }),
    }))

    mockPrismaCurrencyUnit.mockImplementation(() => ({
      findUnique: () => ({ id: 1 }),
    }))
    mockConvert.mockImplementation(() => 123)

    mockPrismaTransferRequest.mockImplementation(() => ({
      updateMany: () => ({ count: 0 }),
    }))

    mockPrismaTransaction.mockImplementation(async fn => {
      let error
      try {
        await fn(mockGetPrismaClient())
      } catch (err) {
        error = err
      }
      expect(error.message).toEqual('Transfer request not found')
      expect(error.status).toEqual(404)
      return { error }
    })

    const result = await run()

    expect(result).toEqual({
      data: { found: 1, updated: 0, failed: 1, remaining: 1 },
    })
  })

  it('should complete the job successfully', async () => {
    const mockUpdateManyScriptTransaction = jest.fn().mockImplementation(({ where }) => {
      expect(where).toEqual({ isActive: true, isProcessed: false })
      return [{ id: 1, transaction: 'xyz' }]
    })
    const mockUpdateScriptTransaction = jest.fn().mockImplementation(({ where }) => {
      expect(where).toEqual({ id: 1, isProcessed: false })
      return { count: 1 }
    })
    mockPrismaScriptTransaction.mockImplementation(() => ({
      findMany: params => mockUpdateManyScriptTransaction(params),
      updateMany: params => mockUpdateScriptTransaction(params),
    }))
    mockChainGetMessageId.mockImplementation(() => ({
      data: { result: { Params: 'yxz', To: '123' } },
    }))

    const mockfindManyTransfer = jest.fn().mockImplementation(({ where }) => {
      expect(where).toEqual({ transferRef: '�\x1C', isActive: true, status: PENDING_STATUS })
      return [{ id: 1, transferRequest: { id: 2, wallet: { id: 1, address: '123' } } }]
    })
    const mockUpdateManyTransfer = jest.fn().mockImplementation(({ where }) => {
      expect(where).toEqual({ id: 1, isActive: true, status: { not: SUCCESS_STATUS } })
      return { count: 1 }
    })
    mockPrismaTransfer.mockImplementation(() => ({
      findMany: params => mockfindManyTransfer(params),
      updateMany: params => mockUpdateManyTransfer(params),
    }))

    const mockFindUniqueCurrencyUnit = jest.fn().mockImplementation(({ where }) => {
      expect(where).toEqual({ name: FILECOIN_CURRENCY_NAME })
      return { id: 1 }
    })
    mockPrismaCurrencyUnit.mockImplementation(() => ({
      findUnique: params => mockFindUniqueCurrencyUnit(params),
    }))
    mockConvert.mockImplementation(() => 123)

    const mockUpdateManyTransferRequest = jest.fn().mockImplementation(({ where }) => {
      expect(where).toEqual({ id: 2, status: APPROVED_STATUS, isActive: true })
      return { count: 1 }
    })
    mockPrismaTransferRequest.mockImplementation(() => ({
      updateMany: params => mockUpdateManyTransferRequest(params),
    }))

    mockDecryptTransferRequest.mockImplementation(() => ({
      id: 1,
      receiver: { email: 'test@test.com' },
    }))

    mockPrismaTransaction.mockImplementation(async fn => {
      await fn(mockGetPrismaClient())
      return { data: {} }
    })

    const result = await run()

    expect(result).toEqual({
      data: { found: 1, updated: 1, failed: 0, remaining: 0 },
    })
  })
})
