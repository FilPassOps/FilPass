import { sendCreatedNotification } from 'domain/notifications/sendCreatedNotification'
import { findAllExternalPrograms } from 'domain/programs/findAll'
import { findUserTaxForm, isUserSanctioned } from 'domain/user'
import { encrypt, encryptPII } from 'lib/emissaryCrypto'
import { generateTeamHash } from 'lib/password'
import prisma from 'lib/prisma'
import yup, { validate } from 'lib/yup'
import { DateTime } from 'luxon'
import { sendSubmittedNotification } from '../notifications/sendSubmittedNotification'
import { BLOCKED_STATUS, SUBMITTED_STATUS } from './constants'
import { createTransferRequestValidatorBackend } from './validation'
import { TransferRequestStatus } from '@prisma/client'
import errorsMessages from 'wordings-and-errors/errors-messages'
import { termsValidator } from 'domain/user/validation'

interface CreateTransferRequestParams {
  amount: string
  programId: string
  userWalletId: string
  team: string
  expectedTransferDate: string
  currencyUnitId: string
  userAttachmentId?: string
  user: {
    id: number
    firstName: string
    lastName: string
    dateOfBirth: string
    countryResidence: string
    isUSResident: boolean
    terms: yup.Asserts<typeof termsValidator>
    email: string
  }
}

export async function createTransferRequest(params: CreateTransferRequestParams) {
  const { fields, errors } = await validate(createTransferRequestValidatorBackend, params)

  if (errors || !fields) {
    return {
      error: {
        status: 400,
        errors,
      },
    }
  }

  const { amount, programId, userWalletId, team, expectedTransferDate, user, currencyUnitId, userAttachmentId } = fields

  const { firstName, lastName, dateOfBirth: dateOfBirthString, countryResidence } = user
  const dateOfBirth = new Date(dateOfBirthString)

  const userWallet = await prisma.userWallet.findUnique({ where: { id: userWalletId, userId: user.id } })

  if (!userWallet) {
    return {
      error: {
        status: 400,
        errors: { userWalletId: errorsMessages.wallet_not_found.message },
      },
    }
  }

  const { data: programs } = await findAllExternalPrograms()
  const program = programs?.find(program => program.id === programId)

  if (!program) {
    return {
      error: {
        status: 400,
        errors: { programId: errorsMessages.program_not_found.message },
      },
    }
  }

  const formFile = await findUserTaxForm(user.id)
  const checkSanctionResult = await isUserSanctioned(user.id)

  let status: TransferRequestStatus = SUBMITTED_STATUS

  if (checkSanctionResult === null || checkSanctionResult.isSanctioned || !formFile?.isApproved) {
    status = BLOCKED_STATUS //BLOCKED and ON_HOLD mean the same
  }

  const [attachmentFile] = await prisma.userFile.findMany({
    where: { publicId: userAttachmentId ?? null, userId: user.id },
  })

  const transferRequest = await prisma.transferRequest.create({
    data: {
      amount: await encrypt(amount.toString()),
      userFileId: formFile?.id,
      programId,
      userWalletId,
      team: await encryptPII(team),
      teamHash: await generateTeamHash(team),
      firstName: await encryptPII(firstName),
      lastName: await encryptPII(lastName),
      dateOfBirth: dateOfBirth && (await encryptPII(DateTime.fromJSDate(dateOfBirth).toISO() as string)),
      countryResidence: await encryptPII(countryResidence),
      isUSResident: user.isUSResident,
      terms: user.terms,
      expectedTransferDate,
      receiverId: user.id,
      requesterId: user.id,
      currencyUnitId,
      attachmentId: userAttachmentId ? attachmentFile?.id : undefined,
      isSanctioned: checkSanctionResult?.isSanctioned,
      sanctionReason:
        checkSanctionResult?.isSanctioned && checkSanctionResult.sanctionReason
          ? await encryptPII(checkSanctionResult.sanctionReason)
          : null,
      status,
    },
    include: {
      wallet: true,
    },
  })

  await sendSubmittedNotification({
    programId,
    transferRequestId: transferRequest.publicId,
  })

  await sendCreatedNotification({
    email: user.email,
    transferRequestId: transferRequest.publicId,
    expectedTransferDate,
  })

  return transferRequest
}
