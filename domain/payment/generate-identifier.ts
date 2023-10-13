import Crypto from 'crypto'

interface GenerateIdentifierParams {
  address: string
  amount: number
  createdAt: Date
  email: string
}

export const generateIdentifier = ({ address, amount, createdAt, email }: GenerateIdentifierParams) => {
  if (isNaN(Number(amount))) {
    throw 'Amount needs to be a Number'
  }
  const date = new Date(createdAt)
  const hash = Crypto.createHash('sha1')
  hash.update(`{"to":"${address}","value":"${Number(amount).toString()}","created_at":"${date.getTime()}","email":"${email}"}`)

  const prefix = generatePrefixByEnviroment()

  return `${prefix}:${hash.digest('hex')}`
}

export const generatePrefixByEnviroment = () => {
  switch (process.env.ENV_NAME) {
    case 'development':
      return 'PLREFD'
    case 'release':
      return 'PLREFR'
    default:
      return 'PLREF'
  }
}
