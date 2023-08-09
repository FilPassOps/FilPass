import { COMPANY_NAME, PLATFORM_NAME, SUPPORT_EMAIL } from 'system.config'
import { DateTime } from 'luxon'

export const protocolFooterEmail = `
<p>Best regards,<br />
${COMPANY_NAME}</p>
<p>${PLATFORM_NAME} is a system ${COMPANY_NAME} uses for disbursements.</p>
<p>Please reach out to ${SUPPORT_EMAIL} with any questions.</p>
<p style="opacity: 0;">${DateTime.now().toFormat('dd LLL yyyy - HH:mm:ss')}</p>
`

export const baseEmail = (content: string) => {
  return `
<!DOCTYPE html>
<html lang="en" xmlns="https://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office">

<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta name="x-apple-disable-message-reformatting" />
    <title></title>
    <!--[if mso]>
      <style>
        table {
          border-collapse: collapse;
          border-spacing: 0;
          border: none;
          margin: 0;
        }
        div,
        td {
          padding: 0;
        }
        div {
          margin: 0 !important;
        }
      </style>
      <noscript>
        <xml>
          <o:OfficeDocumentSettings>
            <o:PixelsPerInch>96</o:PixelsPerInch>
          </o:OfficeDocumentSettings>
        </xml>
      </noscript>
    <![endif]-->

    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;800&display=swap');

        table,
        td,
        div,
        h1,
        p {
            font-family: 'Inter', sans-serif;
        }
    </style>
</head>

<body style="margin: 0; padding: 0; word-spacing: normal; background-color: #ffffff; font-size: 16px;">
    <div role="article" aria-roledescription="email" lang="en"
        style="text-size-adjust: 100%; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; background-color: #ffffff">
        <table role="presentation" style="width: 100%; border: none; border-spacing: 0">
            <tr>
                <td align="center" style="padding: 0">
                    <!--[if mso]>
                <table role="presentation" align="center" style="width:600px;">
                    <tr>
                        <td>
            <![endif]-->
                    <table role="presentation" style="
                width: 100%;
                max-width: 600px;
                border: none;
                border-spacing: 0;
                text-align: left;
                font-family: Inter, sans-serif;
                font-size: 16px;
                line-height: 22px;
              ">
                        <tr>
                            <td
                                style="padding: 20px 32px 20px 32px; text-align: left; font-size: 24px; font-weight: bold; background-color: #4f46e5">
                                <a href="https://pl.coinemissary.com/" style="text-decoration: none">
                                    <img src="https://s3.us-east-2.amazonaws.com/coinemissary.com/logo.png" width="223"
                                        alt="Logo"
                                        style="width:223px;max-width:80%;height:auto;border:none;text-decoration:none;">
                                </a>
                            </td>
                        </tr>

                            ${content}

                        <tr>
                            <td style="padding-left: 32px; padding-right: 32px; padding-top:48px; color: #6b7280; line-height: 24px">
                              <p style="margin: 0">${PLATFORM_NAME} is a system ${COMPANY_NAME} uses for disbursements.</p>
                              <p style="margin: 0; padding-top: 20px">Please reach out to <a style="color: #6b7280;" href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a> with any questions.</p>
                            </td>
                        </tr>

                        <tr>
                            <td style="font-size:20px;padding: 50px 32px 34px 32px;word-break:break-word">
                                <p style="border-top:solid 1px #E5E7EB;font-size:1px;margin:0px auto;width:100%">
                                    &nbsp;
                                </p>
                            </td>
                        </tr>

                        <tr>
                            <td align="center" style="padding: 0px 20px 34px 20px;">
                                <table>
                                    <tr style="margin:0;padding:0;">
                                        <td align="center" style="width: 40px;">
                                            <a href="https://twitter.com/protocollabs/" style="text-decoration:none;">
                                                <img src="https://s3.us-east-2.amazonaws.com/coinemissary.com/twitter-icon.png"
                                                    width="20" height="20" alt="Twitter"
                                                    style="display:inline-block;color:#cccccc;">
                                            </a>
                                        </td>
                                        <td align="center" style="width: 40px;">
                                            <a href="https://www.linkedin.com/company/protocollabs/"
                                                style="text-decoration:none;">
                                                <img src="https://s3.us-east-2.amazonaws.com/coinemissary.com/linkedin-icon.png"
                                                    width="20" height="20" alt="Twitter"
                                                    style="display:inline-block;color:#cccccc;">
                                            </a>
                                        </td>
                                        <td align="center" style="width: 40px;">
                                            <a href="https://www.youtube.com/ProtocolLabs"
                                                style="text-decoration:none;">
                                                <img src="https://s3.us-east-2.amazonaws.com/coinemissary.com/youtube-icon.png"
                                                    width="20" height="20" alt="Github"
                                                    style="display:inline-block;color:#cccccc;">
                                            </a>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        <tr>
                            <td style="text-align:center;font-size:16px;color:#9CA3AF;padding-bottom: 32px;">
                                <p style="margin:0;font-size:16px;line-height:24px;font-weight:400;">© 2023
                                    ${COMPANY_NAME}, Inc. <br /> All rights reserved.</p>
                            </td>
                        </tr>
                    </table>
                    <!--[if mso]>
                        </td>
                    </tr>
                </table>
            <![endif]-->
                </td>
            </tr>
        </table>
    </div>
</body>
</html>
`
}
