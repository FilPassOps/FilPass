import prisma from 'lib/prisma'
import { getTicketsByTicketGroupIdValidator } from './validation'
import { CreditTicketStatus } from '@prisma/client'

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

    const group = await prisma.ticketGroup.findUnique({
      where: {
        id: ticketGroupId,
      },
    })

    const creditTickets = await prisma.creditTicket.findMany({
      select: {
        id: true,
        height: true,
        amount: true,
        createdAt: true,
        status: true,
        publicId: true,
        token: true,
        ticketGroupId: true,
      },
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

    const totalRedeemed = await prisma.creditTicket.count({
      where: {
        ticketGroup: {
          id: ticketGroupId,
          userCredit: {
            userId: userId,
            id: userCreditId,
          },
        },
        status: CreditTicketStatus.REDEEMED,
      },
    })

    return {
      data: { creditTickets, total, totalRedeemed, expired: group?.expired, expiresAt: group?.expiresAt, createdAt: group?.createdAt },
    }
  } catch (error) {
    console.error('Error fetching tickets by ticket group:', error)
    throw error
  }
}
