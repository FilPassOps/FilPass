import { createTransferRequestDraft } from 'domain/transferRequestDraft/createTransferRequestDraft'
import { newHandler, withApprover, withMethods } from 'lib/middleware'

async function handler(req, res) {
  return await handlePostRequest(req, res)
}

const handlePostRequest = async (req, res) => {
  const requesterId = req.user.id
  const approverRoleId = req.approverId
  const { data } = await createTransferRequestDraft({
    ...req.body,
    requesterId,
    approverRoleId,
  })

  return res.status(200).json(data)
}

export default newHandler(withApprover(withMethods(['POST'], handler)))
