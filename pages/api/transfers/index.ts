import { createOrUpdateTransfers } from 'domain/transfer/createOrUpdateTransfers'
import { getTransfersByRequestId } from 'domain/transfer/getTransfersByRequestId'
import { NextApiRequestWithSession, newHandler, withController, withMethods } from 'lib/middleware'
import { NextApiResponse } from 'next/types'
import qs from 'qs'

async function handler(req: NextApiRequestWithSession, res: NextApiResponse) {
  if (req.method === 'GET') {
    return await handleGetRequest(req, res)
  }

  return await handlePostRequest(req, res)
}

export default newHandler(withController(withMethods(['POST', 'GET'], handler)))

async function handlePostRequest(req: NextApiRequestWithSession, res: NextApiResponse) {
  const { body, controllerId } = req
  const { data, error } = await createOrUpdateTransfers({ ...body, controllerId })
  if (error) {
    return res.status(error.status).json(error)
  }

  return res.status(200).json(data)
}

async function handleGetRequest(req: NextApiRequestWithSession, res: NextApiResponse) {
  // TODO: type this properly
  const { requests } = qs.parse(req.query as any, { arrayLimit: 1000 }) as { requests: string[] }
  const { data, error } = await getTransfersByRequestId({ requests })
  if (error) {
    return res.status(error.status).json(error)
  }

  return res.status(200).json(data)
}
