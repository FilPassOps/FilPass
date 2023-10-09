import { compare, hash as genHash, genSalt } from 'bcrypt'

const salt = process.env.EMAIL_KEY
const teamSalt = process.env.TEAM_KEY

if (!salt) {
  throw new Error('Please provide Email Key')
}

if (!teamSalt) {
  throw new Error('Please provide Team Key')
}

export const generatePasswordHash = async (password: string) => {
  const salt = await genSalt()
  return genHash(password, salt)
}

interface ComparePasswordParams {
  password: string
  hash: string
}
export const comparePassword = async ({ password, hash }: ComparePasswordParams) => {
  return compare(password, hash)
}

export const generateEmailHash = async (email: string) => {
  return genHash(email, salt)
}

export const generateTeamHash = async (team: string) => {
  return genHash(team, teamSalt)
}
