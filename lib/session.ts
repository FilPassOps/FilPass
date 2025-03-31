import { IronSessionOptions } from 'iron-session'

const APP_SECRET = process.env.APP_SECRET

if (!APP_SECRET) {
  throw new Error('Please define the APP_SECRET environment variable.')
}

/**
 * maxAge in seconds
 */
export const maxAge = 1209600

export const sessionOptions: IronSessionOptions = {
  password: APP_SECRET,
  cookieName: '@Filpass:session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: maxAge,
    sameSite: 'lax',
    path: '/',
    httpOnly: true,
  },
}
