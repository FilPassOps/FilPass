import { getWalletVerifications } from 'domain/walletVerification/getWalletVerifications'
import { sendVerificationTransaction } from 'domain/walletVerification/sendVerificationTransaction'
import { newHandler, withMethods, withUser } from 'lib/middleware'

async function handler(req, res) {
  if (req.method === 'POST') {
    return await handlePostRequest(req, res)
  }

  return await handleGetRequest(req, res)
}

export default newHandler(withUser(withMethods(['POST', 'GET'], handler)))

async function handlePostRequest(req, res) {
  const userId = req.user.id

  const { data, error } = await sendVerificationTransaction({ ...req.body, userId })
  if (error) {
    return res.status(error.status).json(error)
  }

  return res.status(200).json(data)
}

async function handleGetRequest(req, res) {
  const userId = req.user.id
  const address = req.query.address

  const { data, error } = await getWalletVerifications({ userId, address })
  if (error) {
    return res.status(error.status).json({ error })
  }

  return res.status(200).json(data)
}
