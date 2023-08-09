import { captureException } from '@sentry/nextjs'
import aws from 'aws-sdk'
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

export const uploadFileToS3 = async ({ file, userId, type }) => {
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
    captureException(error)
    return {
      error: {
        status: error.statusCode,
        errors: {
          file: error.message,
        },
      },
    }
  }
}

export const uploadFileToS3Temp = async ({ file, type }) => {
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
    captureException(error)
    return {
      error: {
        status: error.statusCode,
        errors: {
          file: error.message,
        },
      },
    }
  }
}

export const moveFileS3 = async ({ userId, type, source }) => {
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
    captureException(error)
    console.log(error)
    return {
      error: {
        status: error.statusCode,
        errors: {
          file: error.message,
        },
      },
    }
  }
}

export const removeFileFromS3 = async ({ key }) => {
  try {
    return await s3
      .deleteObject({
        Bucket: BUCKET_NAME,
        Key: key,
      })
      .promise()
  } catch (error) {
    captureException(error)
    return {
      error: {
        status: error.statusCode,
        errors: {
          file: error.message,
        },
      },
    }
  }
}

export const getFile = async ({ key }) => {
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

    return { data: Buffer.from(response.Body) }
  } catch (error) {
    captureException(error)
    return {
      error: {
        status: error.statusCode,
        errors: {
          file: error.message,
        },
      },
    }
  }
}

export const getReadStream = async ({ key }) => {
  try {
    const data = s3.getObject({ Bucket: BUCKET_NAME, Key: key }).createReadStream()
    return { data }
  } catch (error) {
    captureException(error)
    return {
      error: {
        status: error.statusCode,
        errors: {
          file: error.message,
        },
      },
    }
  }
}
