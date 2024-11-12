import prisma from 'lib/prisma'
import { getAvailableTicketsNumberValidator } from './validation'
import { CreditTicketStatus } from '@prisma/client'

interface GetAvailableTicketsNumberProps {
  userId: number
  userCreditId: number
}

export async function getAvailableTicketsNumber(props: GetAvailableTicketsNumberProps) {
  try {
    const { userId, userCreditId } = await getAvailableTicketsNumberValidator.validate(props)

    const totalValid = await prisma.creditTicket.count({
      where: {
        ticketGroup: {
          userCredit: {
            userId: userId,
            id: userCreditId,
          },
        },
        status: CreditTicketStatus.VALID,
      },
    })

    const availableTicketsNumber = process.env.NEXT_PUBLIC_MAX_TICKETS ? parseInt(process.env.NEXT_PUBLIC_MAX_TICKETS) - totalValid : 0

    return { data: availableTicketsNumber }
  } catch (error) {
    console.error('Error fetching available tickets number:', error)
    throw error
  }
}
