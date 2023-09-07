const NEXT_PUBLIC_GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
const NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL

const stringifiedParams = new URLSearchParams({
  client_id: NEXT_PUBLIC_GOOGLE_CLIENT_ID as string,
  redirect_uri: `${NEXT_PUBLIC_APP_URL}/login`,
  scope: ['https://www.googleapis.com/auth/userinfo.email', 'https://www.googleapis.com/auth/userinfo.profile'].join(' '),
  response_type: 'code',
  access_type: 'offline',
  prompt: 'consent',
}).toString()

export const googleLoginUrl = `https://accounts.google.com/o/oauth2/v2/auth?${stringifiedParams}`
