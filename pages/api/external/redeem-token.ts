import { redeemToken } from 'domain/external/redeem-token'
import { newHandler, NextApiRequestWithSession, withMethods, withValidation } from 'lib/middleware'
import yup from 'lib/yup'
import { NextApiResponse } from 'next'

const requestSchema = yup.object({
  walletAddress: yup.string().required(),
  token: yup.string().required(),
})

interface Request extends NextApiRequestWithSession {
  body: yup.InferType<typeof requestSchema>
}

async function handler(req: Request, res: NextApiResponse) {
  try {
    const result = await redeemToken({
      walletAddress: req.body.walletAddress,
      token: req.body.token,
    })

    return res.status(200).json(result)
  } catch (error: any) {
    console.error(error)
    return res.status(400).json({ message: error?.message })
  }
}

export default newHandler(withMethods(['POST'], withValidation(requestSchema, handler)))
