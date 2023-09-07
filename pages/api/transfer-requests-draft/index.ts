import { createTransferRequestDraft } from 'domain/transferRequestDraft/createTransferRequestDraft'
import { NextApiRequestWithSession, newHandler, withApprover, withMethods } from 'lib/middleware'
import { NextApiResponse } from 'next/types'

async function handler(req: NextApiRequestWithSession, res: NextApiResponse) {
  return await handlePostRequest(req, res)
}

const handlePostRequest = async (req: NextApiRequestWithSession, res: NextApiResponse) => {
  const requesterId = req.user?.id
  const approverRoleId = req.approverId
  const { data } = await createTransferRequestDraft({
    ...req.body,
    requesterId,
    approverRoleId,
  })

  return res.status(200).json(data)
}

export default newHandler(withApprover(withMethods(['POST'], handler)))
