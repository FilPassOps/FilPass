import { createEthereumWallet } from 'domain/wallet/createEthereumWallet'
import { newHandler, NextApiRequestWithSession, withMethods, withUser, withValidation } from 'lib/middleware'
import yup from 'lib/yup'
import { NextApiResponse } from 'next'

const requestSchema = yup.object({
  walletAddress: yup.string().trim().required('Wallet address is required'),
  label: yup.string().trim(),
  blockchain: yup.string().required(), // TODO OPEN-SOURCE: should be the id of the blockchain
})

interface EthereumWalletCreationReq extends NextApiRequestWithSession {
  body: yup.InferType<typeof requestSchema>
}

async function handler(req: EthereumWalletCreationReq, res: NextApiResponse) {
  const { walletAddress, label, blockchain } = req.body
  const userId = req.user?.id
  const email = req.user?.email

  if (!userId || !email) {
    return res.status(403).send({ message: 'Forbidden' })
  }

  try {
    const result = await createEthereumWallet({ userId, address: walletAddress, label, email, blockchain })
    return res.status(200).json(result)
  } catch (error: any) {
    console.error(error)
    return res.status(400).json({ message: 'An unexpected error happened. Please, try again.' })
  }
}

export default newHandler(withUser(withMethods(['POST'], withValidation(requestSchema, handler))))
