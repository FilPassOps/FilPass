import { Prisma, PrismaClient } from '@prisma/client'
import { captureException } from '@sentry/nextjs'
import { transferMiddleware, transferRequestMiddleware, userMiddleware } from 'prisma/middleware'

// add prisma to the NodeJS global type
interface CustomNodeJsGlobal extends Global {
  prisma: PrismaClient
}

// Prevent multiple instances of Prisma Client in development
declare const global: CustomNodeJsGlobal

const prisma = global.prisma || new PrismaClient()

if (!global.prisma) {
  prisma.$use(async (params, next) => {
    if (params.model === 'User') {
      return await userMiddleware(params, next)
    }
    if (params.model === 'TransferRequest') {
      return await transferRequestMiddleware(params, next)
    }
    if (params.model === 'Transfer') {
      return await transferMiddleware(params, next)
    }

    return await next(params)
  })
}

if (process.env.IS_DEV === 'true') global.prisma = prisma

/**
 * @deprecated you can now just import prisma
 * @example import prisma from 'lib/prisma'
 */
export function getPrismaClient(): PrismaClient {
  return prisma
}

/**
 * Creates an Interactive transactions https://www.prisma.io/docs/guides/performance-and-optimization/prisma-client-transactions-guide#interactive-transactions
 * @param fn
 * @returns
 */
export async function newPrismaTransaction(fn: (transaction: Prisma.TransactionClient) => unknown) {
  try {
    const data = await prisma.$transaction(async transaction => await fn(transaction), {
      maxWait: 5000, // 5 seconds
      timeout: 10000, // 10 seconds
    })
    return { data }
  } catch (error: any) {
    reportTransactionException(error)

    if (isPrismaError(error)) {
      console.log('Unexpected error executing prisma transaction. ', error)
      return {
        error: {
          status: 500,
          message: 'An unexpected error happened',
        },
      }
    }

    const { status = 500, ...rest } = error
    return {
      error: {
        status,
        message: error.message || 'An unexpected error happened',
        ...rest,
      },
    }
  }
}

export function reportTransactionException(error: any) {
  if (!error.status || error.status >= 500 || error.status < 400) {
    captureException(error)
  }
}

export function isPrismaError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError ||
    error instanceof Prisma.PrismaClientUnknownRequestError ||
    error instanceof Prisma.PrismaClientRustPanicError ||
    error instanceof Prisma.PrismaClientInitializationError ||
    error instanceof Prisma.PrismaClientValidationError
  )
}

export default prisma
