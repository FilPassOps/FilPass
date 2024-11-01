import { Contract, DeployContractTransaction } from '@prisma/client'
import { AppConfig } from 'config/system'

interface ContractListProps {
  data?: Contract[]
  isLoading?: boolean
  deployContractTransaction?: DeployContractTransaction
  setLoading: (loading: boolean) => void
  refresh: () => void
}

interface ListItemsProps {
  items: Contract[]
  isLoading?: boolean
  setLoading: (loading: boolean) => void
  refresh: () => void
}

const { network } = AppConfig.network.getFilecoin()

export const ContractList = ({ data = [], isLoading, setLoading, refresh, deployContractTransaction }: ContractListProps) => {
  if (deployContractTransaction) {
    return (
      <p className="text-sm">
        Your contract deployment is currently <strong className=" text-yellow-500">in progress</strong>.{' '}
        <a
          href={`${network?.blockExplorer.url}/${deployContractTransaction.transactionHash}`}
          rel="noreferrer"
          target="_blank"
          className="underline text-green-700"
        >
          Check your transaction status here
        </a>
      </p>
    )
  }

  if (!data.length) {
    return <p className="text-sm">You haven&apos;t deployed any contracts. Click Deploy Contract button to deploy one.</p>
  }
  return (
    <section className="border-gray-200 border rounded-md overflow-hidden w-full">
      <ListItems items={data} isLoading={isLoading} setLoading={setLoading} refresh={refresh} />
    </section>
  )
}

const ListItems = ({ items }: ListItemsProps) => {
  return (
    <>
      {items.map((contract, index) => {
        return (
          <div key={contract.id} className={`flex flex-col gap-1 px-3 py-4 ${index > 0 ? 'border-t border-gray-200' : ''}`}>
            <div className="flex flex-col items-start justify-between gap-1 text-sm flex-1">
              <p className="text-gray-500 text-sm">Contract Address</p>
              <p>{contract.address}</p>
            </div>
          </div>
        )
      })}
    </>
  )
}
