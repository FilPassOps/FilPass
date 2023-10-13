import { batchApproveTransferRequest } from 'domain/transfer-request-review/approve-transfer-request'
import { newHandler, NextApiRequestWithSession, withApprover, withMethods, withValidation } from 'lib/middleware'
import yup from 'lib/yup'
import { NextApiResponse } from 'next'

const requestSchema = yup.object({
  requests: yup.array().of(yup.string().required('Request is required')).required('Requests is required'),
})

interface ApproveRequest extends NextApiRequestWithSession {
  body: yup.InferType<typeof requestSchema>
}

async function handler(req: ApproveRequest, res: NextApiResponse) {
  const approverId = req.approverId

  if (!approverId) {
    return res.status(403).send({ message: 'Forbidden' })
  }

  const { requests } = req.body

  try {
    const result = await batchApproveTransferRequest({
      requests,
      approverId,
    })
    return res.status(200).json(result)
  } catch (error: any) {
    console.error(error)
    return res.status(400).json({ message: error?.message })
  }
}

export default newHandler(withApprover(withMethods(['POST'], withValidation(requestSchema, handler))))
