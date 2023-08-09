import { SANCTION_CHECK_ENABLED } from 'system.config'

export interface SanctionCheckResult {
  isSanctioned: boolean | null
  sanctionReason: string | null
}

export interface SanctionCheckParams {
  firstName: string
  lastName: string
  dateOfBirth: Date
  email: string
  countryResidence: string
}

async function baseCheckSanction() {
  return {
    isSanctioned: false,
    sanctionReason: null,
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function checkSanction(params: SanctionCheckParams): Promise<SanctionCheckResult> {
  if (!SANCTION_CHECK_ENABLED) return { isSanctioned: false, sanctionReason: null }
  return await baseCheckSanction()
}
