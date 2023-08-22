import { ADDRESS_MANAGER_ROLE, APPROVER_ROLE, COMPLIANCE_ROLE, CONTROLLER_ROLE, FINANCE_ROLE, SUPERADMIN_ROLE } from 'domain/auth/constants'
import { getSession, invalidateSession } from 'domain/auth/session'
import { findUserByIdAndEmail } from 'domain/user/findByIdAndEmail'
import { IncomingMessage } from 'http'
import { withIronSessionApiRoute, withIronSessionSsr } from 'iron-session/next'
import { extractRoles } from 'lib/auth'
import { DateTime } from 'luxon'
import { GetServerSidePropsContext, GetServerSidePropsResult, NextApiHandler } from 'next/types'
import { sessionOptions } from 'lib/session'
import { SessionUser } from './middleware'
import { Role } from '@prisma/client'

interface User {
  id: number
  email: string
  isOnboarded: boolean
  isSanctioned: boolean | null
  isReviewedByCompliance: boolean | null
  roles: { id: number; role: Role }[]
}

export function withSessionRoute(handler: NextApiHandler) {
  return withIronSessionApiRoute(handler, sessionOptions)
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

    const { data, error } = await findUserByIdAndEmail({ userId: user?.id, email: user?.email })

    if (error) {
      return destroySession(req)
    }

    const extractedRoles = extractRoles(data?.roles)

    const freshUser = {
      id: data?.id,
      email: data?.email,
      isOnboarded: data?.isOnboarded,
      isSanctioned: data?.isSanctioned,
      isReviewedByCompliance: data?.isReviewedByCompliance,
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

export function withControllerSSR(
  handler: (context: GetServerSidePropsContext & { user: User }) => Promise<GetServerSidePropsResult<{ [key: string]: unknown }>>,
) {
  return withRolesSSR([CONTROLLER_ROLE], handler)
}

export function withApproverSSR(
  handler: (context: GetServerSidePropsContext & { user: User }) => Promise<GetServerSidePropsResult<{ [key: string]: unknown }>>,
) {
  return withRolesSSR([APPROVER_ROLE], handler)
}

export function withComplianceSSR(
  handler: (context: GetServerSidePropsContext & { user: User }) => Promise<GetServerSidePropsResult<{ [key: string]: unknown }>>,
) {
  return withRolesSSR([COMPLIANCE_ROLE], handler)
}

export function withFinanceSSR(
  handler: (context: GetServerSidePropsContext & { user: User }) => Promise<GetServerSidePropsResult<{ [key: string]: unknown }>>,
) {
  return withRolesSSR([FINANCE_ROLE], handler)
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
      destination: '/login',
      permanent: false,
    },
  } as GetServerSidePropsResult<{ [key: string]: unknown }>
}
