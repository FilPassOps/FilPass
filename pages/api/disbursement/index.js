import { getAll } from 'domain/disbursement/getAll'
import { APPROVED_STATUS } from 'domain/transferRequest/constants'
import { newHandler, withController, withMethods } from 'lib/middleware'

const handler = async (req, res) => {
  const query = req.query
  const status = req.query.status || APPROVED_STATUS
  const requestNumber = query.number
  const team = query.team?.toString().split(',')

  const wallet = query.wallet
  let fromDate, toDate

  if (query.from && query.to) {
    fromDate = new Date(parseInt(query.from.toString()))
    fromDate.setHours(0, 0, 0, 0)
    toDate = new Date(parseInt(query.to.toString()))
    toDate.setHours(23, 59, 59, 999)
  }
  const { data, error } = await getAll({
    ...query,
    programId: query.programId?.length ? query.programId.split(',') : undefined,
    status,
    requestNumber,
    team,
    from: fromDate,
    to: toDate,
    wallet,
  })

  if (error) {
    return res.status(error.status).json(error)
  }

  return res.status(200).json(data)
}

export default newHandler(withController(withMethods(['GET'], handler)))
