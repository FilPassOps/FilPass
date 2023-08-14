const prismaModule = require('lib/prisma')
const { TransactionError } = require('lib/errors')

const isPrismaErrorSpy = jest.spyOn(prismaModule, 'isPrismaError')
const getPrismaClientSpy = jest.spyOn(prismaModule, 'getPrismaClient')

describe('prisma lib module', () => {
  describe('newPrismaTransaction', () => {
    it('should return default error when it is a prisma error', async () => {
      isPrismaErrorSpy.mockImplementation(() => true)

      const getPrismaClientSpy = jest.spyOn(prismaModule, 'getPrismaClient')
      getPrismaClientSpy.mockImplementation(() => {
        throw new Error('error')
      })

      const { data, error } = await prismaModule.newPrismaTransaction(jest.fn())

      expect(data).toBeUndefined()
      expect(error.status).toEqual(500)
      expect(error.message).toEqual('An unexpected error happened')
      expect(isPrismaErrorSpy).toBeCalledWith(new Error('error'))
    })

    it('should return error status when it is not a prisma error', async () => {
      isPrismaErrorSpy.mockImplementation(() => false)

      getPrismaClientSpy.mockImplementation(() => {
        throw new TransactionError('error', { status: 400 })
      })

      const { data, error } = await prismaModule.newPrismaTransaction(jest.fn())

      expect(data).toBeUndefined()
      expect(error.status).toEqual(400)
      expect(isPrismaErrorSpy).toBeCalledWith(new TransactionError('error', { status: 400 }))
    })

    it('should return default error status when when it is not a prisma error and error does not have status', async () => {
      isPrismaErrorSpy.mockImplementation(() => false)

      getPrismaClientSpy.mockImplementation(() => {
        throw new TransactionError('error', {})
      })

      const { data, error } = await prismaModule.newPrismaTransaction(jest.fn())

      expect(data).toBeUndefined()
      expect(error.status).toEqual(500)
      expect(isPrismaErrorSpy).toBeCalledWith(new TransactionError('error', {}))
    })

    it('should return default error message when when it is not a prisma error and error does not have status', async () => {
      isPrismaErrorSpy.mockImplementation(() => false)

      getPrismaClientSpy.mockImplementation(() => {
        throw new TransactionError('', {})
      })

      const { data, error } = await prismaModule.newPrismaTransaction(jest.fn())

      expect(data).toBeUndefined()
      expect(error.message).toEqual('An unexpected error happened')
      expect(isPrismaErrorSpy).toBeCalledWith(new TransactionError('', {}))
    })

    it('should return error message when when it is not a prisma error', async () => {
      isPrismaErrorSpy.mockImplementation(() => false)

      getPrismaClientSpy.mockImplementation(() => {
        throw new TransactionError('error message', { status: 424 })
      })

      const { data, error } = await prismaModule.newPrismaTransaction(jest.fn())

      expect(data).toBeUndefined()
      expect(error.status).toEqual(424)
      expect(error.message).toEqual('error message')
      expect(isPrismaErrorSpy).toBeCalledWith(new TransactionError('error message', { status: 424 }))
    })

    it('should return transaction data when there is no error', async () => {
      const prismaClient = {
        $transaction: jest.fn(fn => fn(prismaClient)),
      }

      getPrismaClientSpy.mockReturnValue(prismaClient)

      const transactionFn = jest.fn().mockReturnValue({ request: { id: 10 } })

      const { data, error } = await prismaModule.newPrismaTransaction(transactionFn)

      expect(error).toBeUndefined()
      expect(data).toEqual({ request: { id: 10 } })
      expect(isPrismaErrorSpy).not.toBeCalled()
      expect(transactionFn).toBeCalledWith(prismaClient)
    })
  })
})
