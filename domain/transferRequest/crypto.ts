import { decrypt, decryptPII } from 'lib/emissaryCrypto'

// TODO: Type this properly
export async function decryptTransferRequest(transferRequest: any) {
  const [team, amount] = await Promise.all([decryptPII(transferRequest.team), decrypt(transferRequest.amount)])

  return {
    ...transferRequest,
    team,
    amount,
  }
}
