import axios from 'axios'

const NEXT_PUBLIC_GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
const APP_URL = process.env.NEXT_PUBLIC_APP_URL
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET

interface GetAccessTokenFromCodeParams {
  code: string
}

interface GetGoogleUserInfoParams {
  access_token: string
}

interface GetGoogleUserParams {
  code: string
}

async function getAccessTokenFromCode({ code }: GetAccessTokenFromCodeParams) {
  try {
    const { data } = await axios({
      url: `https://oauth2.googleapis.com/token`,
      method: 'post',
      data: {
        client_id: NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: `${APP_URL}/`,
        grant_type: 'authorization_code',
        code,
      },
    })
    return { data: data.access_token, error: null }
  } catch (e: any) {
    return {
      data: null,
      error: {
        status: e.response.status,
        message: e.response.statusText,
      },
    }
  }
}

async function getGoogleUserInfo({ access_token }: GetGoogleUserInfoParams) {
  try {
    const { data } = await axios({
      url: 'https://www.googleapis.com/oauth2/v2/userinfo',
      method: 'get',
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    })
    return { data, error: null }
  } catch (e: any) {
    return {
      data: null,
      error: {
        status: e.response.status,
        message: e.response.statusText,
      },
    }
  }
}

export async function getGoogleUser({ code }: GetGoogleUserParams) {
  const { data: access_token, error: access_token_error } = await getAccessTokenFromCode({ code })
  if (access_token_error) {
    return { data: null, error: access_token_error }
  }

  const { data, error: googleUserInfoError } = await getGoogleUserInfo({ access_token })
  if (googleUserInfoError) {
    return { data: null, error: googleUserInfoError }
  }

  return { data, error: null }
}
