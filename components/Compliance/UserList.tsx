import { InformationCircleIcon } from '@heroicons/react/24/outline'
import { WalletVerification } from '@prisma/client'
import { Button } from 'components/shared/Button'
import Sortable from 'components/shared/Sortable'
import { Cell, Header, Table, TableBody, TableHead } from 'components/shared/Table'
import { WalletAddress } from 'components/shared/WalletAddress'
import useDelegatedAddress from 'components/web3/useDelegatedAddress'

interface UserListProps {
  data: {
    id: number
    email?: string
    firstName?: string
    lastName?: string
    dateOfBirth?: string
    countryResidence?: string
    sanctionReason?: string
    isSanctioned?: boolean
    isReviewedByCompliance?: boolean
    wallets: { address: string; verification: WalletVerification }[]
  }[]
  status: 'FLAGGED' | 'BLOCKED' | 'UNBLOCKED' | 'ALL'
  handleOnUnblockClick: (userId: number) => void
  handleOnBlockClick: (userId: number) => void
  handleOnViewClick: (reason: string) => void
}

const getStatus = (isSanctioned: boolean, isReviewedByCompliance: boolean) => {
  if (isSanctioned) {
    if (isReviewedByCompliance) {
      return 'Blocked'
    } else {
      return 'Flagged'
    }
  } else {
    if (isReviewedByCompliance) {
      return 'Unblocked'
    } else {
      return 'Not Flagged'
    }
  }
}

export const UserList = ({ data, status, handleOnUnblockClick, handleOnBlockClick, handleOnViewClick }: UserListProps) => {
  const getDelegatedAddress = useDelegatedAddress()

  return (
    <div className="flex flex-col relative py-4">
      {/* @ts-ignore */}
      <Table>
        <TableHead>
          <tr>
            <Header style={{ width: '5%' }}>User ID</Header>
            {/* @ts-ignore */}
            <Header style={{ width: '20%' }}>
              <Sortable by={'email_pq'}>Email</Sortable>
            </Header>
            {/* @ts-ignore */}
            <Header style={{ width: '10%' }}>First Name</Header>
            {/* @ts-ignore */}
            <Header style={{ width: '10%' }}>Last Name</Header>
            {/* @ts-ignore */}
            <Header style={{ width: '10%' }}>Date of Birthday</Header>
            {/* @ts-ignore */}
            <Header style={{ width: '10%' }}>Residence</Header>
            {/* @ts-ignore */}
            <Header style={{ width: '15%', minWidth: '400px' }}>Wallet</Header>
            {/* @ts-ignore */}
            <Header style={{ width: '10%' }}>Reason</Header>
            {/* @ts-ignore */}
            {status === 'ALL' && <Header style={{ width: '10%' }}>Status</Header>}
            {/* @ts-ignore */}
            {status !== 'ALL' && <Header style={{ width: '10%' }}></Header>}
          </tr>
        </TableHead>
        <TableBody>
          {data.map(user => {
            const delegatedAddress = getDelegatedAddress(user.wallets[0]?.address)
            return (
              <tr key={user.id}>
                {/* @ts-ignore */}
                <Cell className="break-all">{user.id}</Cell>
                {/* @ts-ignore */}
                <Cell className="break-all">{user.email}</Cell>
                {/* @ts-ignore */}
                <Cell className="break-all">{user.firstName}</Cell>
                {/* @ts-ignore */}
                <Cell className="break-all">{user.lastName}</Cell>
                {/* @ts-ignore */}
                <Cell className="break-all">{user.dateOfBirth}</Cell>
                {/* @ts-ignore */}
                <Cell className="break-all">{user.countryResidence}</Cell>
                {/* @ts-ignore */}
                <Cell className="break-all">
                  <WalletAddress
                    address={user.wallets[0]?.address}
                    delegatedAddress={delegatedAddress?.fullAddress}
                    isVerified={user.wallets[0]?.verification?.isVerified}
                  />
                </Cell>
                {/* @ts-ignore */}
                <Cell className="break-all">
                  {user.sanctionReason ? (
                    <button className="flex items-center justify-center gap-1" onClick={() => handleOnViewClick(user.sanctionReason || '')}>
                      View
                      <InformationCircleIcon width={16} height={16} className="text-indigo-800" />
                    </button>
                  ) : (
                    '-'
                  )}
                </Cell>
                {/* @ts-ignore */}
                {status === 'ALL' && <Cell className={`break-all`}>{getStatus(user.isSanctioned, user.isReviewedByCompliance)}</Cell>}
                {/* @ts-ignore */}
                {status !== 'ALL' && (
                  <Cell className="flex gap-2" style={{ minWidth: 215 }}>
                    {/* @ts-ignore */}
                    {(status === 'FLAGGED' || status === 'BLOCKED') && (
                      <Button variant="outline-green" onClick={() => handleOnUnblockClick(user.id)}>
                        Unblock
                      </Button>
                    )}
                    {/* @ts-ignore */}
                    {(status === 'FLAGGED' || status === 'UNBLOCKED') && (
                      <Button variant="outline-red" onClick={() => handleOnBlockClick(user.id)}>
                        Block
                      </Button>
                    )}
                  </Cell>
                )}
              </tr>
            )
          })}
        </TableBody>
      </Table>
      {data.length === 0 && (
        <p className="text-center text-sm space-y-7 py-7 text-gray-800 bg-white border border-gray-100 rounded-sm">No data</p>
      )}
    </div>
  )
}
