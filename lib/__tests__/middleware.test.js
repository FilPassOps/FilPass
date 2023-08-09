import * as sentry from '@sentry/nextjs'
import jwt from 'jsonwebtoken'
import * as middlewares from 'lib/middleware'

jest.mock('luxon')
jest.mock('jsonwebtoken')
jest.mock('@sentry/nextjs')
jest.mock('iron-session/next')
jest.mock('lib/session', () => ({}))

const mockExtractRoles = jest.fn()
jest.mock('lib/auth', () => ({
  extractRoles: params => mockExtractRoles(params),
}))
const mockGetUserById = jest.fn()
jest.mock('domain/user/getUserByIdAndEmail', () => ({
  getUserByIdAndEmail: params => mockGetUserById(params),
}))

beforeEach(() => {
  mockGetUserById.mockReset()
})

describe('middlewares', () => {
  describe('newHandler', () => {
    it('withSentry function should handle handler errors', () => {
      sentry.withSentry.mockImplementation(fn => {
        return (req, res) => fn(req, res)
      })

      const thrownError = new Error('the error')

      const handler = middlewares.newHandler(() => {
        throw thrownError
      })

      const { res, mockJson, mockStatus } = getResponseMock()

      handler({}, res)

      expect(mockStatus).toBeCalledWith(500)
      expect(mockJson).toBeCalledWith({
        message: 'An unexpected error happened. Please, try again.',
      })
      expect(sentry.captureException).toBeCalledWith(thrownError)
    })
  })

  describe('withMethods', () => {
    it('should throw an error when methods argument is empty', () => {
      expect(middlewares.withMethods([], jest.fn())).toThrowError(new Error('Provide endpoint methods'))
    })

    it('should add error to response when request method is not expected', () => {
      const { res, mockJson, mockStatus } = getResponseMock()
      const handler = jest.fn()

      const wrappedHandler = middlewares.withMethods(['GET'], handler)
      wrappedHandler({ method: 'POST' }, res)

      expect(handler).not.toBeCalled()
      expect(mockJson).toBeCalledWith({ message: 'Method not supported' })
      expect(mockStatus).toBeCalledWith(405)
    })

    it('should call handler when method is expected', () => {
      const { res } = getResponseMock()
      const req = { method: 'GET' }
      const handler = jest.fn()

      const wrappedHandler = middlewares.withMethods(['GET'], handler)
      wrappedHandler(req, res)

      expect(handler).toBeCalledWith(req, res)
    })
  })

  describe('withAuthToken', () => {
    it('should return unauthorized when token is not received', () => {
      const { res, mockJson, mockStatus } = getResponseMock()
      const req = { query: {} }
      const handler = jest.fn()

      const wrappedHandler = middlewares.withAuthToken(handler)
      wrappedHandler(req, res)

      expect(handler).not.toBeCalled()
      expect(mockJson).toBeCalledWith({ message: 'Unauthorized' })
      expect(mockStatus).toBeCalledWith(401)
    })

    it('should return unauthorized when verification fails', () => {
      const { res, mockJson, mockStatus } = getResponseMock()
      const req = { query: { auth_token: 'super_secret_token' } }
      const handler = jest.fn()

      jwt.verify.mockImplementation(token => {
        expect(token).toEqual('super_secret_token')
        throw new Error('error')
      })

      const wrappedHandler = middlewares.withAuthToken(handler)
      wrappedHandler(req, res)

      expect(handler).not.toBeCalled()
      expect(mockJson).toBeCalledWith({ message: 'Unauthorized' })
      expect(mockStatus).toBeCalledWith(401)
    })

    it('should call handler when verification succeeds', () => {
      const { res } = getResponseMock()
      const req = { query: { auth_token: 'super_secret_token' } }
      const handler = jest.fn()

      jwt.verify.mockReturnValue('the_source')

      const wrappedHandler = middlewares.withAuthToken(handler)
      wrappedHandler(req, res)

      const expectedHandlerReq = {
        ...req,
        source: 'the_source',
      }

      expect(handler).toBeCalledWith(expectedHandlerReq, res)
    })
  })

  describe('withUser', () => {
    it('should return forbidden access when there is no user in session', async () => {
      const spy = jest.spyOn(middlewares, 'withSession')
      spy.mockImplementation(async fn => {
        return (req, res) => fn({ ...req, session: { destroy: jest.fn() } }, res)
      })

      const { res, mockJson, mockStatus } = getResponseMock()
      const handler = jest.fn()

      const wrappedHandler = await middlewares.withUser(handler)
      mockGetUserById.mockResolvedValue(() => ({}))
      await wrappedHandler({}, res)

      expect(handler).not.toBeCalled()
      expect(mockExtractRoles).not.toBeCalled()
      expect(mockStatus).toBeCalledWith(401)
      expect(mockJson).toBeCalledWith({ message: 'Forbidden access' })
    })
  })

  describe('withRoles', () => {
    it('should throw an error when roles argument is empty', () => {
      const handler = jest.fn()
      let error
      try {
        middlewares.withRoles([], handler)
      } catch (err) {
        error = err
      }

      expect(error).toEqual(new Error('Roles cannot be empty.'))
      expect(handler).not.toBeCalled()
    })

    it('should return error when request user does not have expected role', () => {
      const destroy = jest.fn()

      const spy = jest.spyOn(middlewares, 'withUser')
      spy.mockImplementation(fn => {
        return (req, res) =>
          fn(
            {
              ...req,
              session: {
                destroy,
              },
              user: { roles: [{ role: 'ninja' }] },
            },
            res
          )
      })

      const { res, mockJson, mockStatus } = getResponseMock()
      const handler = jest.fn()

      const wrappedHandler = middlewares.withRoles(['super_admin'], handler)
      wrappedHandler({}, res)

      expect(handler).not.toBeCalled()
      expect(destroy).toBeCalled()
      expect(mockStatus).toBeCalledWith(401)
      expect(mockJson).toBeCalledWith({ message: 'Forbidden access' })
    })

    it('should return error when request user does not have roles', () => {
      const destroy = jest.fn()

      const spy = jest.spyOn(middlewares, 'withUser')
      spy.mockImplementation(fn => {
        return (req, res) => fn({ ...req, session: { destroy }, user: {} }, res)
      })

      const { res, mockJson, mockStatus } = getResponseMock()
      const handler = jest.fn()

      const wrappedHandler = middlewares.withRoles(['super_admin'], handler)
      wrappedHandler({}, res)

      expect(handler).not.toBeCalled()
      expect(destroy).toBeCalled()
      expect(mockStatus).toBeCalledWith(401)
      expect(mockJson).toBeCalledWith({ message: 'Forbidden access' })
    })

    it('should call handler when user has expected role', () => {
      const spy = jest.spyOn(middlewares, 'withUser')
      spy.mockImplementation(fn => {
        return (req, res) => fn({ ...req, user: { roles: [{ role: 'ninja' }] } }, res)
      })

      const { res } = getResponseMock()
      const handler = jest.fn()

      const wrappedHandler = middlewares.withRoles(['ninja'], handler)
      wrappedHandler({}, res)

      const expectedHandlerReq = {
        user: { roles: [{ role: 'ninja' }] },
      }

      expect(handler).toBeCalledWith(expectedHandlerReq, res)
    })
  })

  describe('specific role middlewares', () => {
    it('withController', () => {
      const spy = jest.spyOn(middlewares, 'withRoles')
      const handler = jest.fn()

      middlewares.withController(handler)

      expect(spy).toBeCalledWith(['CONTROLLER'], handler)
    })

    it('withApprover', () => {
      const spy = jest.spyOn(middlewares, 'withRoles')
      const handler = jest.fn()

      middlewares.withApprover(handler)

      expect(spy).toBeCalledWith(['APPROVER'], handler)
    })

    it('withSuperAdmin', () => {
      const spy = jest.spyOn(middlewares, 'withRoles')
      const handler = jest.fn()

      middlewares.withSuperAdmin(handler)

      expect(spy).toBeCalledWith(['SUPERADMIN'], handler)
    })
  })
})

function getResponseMock() {
  const mockStatus = jest.fn()
  const mockJson = jest.fn()
  const res = {
    status: mockStatus,
    json: mockJson,
  }

  mockStatus.mockReturnValue(res)
  mockJson.mockReturnValue(res)
  return {
    res,
    mockStatus,
    mockJson,
  }
}
