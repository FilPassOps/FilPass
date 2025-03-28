import { Role } from '@prisma/client'
import { ADDRESS_MANAGER_ROLE, SUPERADMIN_ROLE } from 'domain/auth/constants'
import { getSession, invalidateSession } from 'domain/auth/session'
import { getUserByIdAndEmail } from 'domain/user/get-by-id-and-email'
import { IncomingMessage } from 'http'
import { withIronSessionSsr } from 'iron-session/next'
import { extractRoles } from 'lib/auth'
import { sessionOptions } from 'lib/session'
import { DateTime } from 'luxon'
import { GetServerSidePropsContext, GetServerSidePropsResult } from 'next/types'
import { SessionUser } from './middleware'

interface User {
  id: number
  email: string
  roles: { id: number; role: Role }[]
}

export function withSessionSSR<P extends { [key: string]: unknown }>(
  handler: (context: GetServerSidePropsContext) => GetServerSidePropsResult<P> | Promise<GetServerSidePropsResult<P>>,
) {
  return withIronSessionSsr(handler, sessionOptions)
}

export function withUserSSR(
  handler: (
    context: GetServerSidePropsContext & { user: User },
  ) => GetServerSidePropsResult<{ [key: string]: unknown }> | Promise<GetServerSidePropsResult<{ [key: string]: unknown }>>,
) {
  return withSessionSSR(async ({ req, ...rest }) => {
    const { invalid } = await validateSession(req)
    if (invalid) {
      return destroySession(req)
    }

    if (!req.session?.user) {
      return destroySession(req)
    }

    const user: SessionUser = req.session?.user

    const { data, error } = await getUserByIdAndEmail({ userId: user?.id, email: user?.email })

    if (error || !data) {
      return destroySession(req)
    }

    if (data.isBanned) {
      return {
        redirect: {
          destination: '/terms-condition-violation',
          permanent: false,
        },
      }
    }

    const extractedRoles = extractRoles(data?.roles)

    const freshUser = {
      id: data?.id,
      email: data?.email,
      roles: data?.roles?.map(role => ({ id: role.id, role: role.role })),
    }

    return handler({
      req,
      user: freshUser,
      ...extractedRoles,
      ...rest,
    })
  })
}

export function withRolesSSR(
  roles: string[],
  handler: (context: GetServerSidePropsContext & { user: User }) => Promise<GetServerSidePropsResult<{ [key: string]: unknown }>>,
) {
  if (roles.length === 0) {
    throw new Error('Roles cannot be empty.')
  }

  return withUserSSR(({ user, ...ctx }) => {
    const hasRole = user?.roles?.some(userRole => roles.includes(userRole.role))
    if (!hasRole) {
      return {
        notFound: true,
      }
    }
    return handler({ user, ...ctx })
  })
}

export function withAddressManagerSSR(
  handler: (context: GetServerSidePropsContext & { user: User }) => Promise<GetServerSidePropsResult<{ [key: string]: unknown }>>,
) {
  return withRolesSSR([ADDRESS_MANAGER_ROLE], handler)
}

export function withSuperAdminSSR(
  handler: (context: GetServerSidePropsContext & { user: User }) => Promise<GetServerSidePropsResult<{ [key: string]: unknown }>>,
) {
  return withRolesSSR([SUPERADMIN_ROLE], handler)
}

const validateSession = async (req: IncomingMessage & { cookies: Partial<{ [key: string]: string }> }) => {
  if (!req.session) {
    return { invalid: true }
  }
  const sessionId = req.session?.identifier

  if (!req.session?.user || !req.session?.identifier || !sessionId) {
    return { invalid: true }
  }

  const sessionData = await getSession({ sessionId })

  if (!sessionData) {
    return { invalid: true }
  }

  const currentTime = DateTime.now()
  const generatedTime = DateTime.fromJSDate(sessionData.expires)

  if (currentTime > generatedTime) {
    return { invalid: true }
  }

  return { invalid: false }
}

async function destroySession(
  req: IncomingMessage & { user?: SessionUser },
): Promise<GetServerSidePropsResult<{ [key: string]: unknown }>> {
  req.session.user = undefined
  req.user = undefined

  if (req?.session?.identifier) {
    await invalidateSession({ sessionId: req.session.identifier })
  }

  req.session.destroy()

  return {
    redirect: {
      destination: '/',
      permanent: false,
    },
  } as GetServerSidePropsResult<{ [key: string]: unknown }>
}
