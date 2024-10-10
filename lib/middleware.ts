import crypto from 'crypto'
import { ADDRESS_MANAGER_ROLE, SUPERADMIN_ROLE, SystemRoles } from 'domain/auth/constants'
import { getSession, invalidateSession } from 'domain/auth/session'
import { getUserByIdAndEmail } from 'domain/user/get-by-id-and-email'
import { Request, RequestHandler } from 'express'
import rateLimit from 'express-rate-limit'
import { IronSessionData } from 'iron-session'
import { withIronSessionApiRoute } from 'iron-session/next'
import jwt from 'jsonwebtoken'
import { sessionOptions } from 'lib/session'
import { DateTime } from 'luxon'
import multer from 'multer'
import { NextApiHandler, NextApiRequest, NextApiResponse } from 'next'
import { tmpdir } from 'os'
import { AnyObjectSchema } from 'yup'
import { extractRoles } from './auth'
import yup from './yup'
import { logger } from './logger'

type Methods = 'GET' | 'HEAD' | 'POST' | 'PUT' | 'DELETE' | 'CONNECT' | 'OPTIONS' | 'TRACE' | 'PATCH'

export type NextApiRequestWithSession = NextApiRequest & IronSessionData

export type SessionUser = NonNullable<IronSessionData['user']>

export type NextApiHandlerWithUser<ResponseType = any, RequestType extends NextApiRequestWithSession = NextApiRequestWithSession> = (
  req: RequestType,
  res: NextApiResponse<ResponseType>,
) => any | Promise<any>

const APP_SECRET = process.env.APP_SECRET

if (!APP_SECRET) {
  throw new Error('Please provide APP_SECRET')
}

const getIP = (request: Request) => request.socket.remoteAddress || request.ip

const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // Limit each IP to 10 login requests per `window` (here, per 5 minutes)
  message: { status: 429, errors: { password: { message: 'Too many requests from this IP, please try again after 5 minutes.' } } },
  keyGenerator: getIP,
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
})

const globalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1000, // Limit each IP to 10000 requests per `window` (here, per minute)
  keyGenerator: getIP,
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
})

export function newHandler<T>(handler: NextApiHandler<T> | NextApiHandlerWithUser<T>) {
  return async (req: NextApiRequest, res: NextApiResponse<T | { message: string }>) => {
    try {
      await handler(req, res)
    } catch (error: any) {
      logger.error('Error in handler', error)
      return res.status(error?.status ?? 500).json({ message: error?.message ?? 'An unexpected error happened. Please, try again.' })
    }
  }
}

export function withMethods<T>(methods: Methods[] = [], handler: NextApiHandlerWithUser<T> | NextApiHandler<T>) {
  return (req: NextApiRequest | NextApiRequestWithSession, res: NextApiResponse<T | { message: string }>) => {
    if (methods.length <= 0) {
      throw new Error('Provide endpoint methods')
    }

    const { method } = req
    if (!method || !methods.find(expectedMethod => expectedMethod.toUpperCase() === method.toUpperCase())) {
      res.status(405).json({ message: 'Method not supported' })
      return
    }

    return handler(req, res)
  }
}

export function withValidation<T extends AnyObjectSchema>(schema: T, handler: NextApiHandler) {
  return async function validate(request: NextApiRequest | NextApiRequestWithSession, response: NextApiResponse) {
    try {
      request.body = await schema.validate(request.body)

      return handler(request, response)
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        return response.status(422).json({ message: error.message })
      }

      return response.status(422).json({ message: 'Validation Failed' })
    }
  }
}

export const withAuthToken = (handler: NextApiHandler) => (req: NextApiRequest, res: NextApiResponse) => {
  const token = req.query.auth_token
  if (!token || typeof token !== 'string') {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  try {
    jwt.verify(token, APP_SECRET)
  } catch (error) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  return handler(req, res)
}

export function withSession<T>(handler: NextApiHandlerWithUser<T>) {
  return withIronSessionApiRoute(handler, sessionOptions)
}

export function withUser<T>(handler: NextApiHandlerWithUser<T>): NextApiHandlerWithUser<T> {
  return withSession(async (req, res) => {
    const { invalid } = await validateSession(req)
    if (invalid) {
      return await destroySession(req, res)
    }

    const user = req.session.user

    if (!user) {
      return await destroySession(req, res)
    }

    const { data, error } = await getUserByIdAndEmail({ userId: user.id, email: user.email })

    if (data?.isBanned) {
      return res.status(403).json({ message: 'Forbidden access' })
    }

    if (error || !data) {
      return await destroySession(req, res)
    }

    const extractedRoles = extractRoles(data.roles)

    const freshUser = {
      id: data.id,
      email: data.email,
      roles: data.roles?.map(role => ({ id: role.id, role: role.role })),
      terms: data.terms,
    }

    req.user = freshUser
    req.addressManagerId = extractedRoles.addressManagerId
    req.superAdminId = extractedRoles.superAdminId
    req.userRoleId = extractedRoles.userRoleId
    req.viewerId = extractedRoles.viewerId

    return handler(req, res)
  })
}

export function withRoles<T>(roles: SystemRoles[] = [], handler: NextApiHandlerWithUser<T>) {
  if (roles.length === 0) {
    throw new Error('Roles cannot be empty.')
  }

  return withUser((req, res) => {
    const hasRole = req.user?.roles?.some(userRole => roles.includes(userRole.role))
    if (!hasRole) {
      req.session.user = undefined
      req.session.destroy()
      return res.status(403).json({ message: 'Forbidden access' })
    }
    return handler(req, res)
  })
}

export const withAddressManager = (handler: NextApiHandlerWithUser) => withRoles([ADDRESS_MANAGER_ROLE], handler)

export const withSuperAdmin = (handler: NextApiHandlerWithUser) => withRoles([SUPERADMIN_ROLE], handler)

export const fileMiddleware = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, tmpdir()),
    filename: (req, file, cb) => {
      cb(null, crypto.randomUUID())
    },
  }),
}).single('file')

export const runMiddleware = (middleware: RequestHandler) => async (req: any, res: any) => {
  return new Promise((resolve, reject) => {
    middleware(req, res, result => {
      if (result instanceof Error) {
        return reject(result)
      }
      return resolve(result)
    })
  })
}

export const withFile = (handler: NextApiHandler) => async (req: NextApiRequest, res: NextApiResponse) => {
  await runMiddleware(fileMiddleware)(req, res)
  return handler(req, res)
}

export const withAuthLimiter = (handler: NextApiHandler) => async (req: NextApiRequest, res: NextApiResponse) => {
  await runMiddleware(authLimiter)(req, res)
  return handler(req, res)
}

export const withLimiter = (handler: NextApiHandler) => async (req: NextApiRequest, res: NextApiResponse) => {
  await runMiddleware(globalLimiter)(req, res)
  return handler(req, res)
}

const validateSession = async (req: NextApiRequestWithSession) => {
  const sessionId = req.session.identifier

  if (!req.session.user || !sessionId) {
    return { invalid: true }
  }

  const sessionData = await getSession({ sessionId })

  if (!sessionData) {
    return { invalid: true }
  }

  if (!sessionData.isValid) {
    return { invalid: true }
  }

  const currentTime = DateTime.now()
  const generatedTime = DateTime.fromJSDate(sessionData.expires)

  if (currentTime > generatedTime) {
    return { invalid: true }
  }

  return { invalid: false }
}

const destroySession = async (req: NextApiRequestWithSession, res: NextApiResponse) => {
  if (req.session.identifier) {
    await invalidateSession({ sessionId: req.session.identifier })
  }
  req.session.user = undefined
  req.user = undefined
  req.session.destroy()
  return res.status(401).json({ message: 'Forbidden access' })
}
