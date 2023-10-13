import { updateUserBan } from 'domain/user/update-user-ban'
import { newHandler, NextApiRequestWithSession, withMethods, withSuperAdmin, withValidation } from 'lib/middleware'
import { sanitizeText } from 'lib/sanitize-text'
import yup from 'lib/yup'
import { NextApiResponse } from 'next'

const requestSchema = yup.object({
  banReason: yup.string().trim().max(500).required('Ban reason is required'),
})

interface ApproveRequest extends NextApiRequestWithSession {
  body: yup.InferType<typeof requestSchema>
}

async function handler(req: ApproveRequest, res: NextApiResponse) {
  const id = req.query.id
  const superAdminUserRoleId = req.userRoleId
  const { banReason } = req.body

  if (!superAdminUserRoleId || !id) {
    return res.status(403).send({ message: 'Forbidden' })
  }

  const sanitizedBanReason = sanitizeText(banReason)

  try {
    const result = await updateUserBan({ id: +id, isBanned: true, banReason: sanitizedBanReason, superAdminUserRoleId })
    return res.status(200).json({ isBanned: result.isBanned, banReason: result.banReason, id: result.id })
  } catch (error: any) {
    console.error(error)
    return res.status(400).json({ message: 'An unexpected error happened. Please, try again.' })
  }
}

export default newHandler(withSuperAdmin(withMethods(['POST'], withValidation(requestSchema, handler))))
