import config from '../../chains.config'
import { useMetaMask } from './MetaMaskProvider'

export const ChainBanner = () => {
  const { chainId, wallet, switchChain } = useMetaMask()

  if (wallet && chainId !== config.chain.chainId) {
    return (
      <p className="flex items-center justify-center gap-2 px-4 py-2 bg-yellow-400">
        Looks like you are not connected to Filecoin.
        <button className="font-bold underline" onClick={() => switchChain()}>
          Please switch your network
        </button>
      </p>
    )
  }

  return null
}
