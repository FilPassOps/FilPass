import { APPROVER_ROLE, CONTROLLER_ROLE } from 'domain/auth/constants'
import { updateRoles } from '../updateRoles'

const mockUserRole = jest.fn()
const mockPrismaTransaction = jest.fn()
const mockGetPrismaClient = jest.fn().mockImplementation(() => {
  return {
    userRole: mockUserRole(),
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
jest.mock('domain/roles/validation', () => ({
  updateRolesValidator: () => mockValidator(),
}))

beforeEach(() => {
  mockValidate.mockReset()
  mockPrismaTransaction.mockReset()
  mockUserRole.mockReset()
})

describe('updateRoles', () => {
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

    const { data, error } = await updateRoles({})
    expect(data).toBeUndefined()
    expect(error).toEqual(expectedError)
    expect(mockPrismaTransaction).not.toBeCalled()
  })

  it('should be able to remove roles', async () => {
    mockValidate.mockImplementation((validator, params) => {
      expect(params).toEqual({
        userId: 1,
        roles: [],
      })

      return { fields: params }
    })

    mockUserRole.mockImplementation(() => ({
      findMany: () => [{ id: 1, role: APPROVER_ROLE }],
      updateMany: () => ({ count: 1 }),
    }))

    mockPrismaTransaction.mockImplementation(async (fn) => {
      const data = await fn(mockGetPrismaClient())

      return { data }
    })

    const { data, error } = await updateRoles({
      userId: 1,
      roles: [],
    })
    expect(data).toBeDefined()
    expect(error).toBeUndefined()
  })

  it('should be able to add roles', async () => {
    mockValidate.mockImplementation((validator, params) => {
      expect(params).toEqual({
        userId: 1,
        roles: [{ value: APPROVER_ROLE }, { value: CONTROLLER_ROLE }],
      })

      return { fields: params }
    })

    mockUserRole.mockImplementation(() => ({
      findMany: () => [{ id: 2, role: CONTROLLER_ROLE }],
      createMany: () => [{ id: 1, role: APPROVER_ROLE }],
      updateMany: () => [{ id: 1, role: APPROVER_ROLE }],
    }))

    mockPrismaTransaction.mockImplementation(async (fn) => {
      const data = await fn(mockGetPrismaClient())

      return { data }
    })

    const { data, error } = await updateRoles({
      userId: 1,
      roles: [{ value: APPROVER_ROLE }, { value: CONTROLLER_ROLE }],
    })
    expect(data).toBeDefined()
    expect(error).toBeUndefined()
  })
})
