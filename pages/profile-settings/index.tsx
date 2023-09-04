import { PlusCircleIcon } from '@heroicons/react/24/solid'
import { Layout } from 'components/Layout'
import { WalletModal } from 'components/TransferRequest/WalletModal'
import { WalletList } from 'components/User/WalletList'
import { Button } from 'components/shared/Button'
import { findUserByIdAndEmail } from 'domain/user'
import { fetcher } from 'lib/fetcher'
import { getMasterWallet } from 'lib/filecoin'
import { withUserSSR } from 'lib/ssr'
import { ReactElement, useState } from 'react'
import useSWR from 'swr'
import { PLATFORM_NAME } from 'system.config'
import Head from 'next/head'

interface UserSettingsProps {
  data: any
}

export default function UserSettings({ data }: UserSettingsProps) {
  const [openWalletModal, setOpenWalletModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { data: user, mutate: refresh } = useSWR('/auth/me', fetcher, {
    revalidateOnMount: true,
    fallbackData: data,
  })

  const defaultWallet = user?.wallets?.find((wallet: { isDefault: any }) => wallet.isDefault)

  return (
    <>
      <Head>
        <title>{`Profile & Settings - ${PLATFORM_NAME}`}</title>
      </Head>

      <div className="bg-white rounded-lg shadow-md">
        <div className="py-5 px-6">
          <h3 className="text-gray-900 text-lg font-medium mb-1">Wallet Settings</h3>
          <p className="text-gray-500 text-sm font-normal">
            Please connect your wallet addresses and assign one of them as default wallet address.
            <br />
            We may send funds to your default address, so please make sure the address is correct.
          </p>
        </div>
        <div className="flex flex-col lg:flex-row gap-4 px-6 py-5 bg-gray-50 border-t border-gray-200">
          <p className="text-gray-500 text-sm font-medium w-full lg:w-1/3 py-2 md:py-0">Default FIL Wallet Address</p>
          {defaultWallet ? (
            <div>
              <p className="text-sm text-gray-500 break-words">{defaultWallet?.name}</p>
              <p className="text-sm text-gray-900 break-words">{defaultWallet?.address}</p>
            </div>
          ) : (
            <p className="text-gray-400 text-sm w-full md:w-2/3">Set a default wallet address below.</p>
          )}
        </div>
        <div className="flex flex-col lg:flex-row gap-4 px-6 py-5">
          <div className="w-full lg:w-1/3">
            <p className="text-gray-500 text-sm mb-3">Connected Wallet Address</p>
            <Button
              variant="primary"
              className="flex justify-center items-center space-x-2 text-white text-sm w-max"
              onClick={() => setOpenWalletModal(true)}
            >
              <PlusCircleIcon className="h-5 w-5 mr-2" />
              Connect Wallet
            </Button>
          </div>
          <div className="w-full lg:w-2/3">
            <WalletList data={user?.wallets} isLoading={isLoading} setLoading={setIsLoading} refresh={refresh} />
          </div>
        </div>
      </div>

      <WalletModal
        setUserWalletId={() => {}}
        open={openWalletModal}
        onModalClosed={() => {
          refresh()
          setOpenWalletModal(false)
        }}
      />
    </>
  )
}

UserSettings.getLayout = function getLayout(page: ReactElement) {
  return (
    <Layout title="Profile & Settings" containerClass="bg-gray-50 h-screen">
      {page}
    </Layout>
  )
}

export const getServerSideProps = withUserSSR(async function getServerSideProps({ user }) {
  const { data } = await findUserByIdAndEmail({ userId: user.id, email: user.email })
  const masterWallet = getMasterWallet()

  return {
    props: {
      data: JSON.parse(JSON.stringify(data)),
      masterAddress: masterWallet.address,
    },
  }
})
