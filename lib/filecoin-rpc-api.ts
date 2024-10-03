import axios from 'axios'

export const filecoinRpcApi = axios.create({
  baseURL: 'https://api.calibration.node.glif.io/rpc/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
})

export const stateMinerInfo = async (walletAddress: string) => {
  try {
    const response = await filecoinRpcApi.post('', {
      jsonrpc: '2.0',
      method: 'Filecoin.StateMinerInfo',
      params: [walletAddress, null],
      id: 1,
    })

    return response.data
  } catch (error) {
    console.error(error)
  }
}
