import prisma from 'lib/prisma'
import { getUserCreditById } from './get-user-credit-by-id'
import { createTicketsValidatorBackend } from './validation'
import { sign } from 'lib/jwt'
import { ethers } from 'ethers'
import { logger } from 'lib/logger'
import { getAvailableTicketsNumber } from './get-available-tickets-number'
import { MIN_CREDIT_PER_TICKET } from './constants'
import { v1 as uuidv1 } from 'uuid'
import { parseUnits } from 'ethers/lib/utils'
import { AppConfig } from 'config/system'

const ONE_HOUR_TIME = 1 * 60 * 60 * 1000

interface CreateTicketsParams {
  id: number
  userId: number
  splitNumber: number
  creditPerTicket: number
}

export const createTickets = async (props: CreateTicketsParams) => {
  try {
    const fields = await createTicketsValidatorBackend.validate(props)

    const { data, error } = await getUserCreditById({ id: fields.id, userId: fields.userId })

    if (!data || error || !data.totalRefunds || !data.totalWithdrawals || !data.withdrawExpiresAt || !data.totalHeight) {
      throw new Error('User credit not found')
    }

    if (data.withdrawExpiresAt < new Date()) {
      throw new Error('Withdrawal expired')
    }

    if (!data.contract) {
      throw new Error('Contract not found')
    }

    const { token } = AppConfig.network.getFilecoin()

    if (!token) {
      throw new Error('FIL token not found')
    }

    const currentHeight = ethers.BigNumber.from(data.totalWithdrawals).add(data.totalRefunds)
    const totalHeight = ethers.BigNumber.from(data.totalHeight!)
    const remaining = totalHeight.sub(currentHeight)
    const creditPerTicket = parseUnits(fields.creditPerTicket.toString(), token.decimals)

    const { data: availableTicketsNumber } = await getAvailableTicketsNumber({ userId: fields.userId, userCreditId: data.id })

    if (availableTicketsNumber < fields.splitNumber) {
      throw new Error('Not enough available tickets')
    }

    if (creditPerTicket.lt(MIN_CREDIT_PER_TICKET)) {
      throw new Error('Credit per ticket is too low')
    }

    if (creditPerTicket.gt(remaining)) {
      throw new Error('Credit per ticket cannot exceed available credits')
    }

    if (ethers.BigNumber.from(fields.splitNumber).mul(creditPerTicket).gt(remaining)) {
      throw new Error('Total credits exceed available credits')
    }

    // TODO: check to set it at a fixed time
    const expirationDateTime = new Date(data.withdrawExpiresAt.getTime() - ONE_HOUR_TIME).getTime()
    const issuedAt = Math.floor(Date.now() / 1000)

    const ticketGroup = await prisma.ticketGroup.create({
      data: {
        userCreditId: data.id,
        expiresAt: data.withdrawExpiresAt,
      },
    })

    const creditPerTicketAmount = parseUnits(fields.creditPerTicket.toString(), token.decimals)

    const tickets = Array(fields.splitNumber)
      .fill(null)
      .map((_, index) => {
        const ticketHeight = creditPerTicketAmount.mul(index + 1).add(currentHeight)

        const ticketAmount = ticketHeight.sub(currentHeight)

        const publicId = uuidv1()

        return {
          ticketGroupId: ticketGroup.id,
          height: ticketHeight.toString(),
          amount: creditPerTicketAmount.toString(),
          approximatedHeight: ticketHeight.toBigInt(),
          publicId,
          token: sign(
            {
              iss: `${process.env.NEXT_PUBLIC_APP_URL}/.well-known/jwks.json`,
              jti: publicId,
              exp: expirationDateTime,
              iat: issuedAt,
              ticket_type: 'filpass',
              ticket_version: '1',
              funder: data.contract.deployedFromAddress,
              sub: data.contract.address,
              aud: data.receiver.walletAddress,
              ticket_lane: 0,
              lane_total_amount: ticketHeight.toString(),
              lane_guaranteed_amount: ticketAmount.toString(),
              lane_guaranteed_until: data.withdrawExpiresAt?.getTime(),
            },
            process.env.PRIVATE_KEY as string,
            {
              keyid: '1234',
              algorithm: 'RS256',
            },
          ),
        }
      })

    const createdTickets = await prisma.creditTicket.createMany({
      data: tickets,
    })

    return createdTickets
  } catch (error) {
    logger.error('Error creating tickets', error)
    throw error
  }
}
