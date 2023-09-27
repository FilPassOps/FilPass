import { updateTransferRequestById } from 'domain/transferRequest/updateTransferRequestById'
import { NextApiRequestWithSession, newHandler, withMethods, withUser } from 'lib/middleware'
import { NextApiResponse } from 'next/types'

async function handler(req: NextApiRequestWithSession, res: NextApiResponse) {
  if (req.method === 'PATCH') {
    return await handlePatchRequest(req, res)
  }
}

const handlePatchRequest = async (req: NextApiRequestWithSession, res: NextApiResponse) => {
  if (!req.user?.isOnboarded) return res.status(403).send({ message: 'Forbidden' })

  const transferRequestId = req.query.id

  const { data, error } = await updateTransferRequestById({
    ...req.body,
    transferRequestId,
    user: req.user,
  })
  if (error) {
    return res.status(error.status).json(error)
  }

  return res.status(200).json(data)
}

export default newHandler(withUser(withMethods(['PATCH'], handler)))
