import prisma from 'lib/prisma'
import { getAvailableTokenNumberValidator } from './validation'

interface GetAvailableTokenNumberProps {
  userId: number
  userCreditId: number
}

export async function getAvailableTokenNumber(props: GetAvailableTokenNumberProps) {
  try {
    const { userId, userCreditId } = await getAvailableTokenNumberValidator.validate(props)

    const total = await prisma.creditToken.count({
      where: {
        splitGroup: {
          userCredit: {
            userId: userId,
            id: userCreditId,
          },
        },
      },
    })

    const totalRedeemedInvalid = await prisma.creditToken.count({
      where: {
        splitGroup: {
          userCredit: {
            userId: userId,
            id: userCreditId,
          },
        },
        OR: [{ redeemable: false }, { valid: false }],
      },
    })

    const availableTokenNumber = process.env.NEXT_PUBLIC_MAX_SPLITS
      ? parseInt(process.env.NEXT_PUBLIC_MAX_SPLITS) - (total - totalRedeemedInvalid)
      : 0

    return { data: availableTokenNumber }
  } catch (error) {
    console.error('Error fetching available token number:', error)
    throw error
  }
}
