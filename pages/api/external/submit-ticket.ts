import { submitTicket } from 'domain/external/submit-ticket'
import { newHandler, NextApiRequestWithSession, withExternalLimiter, withMethods, withValidation } from 'lib/middleware'
import yup from 'lib/yup'
import { NextApiResponse } from 'next'

const requestSchema = yup.object({
  token: yup.string().required(),
})

interface Request extends NextApiRequestWithSession {
  body: yup.InferType<typeof requestSchema>
}

async function handler(req: Request, res: NextApiResponse) {
  try {
    const result = await submitTicket({
      token: req.body.token,
    })

    return res.status(200).json(result)
  } catch (error: any) {
    console.error(error)
    return res.status(400).json({ message: error?.message })
  }
}

export default newHandler(withExternalLimiter(withMethods(['POST'], withValidation(requestSchema, handler))))
