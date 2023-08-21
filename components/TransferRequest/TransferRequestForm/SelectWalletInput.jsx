import { XMarkIcon } from '@heroicons/react/24/solid'

import { useAuth } from 'components/Authentication/Provider'
import { Button } from 'components/shared/Button'
import { SelectInput } from 'components/shared/FormInput'
import { WalletAddress } from 'components/shared/WalletAddress'
import _get from 'lodash/get'
import { useMemo, useState } from 'react'
import { Controller } from 'react-hook-form'
import { TOKEN } from 'system.config'
import { DeleteWalletAddressModal } from './DeleteWalletAddressModal'

export const SelectWalletInput = ({ control, errors, submitErrors, data, onCreateWalletClick }) => {
  const { user } = useAuth()
  const [walletData, setWalletData] = useState()
  const [openDeleteWalletAddressModal, setOpenDeleteWalletAddressModal] = useState(false)

  const defaultTransferWallet = useMemo(() => {
    if (!data || !data?.wallet_id) {
      return
    }

    return {
      name: data.wallet_name,
      address: data.wallet_address,
      id: data.wallet_id,
    }
  }, [data])

  const walletOptions = useMemo(() => {
    if (!user) {
      return []
    }

    const userWalletOptions = _get(user, 'wallets', []).map(wallet => {
      return {
        label: (
          <div className="flex items-start gap-1">
            <div className="flex flex-col lg:flex-row lg:gap-1 truncate">
              <div className="flex gap-1 items-center">
                <WalletAddress
                  address={wallet.address}
                  isVerified={wallet.verification}
                  label={wallet?.name}
                  blockchain={TOKEN.name}
                  walletSize="short"
                  className="sm:hidden"
                />
                <WalletAddress
                  address={wallet.address}
                  isVerified={wallet.verification}
                  label={wallet?.name}
                  blockchain={TOKEN.name}
                  walletSize="full"
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
    })

    if (defaultTransferWallet && !user.wallets.some(wallet => wallet.address === defaultTransferWallet.address)) {
      userWalletOptions.unshift({
        label: defaultTransferWallet.name || defaultTransferWallet.address,
        value: defaultTransferWallet.id,
      })
    }

    return userWalletOptions
  }, [user, defaultTransferWallet])

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
            />
          )}
        />
        <Button
          onClick={onCreateWalletClick}
          className={`self-start sm:self-end w-fit sm:full shrink-0 ${errors.userWalletId || submitErrors?.userWalletId ? 'mb-6' : ''}`}
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
