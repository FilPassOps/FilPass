import { XMarkIcon } from '@heroicons/react/24/solid'

import { useAuth } from 'components/Authentication/Provider'
import { Button } from 'components/Shared-tmp/Button'
import { SelectInput } from 'components/Shared-tmp/FormInput'
import { WalletAddress } from 'components/Shared-tmp/WalletAddress'
import _get from 'lodash/get'
import { useMemo, useState } from 'react'
import { Controller } from 'react-hook-form'
import { DeleteWalletAddressModal } from './DeleteWalletAddressModal'

interface SelectWalletInputProps {
  control: any
  errors: any
  submitErrors: any
  applyingForOthersDefaultWallet: {
    wallet_id: string
    wallet_name: string
    wallet_address: string
  }
  onCreateWalletClick: () => void
  blockchainIdFilter: number
  disabled?: boolean
}

interface Wallet {
  id: number
  name?: string | null
  address: string
  blockchain: {
    id: number
    name: string
  }
}

export const SelectWalletInput = ({
  control,
  errors,
  submitErrors,
  applyingForOthersDefaultWallet,
  onCreateWalletClick,
  blockchainIdFilter,
  disabled,
}: SelectWalletInputProps) => {
  const { user } = useAuth()
  const [walletData, setWalletData] = useState<Wallet>()
  const [openDeleteWalletAddressModal, setOpenDeleteWalletAddressModal] = useState(false)

  const defaultWalletWhenEmpty = useMemo(() => {
    if (!applyingForOthersDefaultWallet || !applyingForOthersDefaultWallet?.wallet_id) {
      return
    }

    return {
      name: applyingForOthersDefaultWallet.wallet_name,
      address: applyingForOthersDefaultWallet.wallet_address,
      id: applyingForOthersDefaultWallet.wallet_id,
    }
  }, [applyingForOthersDefaultWallet])

  const walletOptions = useMemo(() => {
    if (!user) {
      return []
    }

    const userWalletOptions = _get(user, 'wallets', [])
      .filter(wallet => wallet.blockchain.id === blockchainIdFilter)
      .map(wallet => {
        return {
          label: (
            <div className="flex items-start gap-1">
              <div className="flex flex-col lg:flex-row lg:gap-1 truncate">
                <div className="flex gap-1 items-center">
                  <WalletAddress
                    address={wallet.address}
                    isVerified={wallet.verification?.isVerified}
                    label={wallet?.name}
                    blockchain={wallet.blockchain.name}
                    shortenLength="short"
                    className="sm:hidden"
                  />
                  <WalletAddress
                    address={wallet.address}
                    isVerified={wallet.verification?.isVerified}
                    label={wallet?.name}
                    blockchain={wallet.blockchain.name}
                    className="hidden sm:flex"
                  />
                </div>
              </div>
            </div>
          ),
          value: wallet.id,
          rightElement: (
            <span
              className="ml-auto cursor-pointer h-6 w-6 bg-gray-200 rounded-full flex items-center justify-center shrink-0"
              onClick={() => {
                setOpenDeleteWalletAddressModal(true)
                setWalletData(wallet)
              }}
            >
              <XMarkIcon className="h-5 w-5 text-indigo-500" />
            </span>
          ),
        }
      }) as any

    // This block of code is used when creating a request for others, and the wallet field is empty. The users default wallet will be selected
    // if he has one for the selected blockchain
    if (defaultWalletWhenEmpty && !user.wallets.some(wallet => wallet.address === defaultWalletWhenEmpty.address)) {
      userWalletOptions.unshift({
        label: defaultWalletWhenEmpty.name || defaultWalletWhenEmpty.address,
        value: Number(defaultWalletWhenEmpty.id),
      })
    }

    return userWalletOptions
  }, [user, defaultWalletWhenEmpty, blockchainIdFilter])

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-4">
        <Controller
          control={control}
          name="userWalletId"
          render={({ field }) => (
            <SelectInput
              id="userWalletId"
              name="userWalletId"
              options={walletOptions}
              placeholder="List of connected and verified addresses"
              label="Wallet Address"
              emptyState="You haven't connected a address. Click Connect Wallet button to connect one."
              error={errors.userWalletId || submitErrors}
              onBlur={field.onBlur}
              onChange={field.onChange}
              ref={field.ref}
              value={field.value}
              disabled={disabled}
            />
          )}
        />
        <Button
          onClick={onCreateWalletClick}
          className={`self-start sm:self-end w-fit sm:full shrink-0 ${errors.userWalletId || submitErrors?.userWalletId ? 'mb-6' : ''}`}
          disabled={disabled}
        >
          Connect Wallet
        </Button>
      </div>

      <DeleteWalletAddressModal
        openModal={openDeleteWalletAddressModal}
        onModalClosed={() => setOpenDeleteWalletAddressModal(false)}
        wallet={walletData}
      />
    </>
  )
}
