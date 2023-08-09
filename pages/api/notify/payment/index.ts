import { sendBatchPaidNotification } from 'domain/notifications/sendBatchPaidNotification'
import { newHandler, withMethods, withController } from 'lib/middleware'
import { NextApiResponse } from 'next'
import errorsMessages from 'wordings-and-errors/errors-messages'

interface Request {
  body: {
    publicIds: string[]
  }
}

async function handler(req: Request, res: NextApiResponse) {
  const publicIds = req.body.publicIds

  if (!publicIds) {
    return res.status(400).json({ message: errorsMessages.something_went_wrong.message })
  }

  const result = await sendBatchPaidNotification({ publicIds })

  if (result?.error) {
    return res.status(result.error.status).json(result.error)
  }

  return res.status(200).json({ success: true })
}

export default newHandler(withController(withMethods(['POST'], handler)))
