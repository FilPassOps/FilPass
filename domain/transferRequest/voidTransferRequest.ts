import { USER_ROLE } from 'domain/auth/constants'
import { createRequestChangeHistory } from 'domain/tranferRequestHistory/createRequestChangeHistory'
import { TransactionError } from 'lib/errors'
import { newPrismaTransaction } from 'lib/prisma'
import { validate } from 'lib/yup'
import { VOIDED_STATUS } from './constants'
import { isVoidable } from './shared'
import { voidTransferRequestValidator } from './validation'

interface VoidTransferRequestParams {
  transferRequestId: string
  userId: number
}

interface UserPermission {
  id: number
}

export async function voidTransferRequest(params: VoidTransferRequestParams) {
  const { fields, errors } = await validate(voidTransferRequestValidator, params)
  if (errors || !fields) {
    return {
      error: {
        status: 400,
        errors,
      },
    }
  }

  const { transferRequestId, userId } = fields

  const { data, error } = await newPrismaTransaction(async fnPrisma => {
    const [userPermissions, transferRequests] = await Promise.all([
      fnPrisma.$queryRaw<UserPermission[]>`
      SELECT
        user_role.id id
      FROM transfer_request
      INNER JOIN user_role ON user_role.user_id = transfer_request.receiver_id
        AND user_role.is_active = TRUE
        AND user_role.role::text = ${USER_ROLE}
      WHERE transfer_request.public_id = ${transferRequestId}
        AND transfer_request.is_active = TRUE
        AND transfer_request.receiver_id = ${userId}
    `,
      fnPrisma.transferRequest.findMany({
        where: {
          publicId: transferRequestId,
          isActive: true,
          receiverId: userId,
        },
      }),
    ])

    const [currentIteration] = transferRequests
    const [userPermission] = userPermissions

    if (!currentIteration || !userPermission.id) {
      throw new TransactionError('Transfer request not found', { status: 404, errors: undefined })
    }

    const canVoid = isVoidable(currentIteration)
    if (!canVoid) {
      throw new TransactionError('Transfer request is not voidable', { status: 400, errors: undefined })
    }

    await fnPrisma.transferRequest.update({
      where: {
        id: currentIteration.id,
      },
      data: { status: VOIDED_STATUS },
    })

    const newTransferRequestValue = {
      ...currentIteration,
      status: VOIDED_STATUS,
    }

    await createRequestChangeHistory(fnPrisma, {
      newValue: newTransferRequestValue,
      oldValue: currentIteration,
      transferRequestId: currentIteration.id,
      userRoleId: userPermission.id,
    })

    return newTransferRequestValue
  })

  if (error) {
    return {
      error,
    }
  }

  return {
    data,
  }
}
