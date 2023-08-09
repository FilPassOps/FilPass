import { createProgram } from '../createProgram'

const mockProgram = jest.fn()
const mockPrismaTransaction = jest.fn()
const mockUserRoleProgram = jest.fn()
const mockUserRoleProgramGroup = jest.fn()
const mockUserRoleProgramGroupMembers = jest.fn()
const mockGetPrismaClient = jest.fn().mockImplementation(() => {
  return {
    program: mockProgram(),
    userRoleProgram: mockUserRoleProgram(),
    userRoleProgramGroup: mockUserRoleProgramGroup(),
    userRoleProgramGroupMembers: mockUserRoleProgramGroupMembers(),
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
jest.mock('domain/programs/validation', () => ({
  createProgramValidator: () => mockValidator(),
}))

const mockValidateWallet = jest.fn()
jest.mock('lib/filecoinApi', () => ({
  validateWallet: params => mockValidateWallet(params),
}))

beforeEach(() => {
  mockValidate.mockReset()
  mockPrismaTransaction.mockReset()
  mockUserRoleProgram.mockReset()
  mockProgram.mockReset()
  mockValidateWallet.mockReset()
})

describe('createProgram', () => {
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

    const { data, error } = await createProgram({})
    expect(data).toBeUndefined()
    expect(error).toEqual(expectedError)
    expect(mockPrismaTransaction).not.toBeCalled()
  })

  it('should return error when is not possible to create a program', async () => {
    mockValidate.mockImplementation((validator, params) => {
      expect(params).toEqual({
        name: 'test',
        deliveryMethod: 'ONE_TIME',
        approversRole: [{ roleId: 1 }],
        programCurrency: [{ name: 'test', type: 'REQUEST' }],
      })

      return { fields: params }
    })

    mockProgram.mockImplementation(() => ({
      create: () => null,
    }))

    mockPrismaTransaction.mockImplementation(async fn => {
      let error
      try {
        await fn(mockGetPrismaClient())
      } catch (err) {
        error = err
      }
      expect(error.message).toBe('Error creating program')
      expect(error.status).toBe(500)

      return { error: {} }
    })

    const { data, error } = await createProgram({
      name: 'test',
      deliveryMethod: 'ONE_TIME',
      approversRole: [{ roleId: 1 }],
      programCurrency: [{ name: 'test', type: 'REQUEST' }],
    })
    expect(data).toBeUndefined()
    expect(error).toBeDefined()
    expect(mockPrismaTransaction).toBeCalled()
  })

  it('should return the created program', async () => {
    mockValidate.mockImplementation((validator, params) => {
      expect(params).toEqual({
        name: 'test',
        deliveryMethod: 'ONE_TIME',
        approversRole: [[{ roleId: 1 }]],
        programCurrency: [{ name: 'test', type: 'REQUEST' }],
      })

      return { fields: params }
    })

    mockProgram.mockImplementation(() => ({
      create: () => ({ id: 1 }),
    }))

    mockUserRoleProgram.mockImplementation(() => ({
      create: () => ({ id: 1 }),
    }))

    mockUserRoleProgramGroup.mockImplementation(() => ({
      create: () => ({ id: 1 }),
    }))

    mockUserRoleProgramGroupMembers.mockImplementation(() => ({
      createMany: () => ({ count: 1 }),
    }))

    mockPrismaTransaction.mockImplementation(async fn => {
      const data = await fn(mockGetPrismaClient())
      return { data }
    })

    const { data, error } = await createProgram({
      name: 'test',
      deliveryMethod: 'ONE_TIME',
      approversRole: [[{ roleId: 1 }]],
      programCurrency: [{ name: 'test', type: 'REQUEST' }],
    })
    expect(data).toBeDefined()
    expect(error).toBeUndefined()
    expect(mockPrismaTransaction).toBeCalled()
    expect(mockUserRoleProgram).toBeCalled()
    expect(mockProgram).toBeCalled()
  })
})
