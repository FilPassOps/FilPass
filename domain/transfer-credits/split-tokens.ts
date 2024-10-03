import prisma from 'lib/prisma'
import { getUserCreditById } from './get-user-credit-by-id'
import { splitCreditsValidator } from './validation'
import { sign } from 'lib/jwt'
import { randomUUID } from 'node:crypto'
import { formatUnits, parseUnits } from 'ethers/lib/utils'
import { AppConfig } from 'config/system'
import Big from 'big.js'

interface SplitTokensParams {
  id: number
  userId: number
  splitNumber: number
}

const PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQC7VJTUt9Us8cKj
MzEfYyjiWA4R4/M2bS1GB4t7NXp98C3SC6dVMvDuictGeurT8jNbvJZHtCSuYEvu
NMoSfm76oqFvAp8Gy0iz5sxjZmSnXyCdPEovGhLa0VzMaQ8s+CLOyS56YyCFGeJZ
qgtzJ6GR3eqoYSW9b9UMvkBpZODSctWSNGj3P7jRFDO5VoTwCQAWbFnOjDfH5Ulg
p2PKSQnSJP3AJLQNFNe7br1XbrhV//eO+t51mIpGSDCUv3E0DDFcWDTH9cXDTTlR
ZVEiR2BwpZOOkE/Z0/BVnhZYL71oZV34bKfWjQIt6V/isSMahdsAASACp4ZTGtwi
VuNd9tybAgMBAAECggEBAKTmjaS6tkK8BlPXClTQ2vpz/N6uxDeS35mXpqasqskV
laAidgg/sWqpjXDbXr93otIMLlWsM+X0CqMDgSXKejLS2jx4GDjI1ZTXg++0AMJ8
sJ74pWzVDOfmCEQ/7wXs3+cbnXhKriO8Z036q92Qc1+N87SI38nkGa0ABH9CN83H
mQqt4fB7UdHzuIRe/me2PGhIq5ZBzj6h3BpoPGzEP+x3l9YmK8t/1cN0pqI+dQwY
dgfGjackLu/2qH80MCF7IyQaseZUOJyKrCLtSD/Iixv/hzDEUPfOCjFDgTpzf3cw
ta8+oE4wHCo1iI1/4TlPkwmXx4qSXtmw4aQPz7IDQvECgYEA8KNThCO2gsC2I9PQ
DM/8Cw0O983WCDY+oi+7JPiNAJwv5DYBqEZB1QYdj06YD16XlC/HAZMsMku1na2T
N0driwenQQWzoev3g2S7gRDoS/FCJSI3jJ+kjgtaA7Qmzlgk1TxODN+G1H91HW7t
0l7VnL27IWyYo2qRRK3jzxqUiPUCgYEAx0oQs2reBQGMVZnApD1jeq7n4MvNLcPv
t8b/eU9iUv6Y4Mj0Suo/AU8lYZXm8ubbqAlwz2VSVunD2tOplHyMUrtCtObAfVDU
AhCndKaA9gApgfb3xw1IKbuQ1u4IF1FJl3VtumfQn//LiH1B3rXhcdyo3/vIttEk
48RakUKClU8CgYEAzV7W3COOlDDcQd935DdtKBFRAPRPAlspQUnzMi5eSHMD/ISL
DY5IiQHbIH83D4bvXq0X7qQoSBSNP7Dvv3HYuqMhf0DaegrlBuJllFVVq9qPVRnK
xt1Il2HgxOBvbhOT+9in1BzA+YJ99UzC85O0Qz06A+CmtHEy4aZ2kj5hHjECgYEA
mNS4+A8Fkss8Js1RieK2LniBxMgmYml3pfVLKGnzmng7H2+cwPLhPIzIuwytXywh
2bzbsYEfYx3EoEVgMEpPhoarQnYPukrJO4gwE2o5Te6T5mJSZGlQJQj9q4ZB2Dfz
et6INsK0oG8XVGXSpQvQh3RUYekCZQkBBFcpqWpbIEsCgYAnM3DQf3FJoSnXaMhr
VBIovic5l0xFkEHskAjFTevO86Fsz1C2aSeRKSqGFoOQ0tmJzBEs1R6KqnHInicD
TQrKhArgLXX4v3CddjfTRJkFWDbE/CkvKZNOrcf1nhaGCPspRJj2KUkj1Fhl9Cnc
dn/RsYEONbwQSjIfMPkvxF+8HQ==
-----END PRIVATE KEY-----`

export const splitTokens = async (props: SplitTokensParams) => {
  try {
    const usdc = AppConfig.network.getTokenBySymbolAndBlockchainName('USDC', 'Ethereum')

    const fields = await splitCreditsValidator.validate(props)

    const { data, error } = await getUserCreditById({ id: fields.id, userId: fields.userId })

    if (!data || error || !data.totalRefunds || !data.totalWithdrawals || !data.withdrawExpiresAt || !data.totalHeight) {
      throw new Error('User credit not found')
    }

    if (data.withdrawExpiresAt < new Date()) {
      throw new Error('Withdrawal expired')
    }

    // TODO: check if the user has enough balance to split

    const splitGroup = randomUUID()

    const currentHeight = Big(data.totalWithdrawals).plus(data.totalRefunds).toString()

    const parsedCurrentHeight = parseUnits(currentHeight, usdc.decimals)
    const parsedTotalHeight = parseUnits(data.totalHeight!, usdc.decimals)

    const remaining = parsedTotalHeight.sub(parsedCurrentHeight)

    const balancePerSplit = remaining.div(fields.splitNumber)

    console.log('balancePerSplit', balancePerSplit.toString())
    console.log('parsedCurrentHeight', parsedCurrentHeight.toString())
    console.log('parsedTotalHeight', parsedTotalHeight.toString())
    console.log('remaining', remaining.toString())

    const splits = Array(fields.splitNumber)
      .fill(null)
      .map((_, index) => {
        const splitHeight = balancePerSplit
          .mul(index + 1)
          .add(parsedCurrentHeight)
          .toString()

        const tokenUuid = randomUUID()

        const height = formatUnits(splitHeight, usdc.decimals)

        return {
          userCreditId: data.id,
          height,
          amount: balancePerSplit.toString(),
          publicId: tokenUuid,
          splitGroup,
          token: sign(
            {
              iss: 'credit-transaction', // TODO: change to the public key
              exp: data.withdrawExpiresAt?.getTime(),
              iat: Math.floor(Date.now() / 1000),
              sub: tokenUuid,
              height: height,
              splitGroup,
            },
            PRIVATE_KEY,
            { algorithm: 'RS256' },
          ),
        }
      })

    const splitCredits = await prisma.creditToken.createMany({
      data: splits,
    })

    return splitCredits
  } catch (error) {
    console.log(error)
    throw error
  }
}
