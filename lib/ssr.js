import { ADDRESS_MANAGER_ROLE, APPROVER_ROLE, COMPLIANCE_ROLE, CONTROLLER_ROLE, FINANCE_ROLE, SUPERADMIN_ROLE } from 'domain/auth/constants'
import { getSession, invalidateSession } from 'domain/auth/session'
import { findUserByIdAndEmail } from 'domain/user/findByIdAndEmail'
import { withIronSessionSsr } from 'iron-session/next'
import { extractRoles } from 'lib/auth'
import { sessionOptions } from 'lib/session'
import { DateTime } from 'luxon'

export const withSessionSSR = handler => withIronSessionSsr(handler, sessionOptions)

export const withUserSSR = handler =>
  withSessionSSR(async ({ req, ...ctx }) => {
    const { invalid } = await validateSession(req)
    if (invalid) {
      return destroySession(req)
    }

    const user = req.session?.user
    const { data, error } = await findUserByIdAndEmail({ userId: user.id, email: user.email })

    if (data.isBanned) {
      return {
        redirect: {
          destination: '/terms-condition-violation',
        },
      }
    }

    if (error) {
      return destroySession(req)
    }

    const extractedRoles = extractRoles(data.roles)

    const freshUser = {
      id: data?.id,
      email: data?.email,
      isOnboarded: data.isOnboarded,
      isSanctioned: data.isSanctioned,
      isReviewedByCompliance: data.isReviewedByCompliance,
      roles: data?.roles?.map(role => ({ id: role.id, role: role.role })),
    }

    return handler({
      req,
      user: freshUser,
      ...extractedRoles,
      ...ctx,
    })
  })

export const withRolesSSR = (roles = [], handler) => {
  if (roles.length === 0) {
    throw new Error('Roles cannot be empty.')
  }

  return withUserSSR(({ user, ...ctx }) => {
    const hasRole = user.roles?.some(userRole => roles.includes(userRole.role))
    if (!hasRole) {
      return {
        notFound: true,
      }
    }
    return handler({ user, ...ctx })
  })
}

export const withAddressManagerSSR = handler => withRolesSSR([ADDRESS_MANAGER_ROLE], handler)

export const withControllerSSR = handler => withRolesSSR([CONTROLLER_ROLE], handler)

export const withApproverSSR = handler => withRolesSSR([APPROVER_ROLE], handler)

export const withComplianceSSR = handler => withRolesSSR([COMPLIANCE_ROLE], handler)

export const withFinanceSSR = handler => withRolesSSR([FINANCE_ROLE], handler)

export const withSuperAdminSSR = handler => withRolesSSR([SUPERADMIN_ROLE], handler)

const validateSession = async req => {
  if (!req.session) {
    return { invalid: true }
  }
  const sessionId = req.session?.identifier

  if (!req.session?.user || !req.session?.identifier) {
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

const destroySession = async req => {
  req.session.user = undefined
  req.user = undefined

  if (req?.session?.identifier) {
    await invalidateSession({ sessionId: req.session.identifier })
  }

  req.session.destroy()

  return {
    redirect: {
      destination: '/login',
    },
  }
}
