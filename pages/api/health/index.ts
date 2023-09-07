import { newHandler, withMethods } from 'lib/middleware'
import { NextApiRequest, NextApiResponse } from 'next/types'

async function handler(_req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({ status: 'ok' })
}

export default newHandler(withMethods(['POST', 'GET'], handler))
