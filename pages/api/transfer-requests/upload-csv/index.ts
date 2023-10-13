import { uploadBatchCsv } from 'domain/transfer-request/upload-batch-csv'
import { newHandler, withApprover, withFile, withMethods } from 'lib/middleware'
import { NextApiResponse } from 'next/types'
import { NextApiRequestWithSessionAndFile } from 'pages/api/files'

async function handler(req: NextApiRequestWithSessionAndFile, res: NextApiResponse) {
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
