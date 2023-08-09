import { newHandler, withMethods } from 'lib/middleware'

async function handler(_req, res) {
  res.status(200).send()
}

export default newHandler(withMethods(['POST', 'GET'], handler))
