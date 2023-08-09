import { decrypt, decryptPII } from 'lib/emissaryCrypto'

export async function decryptTransferRequest(transferRequest) {
  const [team, amount] = await Promise.all([decryptPII(transferRequest.team), decrypt(transferRequest.amount)])

  return {
    ...transferRequest,
    team,
    amount,
  }
}
