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

const temporaryTestPrivateKey = `-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEAr5Rsblt8pjtnV0yyw0ySUUlnCKWC2kBNDFlz30v5AFVytoCu
lh/ntbB4G4tEOXqnVFBq1CrTH0g2EahvN1SZTbavlaDCryZODPam2bHy0jH/Unm2
sgJx4+xdVYjIlFhZRGoU+A1MuskAsElD8mFefWEEVIK3TUqiGny+kLmEtXUDJGhJ
kYilhXeMKJbVDgZhJuCsLLgWFv3gmfRA749VNWMBEqmEUR+G//NYXoumeFH8hkli
1Q7lwx/tu7f9eHbEwfT9NeWXGT1uwer16aXTMMIhcZbfAzEKp+0d093OGMsHuTVR
fM5xy38+1TD+yQ5AvEsR0LMapDt89A3SDiaXKwIDAQABAoIBAQCDF+qtqxkydIAA
Kn/+WZmVn5ySVCGTGxdr9Q4S1wKfQS1ZHlM8O64hdhT3W9Agqnds+G4K476mSKA2
JvCC+2NLJu+KZHF3nL4B59dECx0l27aqub2ywyiN6Nj3GB3KxPxBnILzgdqcS597
//f/bLvEGT/GaaK6ztKhvCn8nMd9QxfTEEj9xTHXZdprlf+EWEZb+fl0dUIfCHVY
p8CFN6XW6wklrJiMgfe/uqTB5sZTYdZQqSbggHJTuYjXGh8I8lUHh3RRAvojIjBb
Ln2z5DS5MJizvN6v4FVHl1V9ngThsR990U5kluD3AyBx8txSAp/CTsJbDmP0vnzE
pi0TV16BAoGBANnwnYV1XBWWsGcASLvRcVx+cndTE0ZWlxtvxs2O5PmNzZ9bBcbc
PcdNsufi5mEtlTWJbwILcS/++/K7M3S1+3vqgsWo+Zr+Eu9MfjzVW0xbrMPy5lXm
E3EiYiFmq7qoWacg5UVw9Nlygt/w99zNF/g65izfe7u22/04Xni32tuRAoGBAM4+
BlhN5/cu9m4/eBU01xdtmlrcn0X3d8LLT0iTqecOj4rwmAJiY98eqXguaA7Zeskb
9A7UKrOMCTY+N0gO67cIjy5HAiajwTzcnyxf4/B27QzHFrr6l1jQ1cYC6PGkxVSL
63MqJUeqA8K/4GlMg/3anRnLWv5lQESZE8TEtFD7AoGAR6/K0JxS5tMDQU4pnoX9
CNSa6D8ORwOyfpbcyL6o+KE5MqKpGslVFNqs73OGHg71Vn/XYM/MsmHoE+aZvVki
2JbB3yx+tgm+xrHdkDsJ5er9wBKEy1p7qKoLpzrzX9mCa+P5JkdKcsAk5m6HyTw5
FzCgh8AXHh6+6+L/yCuJtNECgYAD3hvmWgeolgPfC2eoFiaWdOK5I3wFJt/jEkb5
WHOONrKwa1SebtPqojuRWmVvKdronJKWGJp4ZX7iuoX03vrCovF0b7Z1nQqJpqWB
gobWwpQtcipV9U8TRk9L+FAAABQHQtx2e2rZjjGl3E1MDDhJcWkSy8J4FNQAtVIu
lXXAMwKBgQCZVuzNRlbHOjuEtoLYuxqJm0ItDX9HvtUPCPEKWAz4CeaV45XNQGLK
5qnyiDF5l9a6/N156Jnnz8Ezf+XtSJ7E0K1rJxf+PaKYjdYbAws3J0iB36BPaIVY
U/K1B7GepJAOwUZpHJSM6+gn1WGDGTAOt/nsrqKFpJHhUU9S5+nfRg==
-----END RSA PRIVATE KEY-----`

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

    if (!data || error || !data.totalRefunds || !data.totalSubmitTicket || !data.submitTicketExpiresAt || !data.totalHeight) {
      throw new Error('User credit not found')
    }

    if (data.submitTicketExpiresAt < new Date()) {
      throw new Error('Submit ticket expired')
    }

    if (!data.contract) {
      throw new Error('Contract not found')
    }

    const { token } = AppConfig.network.getFilecoin()

    if (!token) {
      throw new Error('FIL token not found')
    }

    const currentHeight = ethers.BigNumber.from(data.totalSubmitTicket).add(data.totalRefunds)
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
    const expirationDateTime = new Date(data.submitTicketExpiresAt.getTime() - ONE_HOUR_TIME).getTime()
    const issuedAt = Math.floor(Date.now() / 1000)

    const ticketGroup = await prisma.ticketGroup.create({
      data: {
        userCreditId: data.id,
        expiresAt: data.submitTicketExpiresAt,
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
              lane_guaranteed_until: data.submitTicketExpiresAt?.getTime(),
            },
            temporaryTestPrivateKey,
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
