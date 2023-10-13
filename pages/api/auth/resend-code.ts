import { generateCodePublic } from 'domain/auth/generate-code'
import { newHandler, withMethods } from 'lib/middleware'
import { NextApiRequest, NextApiResponse } from 'next/types'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { data, error } = (await generateCodePublic(req.body)) as { data: any; error: any }
  if (error) {
    return res.status(error.status).json(error)
  }

  return res.status(200).json(data)
}

export default newHandler(withMethods(['POST'], handler))
