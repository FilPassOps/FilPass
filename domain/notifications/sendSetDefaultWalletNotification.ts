import { sendEmail } from 'lib/sendEmail'
import jwt from 'jsonwebtoken'
import errorsMessages from 'wordings-and-errors/errors-messages'
import { validate } from 'lib/yup'
import { sendSetDefaultWalletConfirmationValidator } from './validation'
import prisma from 'lib/prisma'
import { baseEmail } from './constants'

interface SendSetDefaultWalletConfirmationParams {
  id: number
  userId: number
  email: string
}

interface GetBodyParams {
  token: string
  oldAddress: string
  newDefaultWallet: {
    address: string
  }
}

export async function sendSetDefaultWalletConfirmation(params: SendSetDefaultWalletConfirmationParams) {
  const { fields, errors } = await validate(sendSetDefaultWalletConfirmationValidator, params)

  if (errors || !fields) {
    return {
      error: {
        status: 400,
        errors,
      },
    }
  }

  const { id, userId, email } = fields

  const [newDefaultWallet] = await prisma.userWallet.findMany({
    where: { id, userId },
  })

  const [currentDefaultWallet] = await prisma.userWallet.findMany({
    where: {
      userId,
      isDefault: true,
      blockchainId: newDefaultWallet.blockchainId,
    },
  })

  const secret = process.env.APP_SECRET

  if (!secret) {
    return {
      error: {
        status: 500,
        errors: [errorsMessages.something_went_wrong.message],
      },
    }
  }

  const token = jwt.sign({ newDefaultWallet }, secret, {
    expiresIn: '1h',
  })

  const oldAddress = currentDefaultWallet ? currentDefaultWallet.address : ''

  const emailBody = baseEmail(getBody({ oldAddress, newDefaultWallet, token }))

  const response = await sendEmail({
    to: email,
    subject: 'Default Wallet Confirmation',
    html: emailBody,
  })

  if (!response) {
    return {
      error: {
        status: 500,
        errors: {
          email: { message: errorsMessages.something_went_wrong.message },
        },
      },
    }
  }

  return {
    data: { message: response.message },
  }
}

const getBody = ({ oldAddress, newDefaultWallet, token }: GetBodyParams) => {
  return `
  <tr>
    <td style="padding-left:32px; padding-right: 32px;padding-top: 48px;">
      <h1 style="margin-top:0;margin-bottom:35px;font-size:48px;line-height:48px;font-weight:800;letter-spacing:-0.02em; color:#4F46E5">
        Default Wallet Confirmation
      </h1>
      <p style="margin:0; color: #6B7280;line-height: 24px; white-space: pre-line;">
        Hello <br /> <br />
        You have initiated a request to change your default address. Please confirm your address change: <br/><br/>
        Old Address: <strong>${oldAddress}</strong> <br/>
        New Address: <strong>${newDefaultWallet.address}</strong> <br/><br/>
        Please carefully review the requested address change and click the button below to confirm:
      </p>
    </td>
  </tr>

  <tr>
    <td align="center" style="padding: 48px 32px 0px 32px;">
      <div style="display:inline-block;width:100%;max-width:400px;vertical-align:top;font-family:Inter,sans-serif;font-size:16px;line-height:24px;font-weight: 500;">
        <a href="${process.env.APP_URL}/set-default-wallet?token=${token}"
           style="background:#4F46E5;text-decoration: none; padding: 13px 33px; color: #ffffff; border-radius: 6px; display:inline-block;">
           Confirm
        </a>
      </div>
    </td>
  </tr>

  <tr>
    <td style="padding-left:32px; padding-right: 32px;padding-top: 48px;">
      <p style="margin:0; color: #6B7280;line-height: 24px; word-break: break-all;">
        If you did not request to change your default address, please do NOT click the button above and change your password as soon as possible. <br/><br/>
        If you have a problem clicking on this link, paste this into your browser:
         ${process.env.APP_URL}/set-default-wallet?token=${token}
      </p>
    </td>
  </tr>
  `
}
