import { SUBMITTED_BY_APPROVER_STATUS, SUBMITTED_STATUS } from 'domain/transferRequest/constants'
import { REQUIRES_CHANGES } from 'domain/transferRequestReview/constants'
import * as deleteWalletModule from 'domain/wallet/deleteWallet'
import * as prismaLib from 'lib/prisma'
import errorsMessages from 'wordings-and-errors/errors-messages'

jest.mock('lib/prisma')
jest.mock('lib/emissaryCrypto')

const mockValidate = jest.fn()
jest.mock('lib/yup', () => ({
  validate: (validator, params) => mockValidate(validator, params),
}))

const mockValidator = jest.fn()
jest.mock('domain/wallet/validation', () => ({
  deleteWalletValidator: () => mockValidator(),
}))

beforeEach(() => {
  mockValidate.mockReset()
})

describe('deleteWallet', () => {
  it('should return error when validation fails', async () => {
    const validateWalletSpy = jest.spyOn(deleteWalletModule, 'validateWalletTransferRequests')

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

    const { data, error } = await deleteWalletModule.deleteWallet({}, {})
    expect(data).toBeUndefined()
    expect(error).toEqual(expectedError)
    expect(validateWalletSpy).not.toBeCalled()
    validateWalletSpy.mockRestore()
  })

  it('should return error when wallet transfer request validation fails', async () => {
    const validateWalletSpy = jest.spyOn(deleteWalletModule, 'validateWalletTransferRequests')
    validateWalletSpy.mockImplementation(() => 'validation error')

    prismaLib.getPrismaClient.mockReturnValue({})

    mockValidate.mockReturnValue({ fields: { id: 1, userId: 2 } })

    const { data, error } = await deleteWalletModule.deleteWallet({})

    expect(data).toBeUndefined()
    expect(error.status).toEqual(400)
    expect(error.message).toEqual('validation error')

    expect(validateWalletSpy).toBeCalledWith({}, 2, 1)
    validateWalletSpy.mockRestore()
  })

  it('should return that wallet was deactivated', async () => {
    const validateWalletSpy = jest.spyOn(deleteWalletModule, 'validateWalletTransferRequests')
    validateWalletSpy.mockImplementation(() => undefined)

    mockValidate.mockImplementation((validator, params) => {
      return { fields: params }
    })

    const mockUpdateMany = jest.fn(({ data, where }) => {
      expect(where.userId).toEqual(8)
      expect(where.id).toEqual(1)
      expect(data.isActive).toEqual(false)

      return data
    })

    prismaLib.getPrismaClient.mockReturnValue({
      userWallet: {
        updateMany: mockUpdateMany,
      },
    })

    const requestParams = {
      id: 1,
      userId: 8,
    }

    const expectedResponse = {
      isActive: false,
    }

    const { data, error } = await deleteWalletModule.deleteWallet(requestParams)

    expect(data).toEqual(expectedResponse)
    expect(error).toBeUndefined()
    validateWalletSpy.mockRestore()
  })

  describe('validateWalletTransferRequests', () => {
    it('should return undefined when no transfer request is found', async () => {
      const findMany = jest.fn(() => [])
      const prisma = {
        transferRequest: {
          findMany,
        },
      }

      const error = await deleteWalletModule.validateWalletTransferRequests({ prisma, userId: 1, userWalletId: 2 })

      expect(error).toBeUndefined()
      expect(findMany).toBeCalledWith({
        where: {
          receiverId: 1,
          userWalletId: 2,
          status: {
            in: [SUBMITTED_STATUS, SUBMITTED_BY_APPROVER_STATUS, REQUIRES_CHANGES],
          },
        },
        select: {
          publicId: true,
        },
      })
    })

    it('should return error message with multiple ids when multiple requests are found', async () => {
      const prisma = {
        transferRequest: {
          findMany: jest.fn().mockReturnValue([{ publicId: 1 }, { publicId: 2 }]),
        },
      }

      const error = await deleteWalletModule.validateWalletTransferRequests({ prisma, userId: 1, userWalletId: 2 })

      expect(error).toEqual(errorsMessages.wallet_has_active_transfer_request.message([1, 2]))
    })

    it('should return error message with single id when a single request is found', async () => {
      const prisma = {
        transferRequest: {
          findMany: jest.fn().mockReturnValue([{ publicId: 1 }]),
        },
      }

      const error = await deleteWalletModule.validateWalletTransferRequests({ prisma, userId: 1, userWalletId: 2 })

      expect(error).toEqual(errorsMessages.wallet_has_active_transfer_request.message([1]))
    })
  })
})
