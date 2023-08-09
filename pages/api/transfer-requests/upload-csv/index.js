import { uploadBatchCsv } from 'domain/transferRequest/uploadBatchCsv'
import { newHandler, withApprover, withFile, withMethods } from 'lib/middleware'

async function handler(req, res) {
  const body = JSON.parse(req.body.data)
  const file = req.file
  const { approverId } = req

  const { data, error } = await uploadBatchCsv({ ...body, file, approverId })
  if (error) {
    return res.status(error.status).json(error)
  }

  return res.status(200).json(data)
}

export default newHandler(withFile(withApprover(withMethods(['POST'], handler))))

export const config = {
  api: {
    bodyParser: false,
  },
}
