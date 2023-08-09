import { generateIdentifier } from 'domain/payment/generateIdentifier'
import { decryptPII } from 'lib/emissaryCrypto'
import { TransactionError } from 'lib/errors'
import { newPrismaTransaction } from 'lib/prisma'
import { validate } from 'lib/yup'
import { createTransfersValidator } from './validation'

export async function createOrUpdateTransfers(params) {
  const { fields, errors } = await validate(createTransfersValidator, params)
  if (errors) {
    return {
      error: {
        status: 400,
        errors,
      },
    }
  }

  const { requests, controllerId } = fields

  return newPrismaTransaction(async prisma => {
    const transferRequests = await prisma.transferRequest.findMany({
      where: {
        publicId: { in: requests },
        isActive: true,
      },
      include: {
        wallet: true,
        receiver: true,
        transfers: true,
      },
    })

    if (transferRequests.length < 1) {
      throw new TransactionError('Transfer requests not found', { status: 404 })
    }

    await Promise.all(
      transferRequests.map(async request => {
        const [transfer] = request.transfers

        if (transfer?.id) {
          return prisma.transfer.update({
            where: {
              id: transfer.id,
            },
            data: {
              updatedAt: new Date().toISOString(),
            },
          })
        }

        const receiverEmail = await decryptPII(request.receiver.email)

        const transferRef = generateIdentifier({
          address: request.wallet.address,
          amount: request.amount,
          createdAt: request.createdAt,
          email: receiverEmail,
        })
        return prisma.transfer.create({
          data: {
            controllerId,
            transferRequestId: request.id,
            transferRef,
          },
        })
      })
    )
  })
}
