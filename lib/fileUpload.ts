import { captureException } from '@sentry/nextjs'
import aws, { AWSError } from 'aws-sdk'
import { createReadStream } from 'fs'
import { last } from 'lodash'
import { DateTime } from 'luxon'

const BUCKET_REGION = process.env.BUCKET_REGION
const BUCKET_NAME = process.env.BUCKET_NAME
const BUCKET_ACCESS_KEY_ID = process.env.BUCKET_ACCESS_KEY_ID
const BUCKET_SECRET_ACCESS_KEY = process.env.BUCKET_SECRET_ACCESS_KEY

if (!BUCKET_REGION || !BUCKET_NAME || !BUCKET_ACCESS_KEY_ID || !BUCKET_SECRET_ACCESS_KEY) {
  throw new Error('Please define BUCKET_REGION, BUCKET_NAME, BUCKET_ACCESS_KEY_ID AND BUCKET_SECRET_ACCESS_KEY environment variables')
}

const s3 = new aws.S3({
  region: BUCKET_REGION,
  accessKeyId: BUCKET_ACCESS_KEY_ID,
  secretAccessKey: BUCKET_SECRET_ACCESS_KEY,
  signatureVersion: 'v4',
})

interface UploadFileToS3Params {
  file: {
    path: string
    filename: string
    originalname: string
  }
  userId: number
  type: string
}

export const uploadFileToS3 = async ({ file, userId, type }: UploadFileToS3Params) => {
  const key = `${userId}/${type}/${file.filename}-${file.originalname}`
  try {
    await s3
      .putObject({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: createReadStream(file.path),
      })
      .promise()

    return {
      data: {
        key,
      },
    }
  } catch (error) {
    const awsError = error as AWSError
    captureException(error)
    return {
      error: {
        status: awsError.statusCode,
        errors: {
          file: awsError.message,
        },
      },
    }
  }
}

interface UploadFileToS3Params {
  file: {
    path: string
    filename: string
    originalname: string
  }
  type: string
}

export const uploadFileToS3Temp = async ({ file, type }: UploadFileToS3Params) => {
  const timeStamp = DateTime.now().toMillis()
  const key = `temp/${type}/${timeStamp}/${file.filename}-${file.originalname}`
  try {
    await s3
      .putObject({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: createReadStream(file.path),
      })
      .promise()

    return {
      data: {
        key,
      },
    }
  } catch (error) {
    const awsError = error as AWSError
    captureException(error)
    return {
      error: {
        status: awsError.statusCode,
        errors: {
          file: awsError.message,
        },
      },
    }
  }
}

interface GetMoveFileS3Params {
  userId: string
  type: string
  source: string
}

export const moveFileS3 = async ({ userId, type, source }: GetMoveFileS3Params) => {
  const fileName = last(source.split('/'))
  const key = `${userId}/${type}/${fileName}`

  try {
    await s3
      .copyObject({
        Bucket: BUCKET_NAME,
        CopySource: `${BUCKET_NAME}/${source}`,
        Key: key,
      })
      .promise()
    return {
      data: {
        key,
      },
    }
  } catch (error) {
    const awsError = error as AWSError
    captureException(error)
    console.log(error)
    return {
      error: {
        status: awsError.statusCode,
        errors: {
          file: awsError.message,
        },
      },
    }
  }
}

interface RemoveFileFromS3Params {
  key: string
}

export const removeFileFromS3 = async ({ key }: RemoveFileFromS3Params) => {
  try {
    return await s3
      .deleteObject({
        Bucket: BUCKET_NAME,
        Key: key,
      })
      .promise()
  } catch (error) {
    const awsError = error as AWSError
    captureException(error)
    return {
      error: {
        status: awsError.statusCode,
        errors: {
          file: awsError.message,
        },
      },
    }
  }
}

interface GetFileParams {
  key: string
}

export const getFile = async ({ key }: GetFileParams) => {
  try {
    const response = await s3.getObject({ Bucket: BUCKET_NAME, Key: key }).promise()

    const error = response.$response.error
    if (error) {
      return {
        error: {
          status: error.statusCode,
          message: error.message,
        },
      }
    }

    return { data: Buffer.from(response.Body as Buffer) }
  } catch (error) {
    const awsError = error as AWSError
    captureException(error)
    return {
      error: {
        status: awsError.statusCode,
        errors: {
          file: awsError.message,
        },
      },
    }
  }
}

interface GetReadStreamParams {
  key: string
}

export const getReadStream = async ({ key }: GetReadStreamParams) => {
  try {
    const data = s3.getObject({ Bucket: BUCKET_NAME, Key: key }).createReadStream()
    return { data }
  } catch (error) {
    const awsError = error as AWSError
    captureException(error)
    return {
      error: {
        status: awsError.statusCode || 500,
        errors: {
          file: awsError.message,
        },
      },
    }
  }
}
