import { splitTokens } from 'domain/transfer-credits/split-tokens'
import { newHandler, NextApiRequestWithSession, withMethods, withUser, withValidation } from 'lib/middleware'
import yup from 'lib/yup'
import { NextApiResponse } from 'next'

const requestSchema = yup.object({
  userCreditId: yup.string().required(),
  splitNumber: yup.number().required(),
  creditPerVoucher: yup.number().required(),
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
    const result = await splitTokens({
      id: Number(req.body.userCreditId),
      splitNumber: req.body.splitNumber,
      userId: user.id,
      creditPerVoucher: req.body.creditPerVoucher,
    })
    return res.status(200).json(result)
  } catch (error: any) {
    console.error(error)
    return res.status(400).json({ message: error?.message })
  }
}

export default newHandler(withUser(withMethods(['POST'], withValidation(requestSchema, handler))))
