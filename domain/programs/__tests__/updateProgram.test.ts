import * as yup from 'lib/yup'
import { updateProgram, UpdateProgramParams } from '../updateProgram'
import { EMAIL_DOMAIN } from 'system.config'

const mockProgram = jest.fn()
const mockPrismaTransaction = jest.fn()
const mockUserRoleProgram = jest.fn()
const mockCurrencyUnit = jest.fn()
const mockProgramCurrency = jest.fn()
const mockGetPrismaClient = jest.fn().mockImplementation(() => {
  return {
    program: mockProgram(),
    userRoleProgram: mockUserRoleProgram(),
    programCurrency: mockProgramCurrency(),
    currencyUnit: mockCurrencyUnit(),
  }
})
jest.mock('lib/prisma', () => ({
  getPrismaClient: () => mockGetPrismaClient(),
  newPrismaTransaction: (fn: any) => mockPrismaTransaction(fn),
}))
const mockValidate = jest.fn()
jest.spyOn(yup, 'validate').mockImplementation((validator: any, params: any) => mockValidate(validator, params))

const mockValidator = jest.fn()
jest.mock('domain/programs/validation', () => ({
  updateProgramValidator: () => mockValidator(),
}))
const mockProgramAssociatedRequests = jest.fn()
jest.mock('domain/programs/programAssociatedRequests', () => ({
  programAssociatedRequests: () => mockProgramAssociatedRequests(),
}))

beforeEach(() => {
  mockValidate.mockReset()
  mockPrismaTransaction.mockReset()
  mockUserRoleProgram.mockReset()
  mockProgram.mockReset()
  mockProgramCurrency.mockReset()
  mockCurrencyUnit.mockReset()
})

describe('updateProgram', () => {
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

    const { data, error } = await updateProgram({} as UpdateProgramParams)
    expect(data).toBeUndefined()
    expect(error).toEqual(expectedError)
    expect(mockPrismaTransaction).not.toBeCalled()
  })

  it('should return error when it is not possible to update a program', async () => {
    mockValidate.mockImplementation((validator, params) => {
      expect(params).toEqual({
        id: 4,
        programCurrency: [
          { name: 'USD', type: 'REQUEST' },
          { name: 'FIL', type: 'PAYMENT' },
        ],
        name: 'LINEAR VESTING USD TO FIL PROGRAM',
        approversRole: [
          {
            roleId: 6,
            value: `test-approver${EMAIL_DOMAIN}`,
            label: `test-approver${EMAIL_DOMAIN}`,
          },
        ],
      })

      return { fields: params }
    })

    mockProgram.mockImplementation(() => ({
      updateMany: () => ({ count: 0 }),
    }))

    mockPrismaTransaction.mockImplementation(async fn => {
      let error: any
      try {
        await fn(mockGetPrismaClient())
      } catch (err) {
        error = err
      }
      expect(error.message).toBe('Error updating program')
      expect(error.status).toBe(404)

      return { error: {} }
    })

    // @ts-ignore
    const { data, error } = await updateProgram({
      id: 4,
      programCurrency: [
        { name: 'USD', type: 'REQUEST' },
        { name: 'FIL', type: 'PAYMENT' },
      ],
      name: 'LINEAR VESTING USD TO FIL PROGRAM',
      approversRole: [
        {
          // @ts-ignore
          roleId: 6,
          value: `test-approver${EMAIL_DOMAIN}`,
          label: `test-approver${EMAIL_DOMAIN}`,
        },
      ],
    })
    expect(data).toBeUndefined()
    expect(error).toBeDefined()
  })

  it('should remove all approvers', async () => {})

  it('should set new approvers', async () => {})

  it('should return the updated program', async () => {
    mockValidate.mockImplementation((validator, params) => {
      return { fields: params }
    })

    mockProgram.mockImplementation(() => ({
      updateMany: () => ({ count: 1 }),
    }))
    mockUserRoleProgram.mockImplementation(() => ({
      findMany: () => [{ id: 1, roleId: 6, isActive: true }],
      updateMany: () => ({ count: 1 }),
      create: () => ({ id: 1 }),
    }))

    mockProgramAssociatedRequests.mockImplementation(() => ({ data: [] }))
    mockCurrencyUnit.mockImplementation(() => ({
      findMany: () => [{ id: 1 }],
    }))
    mockProgramCurrency.mockImplementation(() => ({
      updateMany: () => ({ count: 1 }),
    }))

    mockPrismaTransaction.mockImplementation(async fn => {
      const data = await fn(mockGetPrismaClient())

      return { data }
    })

    // @ts-ignore
    const { data, error } = await updateProgram({
      id: 4,
      programCurrency: [
        { name: 'USD', type: 'REQUEST' },
        { name: 'FIL', type: 'PAYMENT' },
      ],
      name: 'LINEAR VESTING USD TO FIL PROGRAM',
      approversRole: [
        {
          // @ts-ignore
          roleId: 6,
          value: `test-approver${EMAIL_DOMAIN}`,
          label: `test-approver${EMAIL_DOMAIN}`,
        },
      ],
    })
    expect(data).toBeDefined()
    expect(error).toBeUndefined()
  })

  it('should not update the program currency if there are associated requests', async () => {
    mockValidate.mockImplementation((validator, params) => {
      expect(params).toEqual({
        id: 4,
        programCurrency: [
          { name: 'USD', type: 'REQUEST' },
          { name: 'FIL', type: 'PAYMENT' },
        ],
        name: 'LINEAR VESTING USD TO FIL PROGRAM',
        approversRole: [
          {
            roleId: 6,
            value: `test-approver${EMAIL_DOMAIN}`,
            label: `test-approver${EMAIL_DOMAIN}`,
          },
        ],
      })

      return { fields: params }
    })

    mockProgram.mockImplementation(() => ({
      updateMany: () => ({ count: 1 }),
    }))
    mockUserRoleProgram.mockImplementation(() => ({
      findMany: () => [{ id: 1, roleId: 6, isActive: true }],
      updateMany: () => ({ count: 1 }),
      create: () => ({ id: 1 }),
    }))

    mockProgramAssociatedRequests.mockImplementation(() => ({ data: [{ publicId: 1 }] }))

    mockPrismaTransaction.mockImplementation(async fn => {
      const data = await fn(mockGetPrismaClient())

      return { data }
    })

    // @ts-ignore
    const { data, error } = await updateProgram({
      id: 4,
      programCurrency: [
        { name: 'USD', type: 'REQUEST' },
        { name: 'FIL', type: 'PAYMENT' },
      ],
      name: 'LINEAR VESTING USD TO FIL PROGRAM',
      approversRole: [
        {
          // @ts-ignore
          roleId: 6,
          value: `test-approver${EMAIL_DOMAIN}`,
          label: `test-approver${EMAIL_DOMAIN}`,
        },
      ],
    })
    expect(data).toBeDefined()
    expect(error).toBeUndefined()
  })
})
