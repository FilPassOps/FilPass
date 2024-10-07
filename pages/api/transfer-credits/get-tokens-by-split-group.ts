import { getTokensBySplitGroup } from 'domain/transfer-credits/get-tokens-by-split-group'
import { newHandler, NextApiRequestWithSession, withMethods, withUser } from 'lib/middleware'
import { NextApiResponse } from 'next'

async function handler(req: NextApiRequestWithSession, res: NextApiResponse) {
  const user = req.user
  const { splitGroup } = req.query

  if (!user) {
    return res.status(403).send({ message: 'Forbidden' })
  }

  try {
    const result = await getTokensBySplitGroup({
      splitGroup: splitGroup as string,
      userId: user.id,
    })
    return res.status(200).json(result)
  } catch (error: any) {
    console.error(error)
    return res.status(400).json({ message: error?.message })
  }
}

export default newHandler(withUser(withMethods(['GET'], handler)))
