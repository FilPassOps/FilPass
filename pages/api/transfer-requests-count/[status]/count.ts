import { AppConfig, ChainNames } from 'config'
import { APPROVED_STATUS, PAID_STATUS, REJECTED_BY_CONTROLLER_STATUS } from 'domain/transfer-request/constants'
import { getCountByNetworkAndStatus } from 'domain/transfer-request/get-count-by-network-and-status'
import { NextApiRequestWithSession, newHandler, withController, withLimiter, withMethods } from 'lib/middleware'
import yup, { validate } from 'lib/yup'
import { NextApiResponse } from 'next/types'
import qs from 'qs'

const requestSchema = yup.object({
  status: yup.string().oneOf([APPROVED_STATUS, PAID_STATUS, REJECTED_BY_CONTROLLER_STATUS]).required(),
  networks: yup
    .array()
    .of(yup.string().required())
    .test('is-valid', 'Networks must be valid', networks => {
      return networks?.every(network => AppConfig.network.chains.map(chain => chain.name).includes(network as ChainNames))
    })
    .required(),
})

async function handler(req: NextApiRequestWithSession, res: NextApiResponse) {
  const parsedQuery = qs.parse(req.query as unknown as string)

  const { fields, errors } = await validate(requestSchema, parsedQuery)

  if (errors || !fields) {
    return res.status(400).json(errors)
  }

  const { status, networks } = fields

  try {
    const data = await getCountByNetworkAndStatus({ status, networks })
    return res.status(200).json(data)
  } catch (error) {
    return res.status(500).json(error)
  }
}

export default newHandler(withLimiter(withController(withMethods(['GET'], handler))))
