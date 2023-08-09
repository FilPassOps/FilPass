import { setWalletActive } from '../setWalletActive'

import errorsMessages from 'wordings-and-errors/errors-messages'

const mockUserWallet = jest.fn()
const mockGetPrismaClient = jest.fn().mockImplementation(() => {
  return {
    userWallet: mockUserWallet(),
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
jest.mock('domain/wallet/validation', () => ({
  setDefaultValidator: () => mockValidator(),
}))

const mockVerify = jest.fn()
jest.mock('lib/jwt', () => ({
  verify: (data) => mockVerify(data)
}))

beforeEach(() => {
  mockValidate.mockReset()
})

describe('setWalletActive', () => {
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

    const { data, error } = await setWalletActive({})
    expect(data).toBeUndefined()
    expect(error).toEqual(expectedError)
    expect(mockUserWallet).not.toBeCalled()
  })
  

  it('should return error when token is invalid', async () => {
    mockValidate.mockImplementation((validator, params) => {
      return { fields: params }
    })

    mockVerify.mockImplementation((token, secret) => {
      expect(secret).toBeUndefined()
      expect(token).toEqual('123')
      throw { name: 'TokenExpiredError' }
    })

    const { data, error } = await setWalletActive({ token: '123' })
    expect(data).toBeUndefined()
    expect(error).toEqual({
      status: 400,
      message: errorsMessages.expired_token_link.message,
    })
  })
  
  it('should return error when db fails', async () => {
    mockValidate.mockImplementation((validator, params) => {
      return { fields: params }
    })

    mockVerify.mockImplementation(() => {
      return { id: 1 }
    })

    mockUserWallet.mockImplementation(() => ({
      update: () => {
        throw 'error'
      }
    }))

    const { data, error } = await setWalletActive({ token: '123' })
    expect(data).toBeUndefined()
    expect(error).toEqual({
      status: 500,
      message: errorsMessages.something_went_wrong.message,
    })
  })

  it('should update user wallet to active', async () => {
    mockValidate.mockImplementation((validator, params) => {
      return { fields: params }
    })

    mockVerify.mockImplementation(() => {
      return { data: { id: 1, userId: 1 }}
    })

    mockUserWallet.mockImplementation(() => ({
      update: ({ where, data }) => {
        expect(where).toEqual({ id: 1 })
        expect(data).toEqual({ isActive: true, isDefault: true })

        return { id: 1 }
      },
      findMany: () => {
        return []
      }
    }))

    const { data, error } = await setWalletActive({ token: '123' })
    expect(data).toEqual({ id: 1 })
    expect(error).toBeUndefined()
  })
})
