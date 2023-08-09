const { TextDecoder, TextEncoder } = require('util')
global.TextDecoder = TextDecoder
global.TextEncoder = TextEncoder

process.env.APP_URL = 'http://localhost:3000'
process.env.APP_SECRET = 'APP_SECRET'
process.env.ENABLE_BLOCKCHAIN_INTERACTION = 1

//HASHING
process.env.EMAIL_KEY = '$2b$10$.J0sdgSE.in0MgyMhnS/q.'

//PAYMENT_DB
process.env.PAYMENT_VERIFICATION_DB_URL = 'PAYMENT_VERIFICATION_DB_URL'

//EMAIL
process.env.MAILGUN_API_KEY = 'MAILGUN_API_KEY'
process.env.MAILGUN_DOMAIN = 'MAILGUN_DOMAIN'
process.env.MAILGUN_SENDER_EMAIL = 'MAILGUN_SENDER_EMAIL'

// GOOGLE
process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = 'NEXT_PUBLIC_GOOGLE_CLIENT_ID='

//INFUR'INFUR'A
process.env.INFURA_FILECOIN_ENDPOINT = 'INFURA_FILECOIN_ENDPOINT'
process.env.INFURA_FILECOIN_PROJECT = 'INFURA_FILECOIN_PROJECT'
process.env.INFURA_FILECOIN_PROJECT_SECRET = 'INFURA_FILECOIN_PROJECT_SECRET'

//MASTER WALLET
process.env.MASTER_WALLET_PK = 'hu7N3mhP3rWJiULLdNqtRKKC6Uxx1rcPb0tkw91RN+8='

//DATABASE
process.env.DB_NAME = 'crypto_ops'
process.env.DB_PORT = '5433'
process.env.DB_HOSTNAME = 'localhost'
process.env.DB_SCHEMA = 'pl-disbursement'
process.env.DB_USERNAME = 'test'
process.env.DB_PASSWORD = 'test'

//AWS
process.env.BUCKET_REGION = 'BUCKET_REGION'
process.env.BUCKET_NAME = 'BUCKET_NAME'
process.env.BUCKET_ACCESS_KEY_ID = 'BUCKET_ACCESS_KEY_ID'
process.env.BUCKET_SECRET_ACCESS_KEY = 'BUCKET_SECRET_ACCESS_KEY'

//KMS
// DEFINE ON YOUR LOCAL .ENV FILE
// process.env.KMS_REGION = 'us-east-2'
// process.env.KMS_ACCESS_KEY_ID = 'KMS_ACCESS_KEY_ID'
// process.env.KMS_SECRET_ACCESS_KEY = 'KMS_SECRET_ACCESS_KEY'
// process.env.KMS_KEY_ID_ARN = 'KMS_KEY_ID_ARN'
// process.env.KMS_KEY_ALIAS_ARN = 'KMS_KEY_ALIAS_ARN'
