import { TransferRequestStatus } from '@prisma/client'
import { APPROVED_STATUS } from 'domain/transferRequest/constants'
import { findControllerTeams } from 'domain/transferRequest/findTeamsByRole'
import { NextApiRequestWithSession, newHandler, withController, withMethods } from 'lib/middleware'
import { NextApiResponse } from 'next'

const handler = async (req: NextApiRequestWithSession, res: NextApiResponse) => {
  const status = req.query?.status ?? APPROVED_STATUS

  const teams = await findControllerTeams(status as TransferRequestStatus)

  return res.status(200).json(teams)
}

export default newHandler(withController(withMethods(['GET'], handler)))
