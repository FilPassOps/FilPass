import { Session } from '@prisma/client'
import prisma from 'lib/prisma'
import { maxAge } from 'lib/session'
import { DateTime } from 'luxon'

export interface GenerateSessionRequest {
  userId: number
}

export interface InvalidateSessionRequest {
  sessionId: string
}

export interface GetSessionRequest {
  sessionId: string
}

export const generateSession = async ({ userId }: GenerateSessionRequest): Promise<{ id: string }> => {
  const expires = DateTime.now().plus({ seconds: maxAge }).toISO() as string

  return await prisma.session.create({ data: { userId, expires, isValid: true }, select: { id: true } })
}

export const invalidateSession = async ({ sessionId }: InvalidateSessionRequest): Promise<{ id: string; isValid: boolean }> => {
  try {
    return await prisma.session.update({ where: { id: sessionId }, data: { isValid: false }, select: { id: true, isValid: true } })
  } catch (err) {
    console.log(err)

    return { id: sessionId, isValid: false }
  }
}

export const getSession = async ({ sessionId }: GetSessionRequest): Promise<Session | null> => {
  return await prisma.session.findUnique({ where: { id: sessionId } })
}
