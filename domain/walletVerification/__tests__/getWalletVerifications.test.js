import { getWalletVerifications } from '../getWalletVerifications'

const mockPrismaWalletVerification = jest.fn()
const mockGetPrismaClient = jest.fn().mockImplementation(() => {
  return {
    walletVerification: mockPrismaWalletVerification(),
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
jest.mock('domain/walletVerification/validation', () => ({
  getWalletVerificationsValidator: () => mockValidator(),
}))

beforeEach(() => {
  mockValidate.mockReset()
  mockPrismaWalletVerification.mockReset()
})

describe('getWalletVerifications', () => {
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
  
    const { data, error } = await getWalletVerifications({},{})
    expect(data).toBeUndefined()
    expect(error).toEqual(expectedError)
    expect(mockPrismaWalletVerification).not.toBeCalled()
  })

  it('should return the found wallet verification data', async () => {
    mockValidate.mockImplementation((validator, params) => {
      return { fields: params }
    })

    mockPrismaWalletVerification.mockImplementation(() => ({
      findFirst: ({ data, where }) => {
        expect(where.address).toEqual('f1ifoar2uwirdrmr5hylvhpphdph6z6ppgebummli')
        expect(where.userId).toEqual(1)
        return {
          id: 1,
          address: 'f1ifoar2uwirdrmr5hylvhpphdph6z6ppgebummli',
          isVerified: true
        }
      },
    }))

    const requestParams = {
      address: 'f1ifoar2uwirdrmr5hylvhpphdph6z6ppgebummli',
      userId: 1
    }
  
    const expectedResponse = {
      id: 1,
      address: 'f1ifoar2uwirdrmr5hylvhpphdph6z6ppgebummli',
      isVerified: true
    }
  
    const { data, error } = await getWalletVerifications(requestParams)
  
    expect(data).toEqual(expectedResponse)
    expect(error).toBeUndefined()
  })
})