import { createWallet } from '../createWallet'
import errorsMessages from 'wordings-and-errors/errors-messages'

const mockPrismaUserWallet = jest.fn()
const mockQueryRaw = jest.fn()
const mockGetPrismaClient = jest.fn().mockImplementation(() => {
  return {
    userWallet: mockPrismaUserWallet(),
    $queryRaw: mockQueryRaw,
  }
})

const mockValidate = jest.fn()
jest.mock('lib/yup', () => ({
  validate: (validator, params) => mockValidate(validator, params),
}))

const mockValidator = jest.fn()
jest.mock('domain/wallet/validation', () => ({
  createWalletValidator: () => mockValidator(),
}))

const mockNotification = jest.fn()
jest.mock('domain/notifications/sendWalletVerificationNotification', () => ({
  sendWalletVerificationNotification: (data) => mockNotification(data),
}))

beforeEach(() => {
  mockValidate.mockReset()
  mockPrismaUserWallet.mockReset()
  mockValidator.mockReset()
  mockQueryRaw.mockReset()
})

describe('createWallet', () => {
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

    const { data, error } = await createWallet({}, {})
    expect(data).toBeUndefined()
    expect(error).toEqual(expectedError)
    expect(mockQueryRaw).not.toBeCalled()
    expect(mockPrismaUserWallet).not.toBeCalled()
  })

  it('should return error when wallet is already used', async () => {
    mockValidate.mockImplementation((validator, params) => {
      return { fields: params }
    })

    mockQueryRaw.mockImplementation((data) => {
      return [{ wallet_exists: 1, verification_used: 0, verification_match: 0 }]
    })

    const requestParams = {
      name: '',
      verificationId: '',
      userId: 8,
      address: 'f1ifoar2uwirdrmr5hylvhpphdph6z6ppgebummli',
      blockchain: 'FILECOIN',
    }

    const expectedError = {
      status: 400,
      errors: {
        address: errorsMessages.wallet_address_in_use,
      },
    }

    const { data, error } = await createWallet(mockGetPrismaClient(), requestParams)

    expect(data).toBeUndefined()
    expect(error).toEqual(expectedError)
  })

  it('should return error when wallet verification is being used', async () => {
    mockValidate.mockImplementation((validator, params) => {
      return { fields: params }
    })

    mockQueryRaw.mockImplementation((data) => {
      return [{ wallet_exists: 0, verification_used: 1, verification_match: 0 }]
    })

    const requestParams = {
      name: '',
      verificationId: 1,
      userId: 8,
      address: 'f1ifoar2uwirdrmr5hylvhpphdph6z6ppgebummli',
      blockchain: 'FILECOIN',
    }

    const expectedError = {
      status: 400,
      message: 'Verification already being used',
    }

    const { data, error } = await createWallet(mockGetPrismaClient(), requestParams)

    expect(data).toBeUndefined()
    expect(error).toEqual(expectedError)
  })

  it('should return error when wallet doesnt match verification', async () => {
    mockValidate.mockImplementation((validator, params) => {
      return { fields: params }
    })

    mockQueryRaw.mockImplementation((data) => {
      return [{ wallet_exists: 0, verification_used: 0, verification_match: 0 }]
    })

    const requestParams = {
      name: '',
      verificationId: 1,
      userId: 8,
      address: 'f1ifoar2uwirdrmr5hylvhpphdph6z6ppgebummli',
      blockchain: 'FILECOIN',
    }

    const expectedError = {
      status: 400,
      message: 'Verification does not match wallet',
    }

    const { data, error } = await createWallet(mockGetPrismaClient(), requestParams)

    expect(data).toBeUndefined()
    expect(error).toEqual(expectedError)
  })

  it('should return the created wallet with verification', async () => {
    mockValidate.mockImplementation((validator, params) => {
      return { fields: params }
    })

    mockQueryRaw.mockImplementation((data) => {
      return [{ wallet_exists: 0, verification_used: 0, verification_match: 1 }]
    })

    mockPrismaUserWallet.mockImplementation(() => ({
      upsert: ({ create }) => {
        expect(create.name).toEqual('')
        expect(create.verificationId).toEqual(1)
        expect(create.userId).toEqual(8)
        expect(create.address).toEqual('f1ifoar2uwirdrmr5hylvhpphdph6z6ppgebummli')
        expect(create.blockchain).toEqual('FILECOIN')

        return {
          id: 1,
          ...create,
        }
      },
      findMany: () => [],
    }))

    const requestParams = {
      name: '',
      userId: 8,
      verificationId: 1,
      address: 'f1ifoar2uwirdrmr5hylvhpphdph6z6ppgebummli',
      blockchain: 'FILECOIN',
    }

    const expectedResponse = {
      id: 1,
      name: '',
      userId: 8,
      address: 'f1ifoar2uwirdrmr5hylvhpphdph6z6ppgebummli',
      blockchain: 'FILECOIN',
      verificationId: 1,
      isActive: false,
      isDefault: undefined,
    }

    const { data, error } = await createWallet(mockGetPrismaClient(), requestParams)

    expect(data).toEqual(expectedResponse)
    expect(error).toBeUndefined()
  })

  it('should return the created wallet without verification', async () => {
    mockValidate.mockImplementation((validator, params) => {
      return { fields: params }
    })

    mockQueryRaw.mockImplementation((data) => {
      return [{ wallet_exists: 0, verification_used: 0, verification_match: 0 }]
    })

    mockPrismaUserWallet.mockImplementation(() => ({
      upsert: ({ create }) => {
        expect(create.name).toEqual('')
        expect(create.verificationId).toBeUndefined()
        expect(create.userId).toEqual(8)
        expect(create.address).toEqual('f1ifoar2uwirdrmr5hylvhpphdph6z6ppgebummli')
        expect(create.blockchain).toEqual('FILECOIN')

        return {
          id: 1,
          ...create,
        }
      },
      findMany: () => [],
    }))

    mockNotification.mockImplementation((data) => {
      expect(data.address).toEqual('f1ifoar2uwirdrmr5hylvhpphdph6z6ppgebummli')
      expect(data.id).toEqual(1)
      expect(data.email).toEqual('email@email.com')
    })

    const requestParams = {
      name: '',
      userId: 8,
      address: 'f1ifoar2uwirdrmr5hylvhpphdph6z6ppgebummli',
      blockchain: 'FILECOIN',
      email: 'email@email.com'
    }

    const expectedResponse = {
      id: 1,
      name: '',
      userId: 8,
      address: 'f1ifoar2uwirdrmr5hylvhpphdph6z6ppgebummli',
      blockchain: 'FILECOIN',
      verificationId: undefined,
      isActive: false,
      isDefault: undefined,
    }

    const { data, error } = await createWallet(mockGetPrismaClient(), requestParams)

    expect(data).toEqual(expectedResponse)
    expect(error).toBeUndefined()
  })
})
