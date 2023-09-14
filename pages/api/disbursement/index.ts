import { getAll } from 'domain/disbursement/getAll'
import { APPROVED_STATUS } from 'domain/transferRequest/constants'
import { NextApiRequestWithSession, newHandler, withController, withMethods } from 'lib/middleware'
import { NextApiResponse } from 'next/types'

const handler = async (req: NextApiRequestWithSession, res: NextApiResponse) => {
  const query = req.query
  const status = (req.query.status || APPROVED_STATUS) as string
  const requestNumber = query.number as string
  const team = query.team?.toString().split(',') as string[]
  const programId = (query.programId as string)?.split(',').map(Number)

  const wallet = query.wallet as string
  let fromDate, toDate

  if (query.from && query.to) {
    fromDate = new Date(parseInt(query.from.toString()))
    fromDate.setHours(0, 0, 0, 0)
    toDate = new Date(parseInt(query.to.toString()))
    toDate.setHours(23, 59, 59, 999)
  }
  const { data, error } = (await getAll({
    ...query,
    programId: query.programId?.length ? programId : undefined,
    status,
    requestNumber,
    team,
    from: fromDate,
    to: toDate,
    wallet,
  })) as { data: any; error: any }

  if (error) {
    return res.status(error.status).json(error)
  }

  return res.status(200).json(data)
}

export default newHandler(withController(withMethods(['GET'], handler)))
