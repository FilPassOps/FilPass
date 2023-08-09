import { updateUserTaxInfoById } from 'domain/user'
import { taxFormValidator } from 'domain/user/validation'
import { newHandler, NextApiHandlerWithUser, NextApiRequestWithSession, withMethods, withUser } from 'lib/middleware'
import yup, { validate } from 'lib/yup'

export interface UpdateUserTaxInfoRequest {
  taxForm: yup.Asserts<typeof taxFormValidator>
}

interface ExtendedRequest extends NextApiRequestWithSession {
  body: UpdateUserTaxInfoRequest
}

const handler: NextApiHandlerWithUser<unknown, ExtendedRequest> = async ({ user, body }, res) => {
  if (!user) {
    return res.status(403).send({ message: 'Forbidden' })
  }

  const { errors, fields } = await validate(taxFormValidator, body.taxForm)

  if (errors || !fields) {
    return res.status(400).json(errors)
  }

  const { data } = await updateUserTaxInfoById(user.id, body.taxForm)

  return res.status(200).json(data)
}

export default newHandler(withUser(withMethods(['POST'], handler)))
