import { updateUserById } from 'domain/user'
import { onboardingValidator, termsValidator } from 'domain/user/validation'
import { newHandler, NextApiHandlerWithUser, NextApiRequestWithSession, withMethods, withUser } from 'lib/middleware'
import yup, { validate } from 'lib/yup'

export interface UpdateUserRequest {
  terms?: yup.Asserts<typeof termsValidator>
  isOnboarded?: boolean
}

export interface UpdateUserResponse {
  isOnboarded: boolean
}

interface ExtendedRequest extends NextApiRequestWithSession {
  body: UpdateUserRequest
}

const handler: NextApiHandlerWithUser<UpdateUserResponse | unknown, ExtendedRequest> = async ({ user, body }, res) => {
  if (!user) {
    return res.status(403).send({ message: 'Forbidden' })
  }

  const { errors, fields } = await validate(onboardingValidator, body)

  if (errors || !fields) {
    return res.status(400).json(errors)
  }

  const { terms, isOnboarded } = fields

  const result = await updateUserById(user.id, { terms, isOnboarded })

  return res.status(200).json(result)
}

export default newHandler(withUser(withMethods(['POST'], handler)))
