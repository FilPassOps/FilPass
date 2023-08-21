import { updateUserOnHoldTranferRequests } from 'domain/user'
import { encryptPII } from 'lib/emissaryCrypto'
import { checkSanction } from 'lib/emissarySanctionCheck'
import { logger } from 'lib/logger'
import prisma, { newPrismaTransaction } from 'lib/prisma'

export default async function run() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        countryResidence: true,
        dateOfBirth: true,
        email: true,
        firstName: true,
        lastName: true,
      },
      where: {
        isSanctioned: null,
        isOnboarded: true,
      },
    })

    for (const { id, countryResidence, dateOfBirth, email, firstName, lastName } of users) {
      if (countryResidence && dateOfBirth && firstName && lastName) {
        const { isSanctioned, sanctionReason: sanctionReasonResult } = await checkSanction({
          countryResidence,
          dateOfBirth: new Date(dateOfBirth),
          email,
          firstName,
          lastName,
        })

        let sanctionReason = sanctionReasonResult

        if (isSanctioned === null) {
          logger.error(`SANCTION CHECK FAILED => ${id}`)
          sanctionReason = 'Sanctions check failed'
        }

        if (isSanctioned || isSanctioned === null) {
          await newPrismaTransaction(async fnPrisma => {
            await fnPrisma.user.update({
              where: {
                id: id,
              },
              data: {
                isSanctioned: true,
                sanctionReason: sanctionReason && (await encryptPII(sanctionReason)),
                isReviewedByCompliance: false,
              },
            })
            await fnPrisma.transferRequest.updateMany({
              data: {
                sanctionReason: sanctionReason && (await encryptPII(sanctionReason)),
              },
              where: {
                status: 'BLOCKED',
                isSanctioned: true,
                requesterId: id,
              },
            })
          })
          continue
        }

        await newPrismaTransaction(async fnPrisma => {
          await fnPrisma.user.update({
            where: {
              id: id,
            },
            data: {
              isSanctioned: false,
              sanctionReason: null,
            },
          })

          const updatedRequests = await updateUserOnHoldTranferRequests({
            userId: id,
            isSanctioned: false,
            sanctionReason: null,
          })

          logger.info(`SANCTION UNBLOCKED TRANSACTIONS => ${updatedRequests}`)
        })
      }
    }
  } catch (error) {
    logger.error('Failed to check sanctions', error)
  }
}
