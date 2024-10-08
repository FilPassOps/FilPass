import { ethers } from 'ethers'
import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken'
import errorsMessages from 'wordings-and-errors/errors-messages'
import * as crypto from 'crypto'

const wallet = new ethers.Wallet(process.env.SYSTEM_WALLET_PRIVATE_KEY as string)

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

// Function to sign a JWT using the ES256K-R algorithm
export async function signJwt(payload: any) {
  const header = {
    alg: 'ES256K-R',
    typ: 'JWT',
  }

  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url')
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url')

  const signingInput = `${encodedHeader}.${encodedPayload}`

  const hash = crypto.createHash('sha256').update(signingInput).digest()

  const signature = wallet._signingKey().signDigest(hash)

  const flatSignature = ethers.utils.joinSignature(signature)

  const signatureBuffer = Buffer.from(flatSignature.slice(2), 'hex') // 65 bytes

  const encodedSignature = signatureBuffer.toString('base64url')

  const jwt = `${signingInput}.${encodedSignature}`

  return jwt
}

export async function verifyJwt(jwtToken: string, expectedAddress: string) {
  try {
    const [encodedHeader, encodedPayload, encodedSignature] = jwtToken.split('.')

    const signingInput = `${encodedHeader}.${encodedPayload}`

    const hash = crypto.createHash('sha256').update(signingInput).digest()

    const signatureBuffer = Buffer.from(encodedSignature, 'base64url')

    const signatureHex = '0x' + signatureBuffer.toString('hex')

    const recoveredAddress = ethers.utils.recoverAddress(hash, signatureHex)

    if (recoveredAddress.toLowerCase() !== expectedAddress.toLowerCase()) {
      throw new Error('Invalid signature: address mismatch')
    }

    const payloadJson = Buffer.from(encodedPayload, 'base64url').toString('utf8')
    const payload = JSON.parse(payloadJson)

    return { data: payload as JwtPayload }
  } catch (error: any) {
    return { error: errorsMessages.invalid_token }
  }
}
