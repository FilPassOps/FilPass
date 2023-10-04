import { voidTransferRequest } from 'domain/transferRequest/voidTransferRequest'

const mockNewPrismaTransaction = jest.fn()
jest.mock('lib/prisma', () => ({
  newPrismaTransaction: (params) => mockNewPrismaTransaction(params),
}))

const mockValidate = jest.fn()
jest.mock('lib/yup', () => ({
  validate: (validationFn, params) => mockValidate(validationFn, params),
}))

const mockCreateRequestChangeHistory = jest.fn()
jest.mock('domain/tranferRequestHistory/createRequestChangeHistory', () => ({
  createRequestChangeHistory: (prismaFn, params) =>
    mockCreateRequestChangeHistory(prismaFn, params),
}))

jest.mock('domain/transferRequest/validation', () => ({
  voidTransferRequestValidator: jest.fn(),
}))

const mockIsVoidable = jest.fn()
jest.mock('domain/transferRequest/shared', () => ({
  isVoidable: (params) => mockIsVoidable(params),
}))

describe('voidTransferRequest', () => {
  it('should return error when validation fails', async () => {
    mockValidate.mockImplementation((_, params) => {
      expect(params.userId).toEqual(1)
      expect(params.transferRequestId).toEqual(10)

      return {
        errors: {
          teste: {
            message: 'this is required',
          },
        },
      }
    })

    const expectedError = {
      status: 400,
      errors: {
        teste: {
          message: 'this is required',
        },
      },
    }

    const { data, error } = await voidTransferRequest({ transferRequestId: 10, userId: 1 })

    expect(data).toBeUndefined()
    expect(error).toEqual(expectedError)
    expect(mockNewPrismaTransaction).not.toBeCalled()
  })

  it('should return transaction error', async () => {
    mockValidate.mockResolvedValue({ fields: {} })
    mockNewPrismaTransaction.mockResolvedValue({
      error: {
        status: 400,
        message: 'transaction error',
      },
    })

    const expectedError = {
      status: 400,
      message: 'transaction error',
    }

    const { data, error } = await voidTransferRequest({ transferRequestId: 10, userId: 1 })

    expect(data).toBeUndefined()
    expect(error).toEqual(expectedError)
  })

  it('should return transaction result', async () => {
    mockValidate.mockResolvedValue({ fields: {} })
    mockNewPrismaTransaction.mockResolvedValue({
      data: {
        id: 10,
      },
    })

    const expectedResponse = {
      id: 10,
    }

    const { data, error } = await voidTransferRequest({ transferRequestId: 10, userId: 1 })

    expect(error).toBeUndefined()
    expect(data).toEqual(expectedResponse)
  })

  it('transaction should throw error when transfer request is not found', async () => {
    mockValidate.mockResolvedValue({ fields: { transferRequestId: 10, userId: 1 } })

    const mockQueryRaw = jest.fn().mockResolvedValue([{ id: 10 }])
    const mockFindMany = jest.fn().mockResolvedValue([])
    const mockPrismaClient = {
      $queryRaw: mockQueryRaw,
      transferRequest: {
        findMany: mockFindMany,
      },
    }

    mockNewPrismaTransaction.mockImplementation(async (fn) => {
      let error
      try {
        await fn(mockPrismaClient)
      } catch (err) {
        error = err
      }

      expect(error.message).toEqual('Transfer request not found')
      expect(error.status).toEqual(404)
      return {}
    })

    await voidTransferRequest()

    expect(mockIsVoidable).not.toBeCalled()
    expect(mockQueryRaw).toBeCalled()
    expect(mockFindMany).toBeCalledWith({
      where: {
        publicId: 10,
        isActive: true,
        receiverId: 1,
      },
    })
  })

  it('transaction should throw error when user does not have permissions', async () => {
    mockValidate.mockResolvedValue({ fields: {} })

    const mockQueryRaw = jest.fn().mockResolvedValue([{ id: undefined }])
    const mockFindMany = jest.fn().mockResolvedValue([{ id: 10 }])
    const mockPrismaClient = {
      $queryRaw: mockQueryRaw,
      transferRequest: {
        findMany: mockFindMany,
      },
    }

    mockNewPrismaTransaction.mockImplementation(async (fn) => {
      let error
      try {
        await fn(mockPrismaClient)
      } catch (err) {
        error = err
      }

      expect(error.message).toEqual('Transfer request not found')
      expect(error.status).toEqual(404)
      return {}
    })

    await voidTransferRequest()

    expect(mockQueryRaw).toBeCalled()
    expect(mockFindMany).toBeCalled()
    expect(mockIsVoidable).not.toBeCalled()
  })

  it('transaction should throw error when transfer request is not voidable', async () => {
    mockValidate.mockResolvedValue({ fields: {} })

    const mockQueryRaw = jest.fn().mockResolvedValue([{ id: 2 }])
    const mockFindMany = jest.fn().mockResolvedValue([{ id: 10, status: 'TEST' }])
    const mockUpdate = jest.fn()
    const mockPrismaClient = {
      $queryRaw: mockQueryRaw,
      transferRequest: {
        findMany: mockFindMany,
        update: mockUpdate,
      },
    }

    mockNewPrismaTransaction.mockImplementation(async (fn) => {
      let error
      try {
        await fn(mockPrismaClient)
      } catch (err) {
        error = err
      }

      expect(error.message).toEqual('Transfer request is not voidable')
      expect(error.status).toEqual(400)
      return {}
    })

    mockIsVoidable.mockImplementation((param) => {
      expect(param.id).toEqual(10)
      expect(param.status).toEqual('TEST')
      return false
    })

    await voidTransferRequest()

    expect(mockUpdate).not.toBeCalled()
    expect(mockCreateRequestChangeHistory).not.toBeCalled()
  })

  it('transaction should update transfer request status', async () => {
    mockValidate.mockResolvedValue({ fields: {} })

    const mockQueryRaw = jest.fn().mockResolvedValue([{ id: 2 }])
    const mockFindMany = jest.fn().mockResolvedValue([{ id: 10, status: 'TEST' }])
    const mockUpdate = jest.fn()
    const mockPrismaClient = {
      $queryRaw: mockQueryRaw,
      transferRequest: {
        findMany: mockFindMany,
        update: mockUpdate,
      },
    }

    mockNewPrismaTransaction.mockImplementation(async (fn) => {
      const response = await fn(mockPrismaClient)
      expect(response.id).toEqual(10)
      expect(response.status).toEqual('VOIDED')
      return {}
    })

    mockIsVoidable.mockResolvedValue(true)

    await voidTransferRequest()

    expect(mockUpdate).toBeCalledWith({
      where: {
        id: 10,
      },
      data: {
        status: 'VOIDED',
      },
    })
    expect(mockCreateRequestChangeHistory).toBeCalledWith(mockPrismaClient, {
      newValue: { id: 10, status: 'VOIDED' },
      oldValue: { id: 10, status: 'TEST' },
      transferRequestId: 10,
      userRoleId: 2,
    })
  })
})
