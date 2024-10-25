import prisma from 'lib/prisma'
import { getTicketsByTicketGroupIdValidator } from './validation'

interface GetTicketsByTicketGroupIdProps {
  ticketGroupId: number
  userId: number
  userCreditId: string
  pageSize: number
  page: number
}

export async function getTicketsByTicketGroupId(props: GetTicketsByTicketGroupIdProps) {
  try {
    const { ticketGroupId, userId, userCreditId, pageSize, page } = await getTicketsByTicketGroupIdValidator.validate(props)
    const currentPage = page - 1 < 0 ? 0 : page - 1

    const creditTickets = await prisma.creditTicket.findMany({
      where: {
        ticketGroup: {
          id: ticketGroupId,
          userCredit: {
            userId: userId,
            id: userCreditId,
          },
        },
      },
      take: pageSize,
      skip: pageSize * currentPage,
      orderBy: {
        id: 'asc',
      },
    })

    const total = await prisma.creditTicket.count({
      where: {
        ticketGroup: {
          id: ticketGroupId,
          userCredit: {
            userId: userId,
            id: userCreditId,
          },
        },
      },
    })

    const totalRedeemedInvalid = await prisma.creditTicket.count({
      where: {
        ticketGroup: {
          id: ticketGroupId,
          userCredit: {
            userId: userId,
            id: userCreditId,
          },
        },
        OR: [{ redeemable: false }, { valid: false }],
      },
    })

    return { data: { creditTickets, total, totalRedeemedInvalid } }
  } catch (error) {
    console.error('Error fetching tickets by ticket group:', error)
    throw error
  }
}
