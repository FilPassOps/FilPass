import { useState } from 'react'
import { DeleteWalletAddressModal } from './Modal/DeleteWalletAddressModal'

export interface Wallet {
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

const ListItems = ({ items, refresh }: ListItemsProps) => {
  const [currentWallet, setcurrentWallet] = useState<Wallet>()
  const [openDeleteModal, setOpenDeleteModal] = useState(false)

  return (
    <>
      {items.map((wallet, index) => {
        return (
          <div key={wallet.id} className={`flex flex-col gap-1 px-3 py-4 ${index > 0 ? 'border-t border-gray-200' : ''}`}>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-sm flex-1">
              <div key={wallet.id} className={`flex flex-col gap-1  ${index > 0 ? 'border-t border-gray-200' : ''}`}>
                <div className="flex flex-col items-start justify-between gap-1 text-sm flex-1">
                  <p className="text-gray-500 text-sm">Wallet Address</p>
                  <p>{wallet.address}</p>
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
    </>
  )
}
