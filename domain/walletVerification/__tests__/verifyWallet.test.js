import * as walletVerificationModule from 'domain/walletVerification/verifyWallet'
import { TransactionError } from 'lib/errors'
import errorsMessages from 'wordings-and-errors/errors-messages'

const mockPrismaWalletVerification = jest.fn()
const mockPrismaUserWallet = jest.fn()
const mockPrismaTransaction = jest.fn()
const mockGetPrismaClient = jest.fn().mockImplementation(() => {
  return {
    walletVerification: mockPrismaWalletVerification(),
    newPrismaTransaction: (fn) => mockPrismaTransaction(fn),
    userWallet: mockPrismaUserWallet,
  }
})

jest.mock('lib/prisma', () => ({
  getPrismaClient: () => mockGetPrismaClient(),
  newPrismaTransaction: (fn) => mockPrismaTransaction(fn),
}))

const mockValidate = jest.fn()
jest.mock('lib/yup', () => ({
  validate: (validator, params) => mockValidate(validator, params),
}))

const mockValidator = jest.fn()
jest.mock('domain/walletVerification/validation', () => ({
  verifyWalletValidator: () => mockValidator(),
}))

const mockCreateWallet = jest.fn()
jest.mock('domain/wallet/createWallet', () => ({
  createWallet: (prisma, params) => mockCreateWallet(prisma, params),
}))

beforeEach(() => {
  mockValidate.mockReset()
  mockPrismaTransaction.mockReset()
  mockPrismaWalletVerification.mockReset()
})

describe('verifyWallet', () => {
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

    const { data, error } = await walletVerificationModule.verifyWallet({})
    expect(data).toBeUndefined()
    expect(error).toEqual(expectedError)
    expect(mockPrismaWalletVerification).not.toBeCalled()
    expect(mockPrismaTransaction).not.toBeCalled()
  })

  it('should return error when verification is not found', async () => {
    mockValidate.mockImplementation((validator, params) => {
      return { fields: params }
    })

    mockPrismaWalletVerification.mockImplementation(() => ({
      findUnique: () => undefined
    }))

    mockPrismaUserWallet.mockImplementation(() => ({
      findMany: () => [],
    }))

    const requestParams = {
      amount: '',
      unit: '',
      verificationId: '',
      userId: 8,
      name: '',
    }
    const expectedError = {
      status: 404,
      message: errorsMessages.wallet_verification_not_found.message,
    }

    const { data, error } = await walletVerificationModule.verifyWallet(requestParams)
    expect(data).toBeUndefined()
    expect(error).toEqual(expectedError)
  })

  it('should return error when wallet cant be verified', async () => {
    mockValidate.mockImplementation((validator, params) => {
      return { fields: params }
    })

    mockPrismaWalletVerification.mockImplementation(() => ({
      findUnique: ({ where }) => {
        
        expect(where).toEqual({ id: 2 })

        return {
          transactionAmount: 1,
          address: 'wallet_address',
          blockchain: 'FIL',
        }
      }
    }))

    const requestParams = {
      amount: 5,
      unit: '',
      verificationId: 2,
      userId: 8,
      name: '',
    }
    const expectedError = {
      status: 400,
      message: errorsMessages.wallet_verification_value_not_match.message,
    }

    const { data, error } = await walletVerificationModule.verifyWallet(requestParams)
    expect(data).toBeUndefined()
    expect(error).toEqual(expectedError)
  })

  it('should call handleWalletVerified when verification matches', async () => {
    const handleWalletVerifiedSpy = jest.spyOn(walletVerificationModule, 'handleWalletVerified')
    handleWalletVerifiedSpy.mockReturnValue({ data: {} })

    mockValidate.mockImplementation((validator, params) => {
      return { fields: params }
    })

    mockPrismaWalletVerification.mockImplementation(() => ({
      findUnique: () => {
        return {
          transactionAmount: 0.009,
          address: 'wallet_address',
          blockchain: 'wallet_chain',
        }
      }
    }))

    const requestParams = {
      amount: 0.009,
      unit: '',
      verificationId: 10,
      userId: 8,
      name: 'wallet_name',
    }

    const response = await walletVerificationModule.verifyWallet(requestParams)

    expect(response).toEqual({ data: {} })
    expect(handleWalletVerifiedSpy).toBeCalledWith({
      name: 'wallet_name',
      userId: 8,
      verificationId: 10,
      address: 'wallet_address',
      blockchain: 'wallet_chain',
    })

    handleWalletVerifiedSpy.mockRestore()
  })

  describe('handleWalletVerified', () => {
    it('should trow an error when it fails to create wallet', async () => {
      const mockedWalletVerificationUpdate = jest.fn()

      const mockedPrismaClient = {
        walletVerification: {
          update: mockedWalletVerificationUpdate,
        },
        userWallet: {
          findMany: jest.fn(),
        },
      }
      mockPrismaUserWallet.mockImplementation(() => ({
        findMany: () => [],
      }))

      mockPrismaTransaction.mockImplementation(async (fn) => {
        let error
        try {
          await fn(mockedPrismaClient)
        } catch (err) {
          error = err
        }

        expect(error).toEqual(
          new TransactionError('Could not create wallet', { message: 'super_error' })
        )
      })

      mockCreateWallet.mockReturnValue({ error: { message: 'super_error' } })

      await walletVerificationModule.handleWalletVerified({
        name: 'wallet_name',
        userId: 8,
        verificationId: 10,
        address: 'wallet_address',
        blockchain: 'wallet_chain',
      })

      expect(mockCreateWallet).toBeCalledWith(mockedPrismaClient, {
        name: 'wallet_name',
        userId: 8,
        verificationId: 10,
        address: 'wallet_address',
        blockchain: 'wallet_chain',
        isDefault: true,
      })

      expect(mockedWalletVerificationUpdate).not.toBeCalled()
    })

    it('should return the created wallet data', async () => {
      const mockedWalletVerificationUpdate = jest.fn()

      const mockedPrismaClient = {
        walletVerification: {
          update: mockedWalletVerificationUpdate,
        },
        userWallet: {
          findMany: jest.fn(),
        },
      }

      mockPrismaUserWallet.mockImplementation(() => ({
        findMany: () => [],
      }))

      mockPrismaTransaction.mockImplementation((fn) => fn(mockedPrismaClient))
      mockCreateWallet.mockReturnValue({ data: {} })

      const response = await walletVerificationModule.handleWalletVerified({
        verificationId: 10,
      })

      expect(response).toEqual({})
      expect(mockedWalletVerificationUpdate).toBeCalledWith({
        where: {
          id: 10,
        },
        data: {
          isVerified: true,
        },
      })
    })
  })
})
