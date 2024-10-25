import prisma from 'lib/prisma'
import { getAvailableTicketsNumberValidator } from './validation'

interface GetAvailableTicketsNumberProps {
  userId: number
  userCreditId: number
}

export async function getAvailableTicketsNumber(props: GetAvailableTicketsNumberProps) {
  try {
    const { userId, userCreditId } = await getAvailableTicketsNumberValidator.validate(props)

    const total = await prisma.creditTicket.count({
      where: {
        splitGroup: {
          userCredit: {
            userId: userId,
            id: userCreditId,
          },
        },
      },
    })

    const totalRedeemedInvalid = await prisma.creditTicket.count({
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

    const availableTicketsNumber = process.env.NEXT_PUBLIC_MAX_SPLITS
      ? parseInt(process.env.NEXT_PUBLIC_MAX_SPLITS) - (total - totalRedeemedInvalid)
      : 0

    return { data: availableTicketsNumber }
  } catch (error) {
    console.error('Error fetching available tickets number:', error)
    throw error
  }
}
