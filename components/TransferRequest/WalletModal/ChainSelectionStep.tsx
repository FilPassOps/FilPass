import { Button } from 'components/shared/Button'
import { WithMetaMaskButton } from 'components/web3/MetaMaskProvider'
import { getChainByName, isFilecoinEnabled } from 'system.config'

interface ChainSelectionProps {
  onConnectionMethodClick: (method: 'Metamask' | 'Filecoin') => void
  blockchain: string
}

export function ChainSelection({ onConnectionMethodClick, blockchain }: ChainSelectionProps) {
  const chainId = getChainByName(blockchain)?.chainId
  return (
    <div className="w-full h-full flex flex-col justify-center items-center sm:py-2 sm:px-11">
      <p className="font-medium text-lg text-gray-900 text-center mb-2">Connect Wallet</p>
      <p className="font-normal text-sm text-gray-500 text-center">Connect a default wallet address.</p>
      <div className="flex flex-col w-full gap-6 mt-6">
        <WithMetaMaskButton
          className="w-full"
          buttonStyle="flex gap-2 justify-center items-center"
          onClick={() => onConnectionMethodClick('Metamask')}
          targetChainId={chainId}
          connectWalletLabel={
            <>
              Connect with MetaMask
              <br />
              (0x and f4 wallets)
            </>
          }
        >
          Continue with MetaMask
          <br />
          (0x and f4 wallets)
        </WithMetaMaskButton>
        {isFilecoinEnabled && (
          <>
            {/* @ts-ignore */}
            <Button variant="primary-lighter" onClick={() => onConnectionMethodClick('Filecoin')}>
              Connect Manually
              <br />
              (f1, f2, and f3 wallets)
            </Button>
            <small className="text-gray-500 text-center font-normal mt-2">*Manually connecting a wallet can lead to errors</small>
          </>
        )}
      </div>
    </div>
  )
}
