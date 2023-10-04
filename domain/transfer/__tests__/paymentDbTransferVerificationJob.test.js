import { APPROVED_STATUS } from 'domain/transferRequest/constants'
import { FILECOIN_CURRENCY_NAME, PENDING_STATUS, SUCCESS_STATUS } from '../constants'
import { run as RunJob, verifyTransfers } from '../paymentDbTransferVerificationJob'

jest.mock('domain/auth/constants', () => ({
  SYSTEM_USER_ROLE_ID: 'SYSTEM_USER_ROLE_ID',
}))

const mockSendPaidVerification = jest.fn()
jest.mock('domain/notifications/sendPaidNotification', () => ({
  sendPaidVerification: param => mockSendPaidVerification(param),
}))

const mockCreateRequestChangeHistory = jest.fn()
jest.mock('domain/tranferRequestHistory/createRequestChangeHistory', () => ({
  createRequestChangeHistory: () => mockCreateRequestChangeHistory(),
}))

const mockDecryptTransferRequest = jest.fn()
jest.mock('domain/transferRequest/crypto', () => ({
  decryptTransferRequest: () => mockDecryptTransferRequest(),
}))

const mockGetConnection = jest.fn()
const mockCloseConnection = jest.fn()
jest.mock('lib/paymentDb', () => ({
  getConnection: () => mockGetConnection(),
  closeConnection: () => mockCloseConnection(),
}))

const mockPrismaTransfer = jest.fn()
const mockPrismaCurrencyUnit = jest.fn()
const mockPrismaTransferRequest = jest.fn()
const mockGetPrismaClient = jest.fn().mockImplementation(() => {
  return {
    transfer: mockPrismaTransfer(),
    currencyUnit: mockPrismaCurrencyUnit(),
    transferRequest: mockPrismaTransferRequest(),
  }
})

const mockNewPrismaTransaction = jest.fn()
jest.mock('lib/prisma', () => ({
  getPrismaClient: () => mockGetPrismaClient(),
  newPrismaTransaction: fn => mockNewPrismaTransaction(fn),
}))

const mockDecrypt = jest.fn()
const mockEncrypt = jest.fn()
jest.mock('lib/emissaryCrypto', () => ({
  decrypt: param => mockDecrypt(param),
  decryptPII: field => mockDecrypt(field),
  encrypt: param => mockEncrypt(param),
  encryptPII: field => mockEncrypt(field),
}))


const mockGenerateIdentifier = jest.fn().mockReturnValue('PLREFTEST')
jest.mock('domain/payment/generateIdentifier', () => ({
  generatePrefixByEnviroment: () => mockGenerateIdentifier(),
}))

beforeEach(() => {
  mockPrismaTransfer.mockReset()
  mockPrismaTransferRequest.mockReset()
  mockPrismaCurrencyUnit.mockReset()
  mockDecryptTransferRequest.mockReset()
  mockDecrypt.mockReset()
})

describe('paymentDbTransferVerificationJob.test', () => {
  it('should return message when there are no peding transfers', async () => {
    mockPrismaTransfer.mockImplementation(() => ({
      findMany: () => [],
    }))

    const { data, error } = await RunJob()
    expect(error).toBeUndefined()
    expect(data).toEqual({ found: 0, message: 'There are no pending transfers to process' })
  })

  it('should return message when no transaction are found on remote db', async () => {
    mockPrismaTransfer.mockImplementation(() => ({
      findMany: () => [{ id: 1, transferRef: '12345', transferRequest: { wallet: '123', receiver: '123' } }],
    }))
    mockGetConnection.mockImplementation(() => ({
      query: () => ({ rows: [] }),
      end: () => '',
    }))

    const { data, error } = await RunJob()

    expect(error).toBeUndefined()
    expect(data).toEqual({ found: 1, message: 'No new transactions were found' })
  })

  it('should return failed when the wallet address is different', async () => {
    mockPrismaTransfer.mockImplementation(() => ({
      findMany: () => [
        {
          id: 1,
          transferRef: 'params_1',
          transferRequest: { wallet: { id: 1, address: 'address_2' }, receiver: 'receiver_1' },
        },
      ],
    }))

    mockGetConnection.mockImplementation(() => ({
      query: () => ({
        rows: [{ id: 1, params: 'params_1', hash: 'hash_1', address: 'address_1', amount: 10 }],
      }),
      end: () => '',
    }))

    const { data, error } = await RunJob()

    expect(error).toBeUndefined()
    expect(data).toEqual({ found: 1, failed: 1, remaining: 1, updated: 0 })
  })

  it('should return error, when fil currency is not found', async () => {
    mockPrismaTransfer.mockImplementation(() => ({
      findMany: () => [
        {
          id: 1,
          transferRef: 'params_1',
          transferRequest: { wallet: { id: 1, address: 'address_1' }, receiver: 'receiver_1' },
        },
      ],
    }))

    mockGetConnection.mockImplementation(() => ({
      query: () => ({
        rows: [{ id: 1, params: 'params_1', hash: 'hash_1', address: 'address_1', amount: 10 }],
      }),
      end: () => '',
    }))
    mockPrismaCurrencyUnit.mockImplementation(() => ({
      findUnique: () => null,
    }))

    mockDecryptTransferRequest.mockImplementation(() => ({ receiver: { email: 'encryted email' } }))

    mockDecrypt.mockImplementation(() => 'descrypted value')

    mockNewPrismaTransaction.mockImplementation(async fn => {
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

    const { data, error } = await RunJob()

    expect(error).toBeUndefined()
    expect(data).toEqual({ found: 1, failed: 1, remaining: 1, updated: 0 })
  })

  it('should throw an error when updating the transfer', async () => {
    mockPrismaTransfer.mockImplementation(() => ({
      findMany: () => [
        {
          id: 1,
          transferRef: 'params_1',
          transferRequest: { wallet: { id: 1, address: 'address_1' }, receiver: 'receiver_1' },
        },
      ],
      updateMany: () => ({ count: 0 }),
    }))

    mockGetConnection.mockImplementation(() => ({
      query: () => ({
        rows: [{ id: 1, params: 'params_1', hash: 'hash_1', address: 'address_1', amount: 10 }],
      }),
      end: () => '',
    }))
    mockPrismaCurrencyUnit.mockImplementation(() => ({
      findUnique: () => ({ id: 1 }),
    }))

    mockDecryptTransferRequest.mockImplementation(() => ({ receiver: { email: 'encryted email' } }))

    mockDecrypt.mockImplementation(() => 'descrypted value')

    mockNewPrismaTransaction.mockImplementation(async fn => {
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

    const { data, error } = await RunJob()
    expect(error).toBeUndefined()
    expect(data).toEqual({ found: 1, failed: 1, remaining: 1, updated: 0 })
  })

  it('should throw an error when updating the transfer request', async () => {
    mockPrismaTransfer.mockImplementation(() => ({
      findMany: () => [
        {
          id: 1,
          transferRef: 'params_1',
          transferRequest: { wallet: { id: 1, address: 'address_1' }, receiver: 'receiver_1' },
        },
      ],
      updateMany: () => ({ count: 1 }),
    }))

    mockGetConnection.mockImplementation(() => ({
      query: () => ({
        rows: [{ id: 1, params: 'params_1', hash: 'hash_1', address: 'address_1', amount: 10 }],
      }),
      end: () => '',
    }))
    mockPrismaCurrencyUnit.mockImplementation(() => ({
      findUnique: () => ({ id: 1 }),
    }))

    mockPrismaTransferRequest.mockImplementation(() => ({
      updateMany: () => ({ count: 0 }),
    }))

    mockDecryptTransferRequest.mockImplementation(() => ({ receiver: { email: 'encryted email' } }))

    mockDecrypt.mockImplementation(() => 'descrypted value')

    mockNewPrismaTransaction.mockImplementation(async fn => {
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

    const { data, error } = await RunJob()
    expect(error).toBeUndefined()
    expect(data).toEqual({ found: 1, failed: 1, remaining: 1, updated: 0 })
  })

  it('should complete the job successfully', async () => {
    const mockFindManyTransfer = jest.fn().mockImplementation(() => {
      return [
        {
          id: 1,
          transferRef: 'params_1',
          transferRequest: {
            id: 2,
            wallet: { id: 1, address: 'address_1' },
            receiver: 'receiver_1',
          },
        },
      ]
    })
    const mockUpdateManyTransfer = jest.fn().mockImplementation(({ where }) => {
      expect(where.id).toEqual(1)
      expect(where.isActive).toEqual(true)
      expect(where.status).toEqual({ not: SUCCESS_STATUS })
      return { count: 1 }
    })
    mockPrismaTransfer.mockImplementation(() => ({
      findMany: params => mockFindManyTransfer(params),
      updateMany: params => mockUpdateManyTransfer(params),
    }))

    mockGetConnection.mockImplementation(() => ({
      query: () => ({
        rows: [{ id: 1, params: 'params_1', hash: 'hash_1', address: 'address_1', amount: 10 }],
      }),
      end: () => '',
    }))

    const mockFindUniqueCurrencyUnit = jest.fn().mockImplementation(({ where }) => {
      expect(where).toEqual({ name: FILECOIN_CURRENCY_NAME })
      return { id: 1 }
    })
    mockPrismaCurrencyUnit.mockImplementation(() => ({
      findUnique: params => mockFindUniqueCurrencyUnit(params),
    }))

    const mockUpdateManyTransferRequest = jest.fn().mockImplementation(({ where }) => {
      expect(where).toEqual({ id: 2, status: APPROVED_STATUS, isActive: true })
      return { id: 1 }
    })
    mockPrismaTransferRequest.mockImplementation(() => ({
      updateMany: params => mockUpdateManyTransferRequest(params),
    }))
    mockDecryptTransferRequest.mockImplementation(() => ({
      id: 2,
      receiver: { email: 'test@test.com' },
    }))
    mockDecrypt.mockResolvedValue('decrypted_value')

    mockSendPaidVerification.mockImplementation(() => ({}))

    mockNewPrismaTransaction.mockImplementation(async fn => {
      await fn(mockGetPrismaClient())

      return { data: {} }
    })

    const result = await RunJob()
    expect(result).toEqual({
      data: {
        found: 1,
        updated: 1,
        failed: 0,
        remaining: 0,
      },
    })
    expect(mockDecrypt).toBeCalledWith('test@test.com')
    expect(mockSendPaidVerification).toBeCalledWith({ email: 'decrypted_value' })
  })
})

describe('paymentDbTransferVerificationJob.verifyTrasnsfers.test', () => {
  it('should create an alert, when unmatched payments are found', async () => {
    const mockPaymentDb = jest.fn().mockImplementation(() => ({
      query: query => {
        expect(query).toEqual(`
    SELECT
      tx_to address,
      tx_params params,
      tx_hash hash,
      amount amount
    FROM finance.transactions
    WHERE
      UPPER(tx_type) = 'SEND'
      AND UPPER(status) = 'OK'
      AND height > 1862526
      AND tx_params LIKE $1
      AND tx_params NOT IN ('ref_2')
  `)
        return {
          rows: [{ params: 'ref_1' }],
        }
      },
    }))

    mockPrismaTransfer.mockImplementation(() => ({
      findMany: ({ where }) => {
        expect(where).toEqual({ status: { in: [PENDING_STATUS, SUCCESS_STATUS] } })

        return [{ transferRef: 'ref_2' }]
      },
    }))

    await verifyTransfers(mockGetPrismaClient(), mockPaymentDb(), 'PLREFTEST')
  })
})
