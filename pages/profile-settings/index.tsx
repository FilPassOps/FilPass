import { PlusCircleIcon } from '@heroicons/react/24/solid'
import { Layout } from 'components/Layout'
import { WalletModal } from 'components/User/Modal/WalletModal'
import { WalletList } from 'components/User/WalletList'
import { Button } from 'components/Shared/Button'
import { AppConfig } from 'config'
import { getUserByIdAndEmail } from 'domain/user'
import { fetcher } from 'lib/fetcher'
import { withUserSSR } from 'lib/ssr'
import Head from 'next/head'
import { ReactElement, useState } from 'react'
import useSWR from 'swr'
import { Divider } from 'components/Shared/Divider'
import { DeployContractModal } from 'components/User/Modal/DeployContractModal'
import { getContractsByUserId } from 'domain/contracts/get-contracts-by-user-id'
import { ContractList } from 'components/User/ContractList'
import { getPendingContractTransactions } from 'domain/contracts/get-pending-contract-transactions'

interface UserSettingsProps {
  data: any
}

export default function UserSettings({ data }: UserSettingsProps) {
  const [openWalletModal, setOpenWalletModal] = useState(false)
  const [openDeployContractModal, setOpenDeployContractModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { data: user, mutate: refresh } = useSWR('/auth/me', fetcher, {
    revalidateOnMount: true,
    fallbackData: data.user,
  })

  const hasWallets = user?.wallets?.length > 0
  const hasDeployedContract = data.contracts.length > 0

  return (
    <>
      <Head>
        <title>{`Profile & Settings - ${AppConfig.app.name}`}</title>
      </Head>

      <div className="flex flex-col gap-4">
        <div className="bg-white rounded-lg shadow-md">
          <div className="py-5 px-6">
            <h3 className="text-gray-900 text-lg font-medium mb-1">Wallet Settings</h3>
            <p className="text-gray-500 text-sm font-normal">Connected Wallets</p>
          </div>
          <Divider />
          <div className="flex flex-col lg:flex-row gap-4 px-6 py-5">
            <div className="w-full lg:w-1/3 flex justify-start">
              <Button
                variant="primary"
                className="flex justify-center items-center space-x-2 text-white text-sm w-max"
                onClick={() => setOpenWalletModal(true)}
                disabled={hasWallets}
                toolTipText={hasWallets ? 'You already have a wallet connected' : ''}
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

        <div className="bg-white rounded-lg shadow-md">
          <div className="py-5 px-6">
            <h3 className="text-gray-900 text-lg font-medium mb-1">Contract Settings</h3>
            <p className="text-gray-500 text-sm font-normal">Deployed Contract</p>
          </div>
          <Divider />
          <div className="flex flex-col lg:flex-row gap-4 px-6 py-5">
            <div className="w-full lg:w-1/3 flex justify-start">
              <Button
                variant="primary"
                className="flex justify-center items-center space-x-2 text-white text-sm w-max"
                onClick={() => setOpenDeployContractModal(true)}
                disabled={hasDeployedContract || data.pendingContractTransactions.length > 0}
                toolTipText={
                  hasDeployedContract
                    ? 'You already have a contract deployed'
                    : data.pendingContractTransactions.length > 0
                    ? 'Your contract deployment is in progress'
                    : ''
                }
              >
                <PlusCircleIcon className="h-5 w-5 mr-2" />
                Deploy Contract
              </Button>
            </div>
            <div className="w-full lg:w-2/3">
              <ContractList
                data={data.contracts}
                isLoading={isLoading}
                setLoading={setIsLoading}
                refresh={refresh}
                deployContractTransaction={data.pendingContractTransactions[0]}
              />
            </div>
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
        chainIdFilter={undefined}
      />

      <DeployContractModal
        open={openDeployContractModal}
        onModalClosed={() => setOpenDeployContractModal(false)}
        contractAddress={data.contracts[0]?.address}
        wallets={data.user.wallets}
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
  const { data } = await getUserByIdAndEmail({ userId: user.id, email: user.email })

  const { data: contracts } = await getContractsByUserId({ userId: user.id })

  const { data: pendingContractTransactions } = await getPendingContractTransactions({ userId: user.id })

  return {
    props: {
      data: {
        user: JSON.parse(JSON.stringify(data)),
        contracts: JSON.parse(JSON.stringify(contracts)),
        pendingContractTransactions: JSON.parse(JSON.stringify(pendingContractTransactions)),
      },
    },
  }
})
