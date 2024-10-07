import { refundCredits } from 'domain/transfer-credits/refund-credits'
import { newHandler, NextApiRequestWithSession, withMethods, withUser, withValidation } from 'lib/middleware'
import yup from 'lib/yup'
import { NextApiResponse } from 'next'

const requestSchema = yup.object({
  userCreditId: yup.string().required(),
})

interface Request extends NextApiRequestWithSession {
  body: yup.InferType<typeof requestSchema>
}

async function handler(req: Request, res: NextApiResponse) {
  const user = req.user

  if (!user) {
    return res.status(403).send({ message: 'Forbidden' })
  }

  try {
    const result = await refundCredits({
      id: Number(req.body.userCreditId),
      userId: user.id,
    })
    return res.status(200).json(result)
  } catch (error: any) {
    console.error(error)
    return res.status(400).json({ message: error?.message })
  }
}

export default newHandler(withUser(withMethods(['POST'], withValidation(requestSchema, handler))))
