import { updateUserTerms } from 'domain/user/update-user-terms'
import { termsValidator } from 'domain/user/validation'
import { newHandler, NextApiHandlerWithUser, NextApiRequestWithSession, withMethods, withUser } from 'lib/middleware'
import yup, { validate } from 'lib/yup'

export interface UpdateUserTermsRequest {
  terms: yup.Asserts<typeof termsValidator>
}

interface ExtendedRequest extends NextApiRequestWithSession {
  body: UpdateUserTermsRequest
}

const handler: NextApiHandlerWithUser<unknown, ExtendedRequest> = async ({ user, body }, res) => {
  if (!user) {
    return res.status(403).send({ message: 'Forbidden' })
  }

  const { errors, fields } = await validate(termsValidator, body.terms)

  if (errors || !fields) {
    return res.status(400).json(errors)
  }

  const result = await updateUserTerms(user.id, { terms: body.terms })

  return res.status(200).json(result)
}

export default newHandler(withUser(withMethods(['POST'], handler)))
