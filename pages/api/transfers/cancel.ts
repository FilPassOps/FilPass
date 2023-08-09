import { cancelTransfers } from 'domain/transfer/cancel-transfers'
import { newHandler, NextApiRequestWithSession, withController, withMethods, withValidation } from 'lib/middleware'
import yup from 'lib/yup'
import { NextApiResponse } from 'next'

const requestSchema = yup.object({
  requests: yup.array(yup.number().required()).min(1).required(),
  reason: yup.string(),
})

interface Request extends NextApiRequestWithSession {
  body: yup.InferType<typeof requestSchema>
}

async function handler(req: Request, res: NextApiResponse) {
  const controllerUserRoleId = req.controllerId

  if (!controllerUserRoleId) {
    return res.status(403).send({ message: 'Forbidden' })
  }
  const { requests, reason } = req.body

  try {
    await cancelTransfers(requests, controllerUserRoleId, reason)
    return res.status(200).json({ message: 'Transfers cancelled' })
  } catch (error: any) {
    console.error(error)
    return res.status(400).json({ message: error?.message })
  }
}

export default newHandler(withController(withMethods(['POST'], withValidation(requestSchema, handler))))
