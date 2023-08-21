import crypto from 'crypto'
import { logger } from './logger'

const CRYPTO_ALGORITHM = process.env.CRYPTO_ALGORITHM
const CRYPTO_SECRET_KEY = process.env.CRYPTO_SECRET_KEY
const CRYPTO_SECRET_KEY_PII = process.env.CRYPTO_SECRET_KEY_PII

if (!CRYPTO_ALGORITHM || !CRYPTO_SECRET_KEY || !CRYPTO_SECRET_KEY_PII) {
  throw new Error('Please set CRYPTO_ALGORITHM, CRYPTO_SECRET_KEY, CRYPTO_SECRET_KEY environment variables')
}

const algorithm = CRYPTO_ALGORITHM
const secretKey = CRYPTO_SECRET_KEY
const secretKeyPII = CRYPTO_SECRET_KEY_PII

async function baseEncrypt(key: string, rawData: string) {
  //TODO open-source: remove this check once there is no more .js files and also the rawData.toString() below
  if (!rawData) {
    return rawData
  }

  try {
    const initVector = crypto.randomBytes(16)

    const cipher = crypto.createCipheriv(algorithm, Buffer.from(key, 'hex'), initVector)
    const encryptedBuffer = Buffer.concat([initVector, cipher.update(rawData.toString()), cipher.final()])

    return encryptedBuffer.toString('base64')
  } catch (error) {
    logger.error('Error encrypting data', error)
    throw error
  }
}

async function baseDecrypt(key: string, encryptedData: string) {
  //TODO open-source: remove this check once there is no more .js files and also the encryptedData.toString() below
  if (!encryptedData) {
    return encryptedData
  }

  try {
    const encryptedDataBuffer = Buffer.from(encryptedData.toString(), 'base64')
    const initVector = encryptedDataBuffer.subarray(0, 16)
    const ciphertext = encryptedDataBuffer.subarray(16)

    const decipher = crypto.createDecipheriv(algorithm, Buffer.from(key, 'hex'), Buffer.from(initVector))
    const decrpytedBuffer = Buffer.concat([decipher.update(Buffer.from(ciphertext)), decipher.final()])

    return decrpytedBuffer.toString()
  } catch (error) {
    logger.error('Error decrypting data', error)
    throw error
  }
}

export async function encrypt(rawData: string) {
  return baseEncrypt(secretKey, rawData)
}

export async function decrypt(encryptedData: string) {
  return baseDecrypt(secretKey, encryptedData)
}

export async function encryptPII(rawData: string) {
  return baseEncrypt(secretKeyPII, rawData)
}

export async function decryptPII(encryptedData: string) {
  return baseDecrypt(secretKeyPII, encryptedData)
}
