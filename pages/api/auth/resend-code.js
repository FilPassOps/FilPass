import { generateCodePublic } from 'domain/auth/generateCode'
import { newHandler, withMethods } from 'lib/middleware'

async function handler(req, res) {
  const { data, error } = await generateCodePublic(req.body)
  if (error) {
    return res.status(error.status).json(error)
  }

  return res.status(200).json(data)
}

export default newHandler(withMethods(['POST'], handler))
