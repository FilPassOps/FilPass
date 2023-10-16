import { TextDecoder, TextEncoder } from 'util'

global.TextDecoder = TextDecoder as any
global.TextEncoder = TextEncoder

process.env.APP_URL = 'http://localhost:3000'
process.env.APP_SECRET = 'APP_SECRET'

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

//AWS
process.env.BUCKET_REGION = 'BUCKET_REGION'
process.env.BUCKET_NAME = 'BUCKET_NAME'
process.env.BUCKET_ACCESS_KEY_ID = 'BUCKET_ACCESS_KEY_ID'
process.env.BUCKET_SECRET_ACCESS_KEY = 'BUCKET_SECRET_ACCESS_KEY'
