import { createOrUpdateTransfers } from 'domain/transfer/createOrUpdateTransfers'
import { getTransfersByRequestId } from 'domain/transfer/getTransfersByRequestId'
import { newHandler, withController, withMethods } from 'lib/middleware'
import qs from 'qs'

async function handler(req, res) {
  if (req.method === 'GET') {
    return await handleGetRequest(req, res)
  }

  return await handlePostRequest(req, res)
}

export default newHandler(withController(withMethods(['POST', 'GET'], handler)))

async function handlePostRequest(req, res) {
  const { body, controllerId } = req
  const { data, error } = await createOrUpdateTransfers({ ...body, controllerId })
  if (error) {
    return res.status(error.status).json(error)
  }

  return res.status(200).json(data)
}

async function handleGetRequest(req, res) {
  const { requests } = qs.parse(req.query, { arrayLimit: 1000 })
  const { data, error } = await getTransfersByRequestId({ requests })
  if (error) {
    return res.status(error.status).json(error)
  }

  return res.status(200).json(data)
}
