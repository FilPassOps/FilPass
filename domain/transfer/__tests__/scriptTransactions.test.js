import { scriptTransactions } from '../scriptTransactions'

const mockPrismaScriptTransaction = jest.fn()
const mockGetPrismaClient = jest.fn().mockImplementation(() => {
  return {
    scriptTransaction: mockPrismaScriptTransaction(),
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
jest.mock('domain/transfer/validation', () => ({
  scriptTransactionsValidator: () => mockValidator(),
}))

beforeEach(() => {
  mockValidate.mockReset()
  mockPrismaScriptTransaction.mockReset()
})

describe('scriptTransactions', () => {
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

    const { data, error } = await scriptTransactions({})
    expect(data).toBeUndefined()
    expect(error).toEqual(expectedError)
    expect(mockPrismaScriptTransaction).not.toBeCalled()
  })

  it('should create many scriptTransactions', async () => {
    mockValidate.mockImplementation((validator, params) => {
      expect(params).toEqual({ transactions: ['test'] })
      return { fields: { transactions: ['test'] } }
    })

    const mockCreateMany = jest.fn().mockImplementation(({ data }) => {
      expect(data).toEqual([{ transaction: 'test' }])

      return [{ transaction: 'test' }]
    })

    mockPrismaScriptTransaction.mockImplementation(() => ({
      createMany: (params) => mockCreateMany(params),
    }))

    const { data, error } = await scriptTransactions({ transactions: ['test'] })
    expect(data).toBeDefined()
    expect(error).toBeUndefined()
  })
})
