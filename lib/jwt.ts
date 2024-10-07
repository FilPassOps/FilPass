import { ethers } from 'ethers'
import jwt, { SignOptions } from 'jsonwebtoken'
import errorsMessages from 'wordings-and-errors/errors-messages'

export const verify = (value: string, secretOrPublicKey?: string) => {
  try {
    return { data: jwt.verify(value, secretOrPublicKey || (process.env.APP_SECRET as string)) as any }
  } catch (err) {
    return { error: errorsMessages.invalid_token }
  }
}

export const sign = (value: any, secretOrPrivateKey?: string, options?: SignOptions) => {
  return jwt.sign(value, secretOrPrivateKey || (process.env.APP_SECRET as string), options)
}

// export const secp256k1KeyFromLotusWallet = (exp: string) => {
//   const decoded = Buffer.from(exp, 'hex')

//   const keyData = JSON.parse(decoded.toString())

//   if (keyData.Type !== 'secp256k1') {
//     throw new Error(`Key must be of type secp256k1, got: ${keyData.Type}`)
//   }

//   const privateKeyUint = new Uint8Array(Buffer.from(keyData.PrivateKey, 'base64'))

//   if (privateKeyUint.length !== 32) {
//     throw new Error('Private key must be 32 bytes long.')
//   }

//   if (!secp256k1.privateKeyVerify(privateKeyUint)) {
//     throw new Error('Invalid private key')
//   }

//   const publicKeyUint = secp256k1.publicKeyCreate(privateKeyUint, true)

//   const privateKey = Buffer.from(privateKeyUint).toString('hex')
//   const publicKey = Buffer.from(publicKeyUint).toString('hex')

//   return { privateKey, publicKey }
// }

export const signEthereumJWT = async (payload: any) => {
  // Create a signer instance from ethers.js
  const signer = new ethers.Wallet(process.env.SYSTEM_WALLET_PRIVATE_KEY as string)

  const header = {
    alg: 'ES256',
    typ: 'JWT',
  }

  const base64Header = Buffer.from(JSON.stringify(header)).toString('base64')
  const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64')
  const unsignedToken = `${base64Header}.${base64Payload}`

  const signature = await signer.signMessage(unsignedToken)

  const signedJWT = `${unsignedToken}.${signature}`

  return signedJWT
}
