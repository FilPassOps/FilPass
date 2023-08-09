import * as prismaLib from 'lib/prisma'
import * as sendVerificationModule from 'domain/walletVerification/sendVerificationTransaction'
import errorsMessages from 'wordings-and-errors/errors-messages'

jest.mock('lib/prisma')

const mockGetMasterWallet = jest.fn()
const mockGetVerificationAmount = jest.fn()
const mockConvert = jest.fn()
const mockSignMessage = jest.fn()
jest.mock('lib/filecoin', () => ({
  signMessage: (transaction, pk) => mockSignMessage(transaction, pk),
  getMasterWallet: () => mockGetMasterWallet(),
  getVerificationAmount: () => mockGetVerificationAmount(),
  convert: (value, from, to) => mockConvert(value, from, to),
  FIL: 'FIL',
  ATTOFIL: 'ATTOFIL',
}))

const mockGetNonce = jest.fn()
const mockSendTransaction = jest.fn()
const mockGetGasEstimation = jest.fn()
const mockGetWalletBalance = jest.fn()
jest.mock('lib/filecoinApi', () => ({
  getGasEstimation: params => mockGetGasEstimation(params),
  getNonce: address => mockGetNonce(address),
  sendTransaction: message => mockSendTransaction(message),
  getWalletBalance: address => mockGetWalletBalance(address),
}))

const mockValidate = jest.fn()
jest.mock('lib/yup', () => ({
  validate: (validator, params) => mockValidate(validator, params),
}))

const mockValidator = jest.fn()
jest.mock('domain/walletVerification/validation', () => ({
  sendVerificationTransactionValidator: () => mockValidator(),
}))

beforeEach(() => {
  mockValidate.mockReset()
  mockGetGasEstimation.mockReset()
})

describe('sendVerificationTransaction', () => {
  it('should return error when validation fails', async () => {
    mockValidate.mockImplementation((validator, params) => {
      expect(params).toEqual({})

      return {
        errors: {
          test: 'test',
        },
      }
    })

    const checkUserSpy = jest.spyOn(sendVerificationModule, 'checkUserTransactions')

    const { data, error } = await sendVerificationModule.sendVerificationTransaction({})

    const expectedError = {
      status: 400,
      errors: {
        test: 'test',
      },
    }

    expect(data).toBeUndefined()
    expect(error).toEqual(expectedError)
    expect(checkUserSpy).not.toBeCalled()

    checkUserSpy.mockRestore()
  })

  it('should return error when checkUserTransaction fails', async () => {
    const checkUserSpy = jest.spyOn(sendVerificationModule, 'checkUserTransactions')
    checkUserSpy.mockReturnValue({ error: 'check error' })

    const sendSpy = jest.spyOn(sendVerificationModule, 'send')

    mockValidate.mockImplementation((validator, params) => {
      return { fields: params }
    })

    const requestParams = {
      address: 'f1ifoar2uwirdrmr5hylvhpphdph6z6ppgebummli',
      userId: 8,
      blockchain: 'FILECOIN',
    }

    const { data, error } = await sendVerificationModule.sendVerificationTransaction(requestParams)

    const expectedError = {
      status: 400,
      message: 'check error',
    }

    expect(data).toBeUndefined()
    expect(error).toEqual(expectedError)
    expect(sendSpy).not.toBeCalled()
    expect(checkUserSpy).toBeCalledWith({
      address: 'f1ifoar2uwirdrmr5hylvhpphdph6z6ppgebummli',
      userId: 8,
    })

    checkUserSpy.mockRestore()
    sendSpy.mockRestore()
  })

  it('should return error when send fails', async () => {
    const checkUserSpy = jest.spyOn(sendVerificationModule, 'checkUserTransactions')
    checkUserSpy.mockReturnValue({})

    const sendSpy = jest.spyOn(sendVerificationModule, 'send')
    sendSpy.mockReturnValue({
      error: {
        status: 400,
        message: 'super error',
      },
    })

    mockValidate.mockImplementation((validator, params) => {
      return { fields: params }
    })

    mockGetMasterWallet.mockReturnValue({ address: 'master_wallet_address' })
    mockGetVerificationAmount.mockReturnValue({ scale: 'FIL', value: 10 })
    mockConvert.mockReturnValue(606)
    mockGetWalletBalance.mockReturnValue({ data: { result: 1854085545975702 } })

    const createMock = jest.fn()
    const userMock = jest.fn().mockReturnValue({ id: 1, email: 'user@email.com' })
    prismaLib.getPrismaClient.mockReturnValue({
      walletVerification: {
        create: createMock,
      },
      user: {
        findUnique: userMock,
      },
    })

    const requestParams = {
      address: 'f1ifoar2uwirdrmr5hylvhpphdph6z6ppgebummli',
      userId: 8,
      blockchain: 'FILECOIN',
    }

    const { data, error } = await sendVerificationModule.sendVerificationTransaction(requestParams)

    const expectedError = {
      status: 400,
      message: 'super error',
    }

    const expectedTransaction = {
      to: 'f1ifoar2uwirdrmr5hylvhpphdph6z6ppgebummli',
      from: 'master_wallet_address',
      nonce: 0,
      value: '606',
      gasprice: '0',
      gaslimit: 0,
      gaspremium: '0',
      gasfeecap: '0',
      method: 0,
      params: '',
    }

    expect(data).toBeUndefined()
    expect(error).toEqual(expectedError)
    expect(createMock).not.toBeCalled()
    expect(mockConvert).toBeCalledWith(10, 'FIL', 'ATTOFIL')
    expect(sendSpy).toBeCalledWith(expectedTransaction, { address: 'master_wallet_address' }, 1854085545975702)

    checkUserSpy.mockRestore()
    sendSpy.mockRestore()
  })

  it('should return error if user data is not found', async () => {
    mockValidate.mockImplementation((validator, params) => {
      return { fields: params }
    })

    const checkUserSpy = jest.spyOn(sendVerificationModule, 'checkUserTransactions')
    checkUserSpy.mockReturnValue({})

    const sendSpy = jest.spyOn(sendVerificationModule, 'send')
    sendSpy.mockReturnValue({
      data: {
        signedTransaction: 'signed_transaction',
        transactionId: 100,
      },
    })

    const userMock = jest.fn().mockReturnValue(null)
    prismaLib.getPrismaClient.mockReturnValue({
      user: {
        findUnique: userMock,
      },
    })

    mockGetVerificationAmount.mockReturnValue({ scale: 'FIL', value: 250 })
    mockConvert.mockReturnValue(606)

    const requestParams = {
      address: 'f1ifoar2uwirdrmr5hylvhpphdph6z6ppgebummli',
      userId: 8,
      blockchain: 'FILECOIN',
    }

    const { data, error } = await sendVerificationModule.sendVerificationTransaction(requestParams)

    expect(data).toBeUndefined()
    expect(error).toEqual({
      status: 400,
      message: errorsMessages.user_not_found.message,
    })
    checkUserSpy.mockRestore()
    sendSpy.mockRestore()
  })

  it('should return created wallet verification data', async () => {
    mockValidate.mockImplementation((validator, params) => {
      return { fields: params }
    })

    const checkUserSpy = jest.spyOn(sendVerificationModule, 'checkUserTransactions')
    checkUserSpy.mockReturnValue({})

    const sendSpy = jest.spyOn(sendVerificationModule, 'send')
    sendSpy.mockReturnValue({
      data: {
        signedTransaction: 'signed_transaction',
        transactionId: 100,
      },
    })

    const createMock = jest.fn().mockReturnValue({ id: 10 })
    const userMock = jest.fn().mockReturnValue({ id: 1, email: 'user@email.com' })
    prismaLib.getPrismaClient.mockReturnValue({
      walletVerification: {
        create: createMock,
      },
      user: {
        findUnique: userMock,
      },
    })

    mockGetVerificationAmount.mockReturnValue({ scale: 'FIL', value: 250 })
    mockConvert.mockReturnValue(606)

    const requestParams = {
      address: 'f1ifoar2uwirdrmr5hylvhpphdph6z6ppgebummli',
      userId: 8,
      blockchain: 'FILECOIN',
    }

    const { data, error } = await sendVerificationModule.sendVerificationTransaction(requestParams)

    const expectedCreateData = {
      address: 'f1ifoar2uwirdrmr5hylvhpphdph6z6ppgebummli',
      blockchain: 'FILECOIN',
      transactionId: 100,
      transactionAmount: 250,
      transactionContent: 'signed_transaction',
      transactionCurrencyUnit: {
        connect: {
          name: 'FIL',
        },
      },
      user: {
        connect: {
          id: 8,
        },
      },
    }

    expect(data).toEqual({ id: 10 })
    expect(error).toBeUndefined()
    expect(createMock).toBeCalledWith({
      data: expectedCreateData,
      select: {
        id: true,
        address: true,
        isVerified: true,
        transactionAmount: true,
      },
    })

    checkUserSpy.mockRestore()
    sendSpy.mockRestore()
  })

  describe('checkUserTransactions', () => {
    it('should return error when verification count > 3', async () => {
      const mockWalletVerification = jest.fn().mockReturnValue({
        findMany: () => {
          return [{ id: 1 }, { id: 2 }, { id: 3 }]
        },
      })

      const mockGetPrismaClient = jest.fn().mockReturnValue({
        walletVerification: mockWalletVerification(),
      })

      prismaLib.getPrismaClient.mockReturnValue(mockGetPrismaClient())

      const { error } = await sendVerificationModule.checkUserTransactions({ address: '', userId: '' })

      expect(error).toEqual('Reached maximum number of daily verifications.')
    })

    it('should return address if already in verify state', async () => {
      const mockWalletVerification = jest.fn().mockReturnValue({
        findMany: () => {
          return [{ id: 1, address: '123' }, { id: 2 }, { id: 3 }]
        },
      })

      const mockGetPrismaClient = jest.fn().mockReturnValue({
        walletVerification: mockWalletVerification(),
      })

      prismaLib.getPrismaClient.mockReturnValue(mockGetPrismaClient())

      const { data } = await sendVerificationModule.checkUserTransactions({ address: '123', userId: '' })

      expect(data).toEqual({ id: 1, address: '123' })
    })
  })

  describe('send', () => {
    it('should return error when send transaction fails - gasError', async () => {
      mockGetGasEstimation.mockImplementation(() => ({ error: { status: 400 } }))

      const expectedError = {
        status: 400,
        message: errorsMessages.something_went_wrong.message,
      }

      const { data, error } = await sendVerificationModule.send('transaction', {})

      expect(data).toBeUndefined()
      expect(error).toEqual(expectedError)
      expect(mockGetGasEstimation).toBeCalledWith('transaction')
    })

    it('should return error when send transaction fails - nonceError', async () => {
      mockGetGasEstimation.mockReturnValue({ data: {} })
      mockGetNonce.mockReturnValue({ error: { status: 400 } })

      const expectedError = {
        status: 400,
        message: errorsMessages.something_went_wrong.message,
      }

      const { data, error } = await sendVerificationModule.send('transaction', {
        address: 'master_wallet_address',
      })

      expect(data).toBeUndefined()
      expect(error).toEqual(expectedError)
      expect(mockGetNonce).toBeCalledWith('master_wallet_address')
    })

    it('should return error when send transaction fails - push transaction error', async () => {
      mockGetGasEstimation.mockReturnValue({
        data: { result: { GasLimit: 1, GasFeeCap: 2, GasPremium: 3 } },
      })
      mockGetNonce.mockReturnValue({ data: { result: 10 } })
      mockSendTransaction.mockReturnValue({ error: { status: 400 } })

      const transaction = {
        to: 'transaction_address',
        from: 'master_wallet_address',
        nonce: 0,
        value: '100',
        gasprice: '0',
        gaslimit: 0,
        gaspremium: '0',
        gasfeecap: '0',
        method: 0,
        params: '',
      }

      const { data, error } = await sendVerificationModule.send(transaction, {
        private_raw: 'private_raw',
      })

      const expectedError = {
        status: 400,
        message: errorsMessages.something_went_wrong.message,
      }

      const expectedSignedTransaction = {
        to: 'transaction_address',
        from: 'master_wallet_address',
        nonce: 10,
        value: '100',
        gasprice: '0',
        gaslimit: 1,
        gaspremium: 3,
        gasfeecap: 2,
        method: 0,
        params: '',
      }

      expect(data).toBeUndefined()
      expect(error).toEqual(expectedError)
      expect(mockSignMessage).toBeCalledWith(expectedSignedTransaction, 'private_raw')
    })

    it('should return signed transaction data', async () => {
      mockSignMessage.mockReturnValue('signed_transaction')
      mockGetGasEstimation.mockReturnValue({ data: { result: {} } })
      mockGetNonce.mockReturnValue({ data: { result: 10 } })
      mockSendTransaction.mockReturnValue({
        data: {
          result: {
            '/': 'transactionId',
          },
        },
      })

      const { data, error } = await sendVerificationModule.send('', {
        private_raw: 'private_raw',
      })

      expect(error).toBeUndefined()
      expect(data).toEqual({
        transactionId: 'transactionId',
        signedTransaction: 'signed_transaction',
      })
    })
  })
})
