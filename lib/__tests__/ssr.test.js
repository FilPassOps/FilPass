import * as sentry from '@sentry/nextjs'
import * as ssrMiddlewares from 'lib/ssr'

jest.mock('luxon')
jest.mock('@sentry/nextjs')
jest.mock('iron-session/next')
jest.mock('lib/session', () => ({}))
const mockGetUserById = jest.fn()
jest.mock('domain/user/getUserByIdAndEmail', () => ({
  getUserByIdAndEmail: params => mockGetUserById(params),
}))
const mockExtractRoles = jest.fn()
jest.mock('lib/auth', () => ({
  extractRoles: params => mockExtractRoles(params),
}))

describe('ssr middlewares', () => {
  describe('ssrWrapper', () => {
    it('should return redirect when handler throws an error', async () => {
      const handler = jest.fn(() => {
        throw new Error('unexpected error')
      })

      const wrappedMiddleware = ssrMiddlewares.ssrWrapper(handler)
      const response = await wrappedMiddleware({})

      const expectedResponse = {
        redirect: {
          permanent: true,
          destination: '/404',
        },
      }
      expect(response).toEqual(expectedResponse)
      expect(sentry.captureException).toBeCalledWith(new Error('unexpected error'))
    })

    it('should not return redirect when handler succeeds', async () => {
      const handler = jest.fn(() => ({ data: {} }))

      const wrappedMiddleware = ssrMiddlewares.ssrWrapper(handler)
      const response = await wrappedMiddleware({})

      const expectedResponse = {
        data: {},
      }
      expect(response).toEqual(expectedResponse)
      expect(sentry.captureException).not.toBeCalled()
    })
  })

  describe('withUserSSR', () => {
    it('should return redirect when request does not have user', async () => {
      const ssrWrapperSpy = jest.spyOn(ssrMiddlewares, 'ssrWrapper')
      ssrWrapperSpy.mockImplementation(handler => handler)

      const withSessionSSRSpy = jest.spyOn(ssrMiddlewares, 'withSessionSSR')
      withSessionSSRSpy.mockImplementation(async nextHandler => {
        return ctx =>
          nextHandler({
            ...ctx,
            req: {
              ...ctx.req,
              session: {
                destroy: jest.fn(),
              },
              url: '',
            },
          })
      })

      const handler = jest.fn()
      const wrappedHandler = await ssrMiddlewares.withUserSSR(handler)
      mockGetUserById.mockImplementation(() => ({ error: 'true' }))

      const response = await wrappedHandler({})

      const expectedResponse = {
        redirect: {
          permanent: true,
          destination: '/login',
        },
      }

      expect(handler).not.toBeCalled()
      expect(mockExtractRoles).not.toBeCalled()
      expect(response).toEqual(expectedResponse)
    })
  })

  describe('withRolesSSR', () => {
    it('should throw an error when roles argument is empty', () => {
      const handler = jest.fn()
      let error
      try {
        ssrMiddlewares.withRolesSSR([], handler)
      } catch (err) {
        error = err
      }

      expect(error).toEqual(new Error('Roles cannot be empty.'))
      expect(handler).not.toBeCalled()
    })
    it('should return not found when user does not have roles', () => {
      const spy = jest.spyOn(ssrMiddlewares, 'withUserSSR')
      spy.mockImplementation(fn => {
        return ctx => fn({ ...ctx, user: {} })
      })

      const handler = jest.fn()

      const wrappedHandler = ssrMiddlewares.withRolesSSR(['ninja'], handler)
      const response = wrappedHandler({})

      const expectedResponse = {
        notFound: true,
      }

      expect(handler).not.toBeCalled()
      expect(response).toEqual(expectedResponse)
    })

    it('should return not found when user does not have expected roles', () => {
      const spy = jest.spyOn(ssrMiddlewares, 'withUserSSR')
      spy.mockImplementation(fn => {
        return ctx => fn({ ...ctx, user: { roles: [{ role: 'super_admin' }] } })
      })

      const handler = jest.fn()

      const wrappedHandler = ssrMiddlewares.withRolesSSR(['ninja'], handler)
      const response = wrappedHandler({})

      const expectedResponse = {
        notFound: true,
      }

      expect(handler).not.toBeCalled()
      expect(response).toEqual(expectedResponse)
    })

    it('should call handler when user does have expected roles', () => {
      const spy = jest.spyOn(ssrMiddlewares, 'withUserSSR')
      spy.mockImplementation(fn => {
        return ctx => fn({ ...ctx, user: { roles: [{ role: 'ninja' }] } })
      })

      const handler = jest.fn()

      const wrappedHandler = ssrMiddlewares.withRolesSSR(['ninja'], handler)
      wrappedHandler({})

      expect(handler).toBeCalledWith({ user: { roles: [{ role: 'ninja' }] } })
    })
  })

  describe('specific role middlewares', () => {
    it('withControllerSSR', () => {
      const spy = jest.spyOn(ssrMiddlewares, 'withRolesSSR')
      const handler = jest.fn()

      ssrMiddlewares.withControllerSSR(handler)

      expect(spy).toBeCalledWith(['CONTROLLER'], handler)
    })

    it('withApproverSSR', () => {
      const spy = jest.spyOn(ssrMiddlewares, 'withRolesSSR')
      const handler = jest.fn()

      ssrMiddlewares.withApproverSSR(handler)

      expect(spy).toBeCalledWith(['APPROVER'], handler)
    })

    it('withSuperAdminSSR', () => {
      const spy = jest.spyOn(ssrMiddlewares, 'withRolesSSR')
      const handler = jest.fn()

      ssrMiddlewares.withSuperAdminSSR(handler)

      expect(spy).toBeCalledWith(['SUPERADMIN'], handler)
    })
  })
})
