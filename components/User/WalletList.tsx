import { Tooltip } from 'components/Layout/Tooltip'
import { DeleteWalletAddressModal } from 'components/TransferRequest/TransferRequestForm/DeleteWalletAddressModal'
import { LoadingIndicator } from 'components/shared/LoadingIndicator'
import { WalletAddress } from 'components/shared/WalletAddress'
import { WarningPopup } from 'components/shared/WarningPopup'
import { api } from 'lib/api'
import { classNames } from 'lib/classNames'
import { useState } from 'react'
import errorsMessages from 'wordings-and-errors/errors-messages'

interface Wallet {
  id: number
  address: string
  name: string
  isDefault: boolean
  verification: {
    isVerified: boolean
  }
  blockchain: {
    name: string
  }
}

interface WalletListProps {
  data?: Wallet[]
  isLoading?: boolean
  setLoading: (loading: boolean) => void
  refresh: () => void
}

interface ListItemsProps {
  items: Wallet[]
  isLoading?: boolean
  setLoading: (loading: boolean) => void
  refresh: () => void
}

export const WalletList = ({ data = [], isLoading, setLoading, refresh }: WalletListProps) => {
  if (!data.length) {
    return <p className="text-sm">You haven&apos;t connected an address. Click Connect Wallet button to connect one.</p>
  }
  return (
    <section className="border-gray-200 border rounded-md overflow-hidden w-full">
      <ListItems items={data} isLoading={isLoading} setLoading={setLoading} refresh={refresh} />
    </section>
  )
}

const ListItems = ({ items, isLoading, setLoading, refresh }: ListItemsProps) => {
  const [currentWallet, setcurrentWallet] = useState<Wallet>()
  const [openDeleteModal, setOpenDeleteModal] = useState(false)
  const [openWarningPopup, setOpenWarningPopup] = useState(false)

  const handleRemove = (wallet: Wallet) => {
    if (wallet.isDefault) {
      return alert(`You can't remove the wallet because it is a default wallet, please assign another default wallet to continue.`)
    }
    setcurrentWallet(wallet)
    setOpenDeleteModal(true)
  }

  const handeSetDefault = async (wallet: Wallet) => {
    setLoading(true)
    setcurrentWallet(wallet)
    const { error } = await api.post('/wallets/set-default', { id: wallet.id })
    if (error) {
      setLoading(false)
      return alert(error.message || errorsMessages.something_went_wrong.message)
    }

    setOpenWarningPopup(true)
    setLoading(false)
  }

  return (
    <>
      {items.map((wallet, index) => {
        const disableEthereum = wallet.address.startsWith('0x') || wallet.address.startsWith('f4') || wallet.address.startsWith('t4')
        const hoverMessage = disableEthereum
          ? errorsMessages.invalid_default_wallet_ethereum.message
          : wallet.isDefault
          ? 'The wallet is already set as default'
          : undefined

        return (
          <div key={wallet.id} className={`flex flex-col gap-1 px-3 py-4 ${index > 0 ? 'border-t border-gray-200' : ''}`}>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-sm flex-1">
              <>
                <WalletAddress
                  address={wallet.address}
                  isVerified={wallet.verification?.isVerified}
                  label={wallet.name}
                  blockchain={wallet.blockchain.name}
                  walletSize="short"
                  className="sm:hidden"
                />
                <WalletAddress
                  address={wallet.address}
                  isVerified={wallet.verification?.isVerified}
                  label={wallet.name}
                  blockchain={wallet.blockchain.name}
                  walletSize="full"
                  className="hidden sm:flex"
                />
              </>
              <div className="flex items-center">
                <div>{isLoading && wallet.id === currentWallet?.id && <LoadingIndicator className="mr-3 text-indigo-600" />}</div>
                <div className="text-sm pr-4 border-r border-gray-200">
                  <Tooltip content={hoverMessage}>
                    <button
                      className={classNames(
                        wallet.isDefault || disableEthereum ? 'text-gray-400 pointer-events-auto' : 'text-indigo-600 hover:underline',
                      )}
                      onClick={() => handeSetDefault(wallet)}
                      disabled={wallet.isDefault || isLoading || disableEthereum}
                    >
                      Set as default
                    </button>
                  </Tooltip>
                </div>
                <div className="text-sm ml-4">
                  <button className="text-red-600 hover:underline" onClick={() => handleRemove(wallet)} disabled={isLoading}>
                    Remove
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      })}

      <DeleteWalletAddressModal
        openModal={openDeleteModal}
        onModalClosed={() => {
          setOpenDeleteModal(false)
          setTimeout(() => setcurrentWallet(undefined), 500)
          refresh()
        }}
        wallet={currentWallet}
      />

      <WarningPopup
        isOpen={openWarningPopup}
        setIsOpen={() => setOpenWarningPopup(false)}
        title="Setting default wallet"
        message="Please check your email inbox and confirm the change"
      />
    </>
  )
}
