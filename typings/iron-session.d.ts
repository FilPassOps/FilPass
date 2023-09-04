/* eslint-disable no-unused-vars */
import { Role } from '@prisma/client'
import 'iron-session'

declare module 'iron-session' {
  interface IronSessionData {
    user?: {
      id: number
      email: string
      isOnboarded: boolean
      roles: {
        id: number
        role: Role
      }[]
    }
    identifier?: string
    controllerId?: number
    approverId?: number
    addressManagerId?: number
    superAdminId?: number
    userRoleId?: number
    viewerId?: number
  }
}
