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

    const totalInvalid = await prisma.creditTicket.count({
      where: {
        ticketGroup: {
          userCredit: {
            userId: userId,
            id: userCreditId,
          },
        },
        status: {
          not: CreditTicketStatus.VALID,
        },
      },
    })

    console.log('totalInvalid', totalInvalid)

    console.log('process.env.NEXT_PUBLIC_MAX_TICKETS', process.env.NEXT_PUBLIC_MAX_TICKETS)

    const availableTicketsNumber = process.env.NEXT_PUBLIC_MAX_TICKETS ? parseInt(process.env.NEXT_PUBLIC_MAX_TICKETS) - totalInvalid : 0

    console.log('availableTicketsNumber', availableTicketsNumber)

    return { data: availableTicketsNumber }
  } catch (error) {
    console.error('Error fetching available tickets number:', error)
    throw error
  }
}
