import { batchCsv } from 'domain/transferRequest/batchCsv'
import { newHandler, withApprover, withMethods } from 'lib/middleware'

async function handler(req, res) {
  return await handlePostRequest(req, res)
}

const handlePostRequest = async (req, res) => {
  const { requests } = req.body

  const requesterId = req.user.id
  const approverRoleId = req.approverId
  const approver = req.user

  const { error, data } = await batchCsv({
    requests,
    requesterId,
    approverRoleId,
    approver,
  })

  if (error) {
    return res.status(error.status).json(error)
  }

  return res.status(200).json(data)
}

export default newHandler(withApprover(withMethods(['POST'], handler)))
