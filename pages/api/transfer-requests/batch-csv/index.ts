import { batchCsv } from 'domain/transferRequest/batchCsv'
import { NextApiRequestWithSession, newHandler, withApprover, withMethods } from 'lib/middleware'
import { NextApiResponse } from 'next/types'

async function handler(req: NextApiRequestWithSession, res: NextApiResponse) {
  return await handlePostRequest(req, res)
}

const handlePostRequest = async (req: NextApiRequestWithSession, res: NextApiResponse) => {
  const { requests } = req.body

  const requesterId = req.user?.id as number
  const approverRoleId = req.approverId as number
  const approver = req.user as any

  const { error, data } = await batchCsv({
    requests,
    requesterId,
    approverRoleId,
    approver,
  }) as any

  if (error) {
    return res.status(error.status).json(error)
  }

  return res.status(200).json(data)
}

export default newHandler(withApprover(withMethods(['POST'], handler)))
