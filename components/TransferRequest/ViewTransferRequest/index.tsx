import { PhotoIcon } from '@heroicons/react/24/outline'
import { Divider } from 'components/Shared/Divider'
import { NumberInput, SelectInput, TextInput } from 'components/Shared/FormInput'
import { StatusBadge } from 'components/Shared/Status'
import {
  REJECTED_BY_APPROVER_STATUS,
  REJECTED_BY_CONTROLLER_STATUS,
  SUBMITTED_BY_APPROVER_STATUS,
  SUBMITTED_STATUS,
} from 'domain/transfer-request/constants'
import { DateTime } from 'luxon'
import { ProgramInfo } from '../Shared/ProgramInfo'
import { RequestorReceiver } from '../Shared/RequestorReceiver'
import { useDownloadFile } from '../../../hooks/useDownloadFile'

import { WalletAddress } from 'components/Shared/WalletAddress'
import { APPROVER_ROLE } from 'domain/auth/constants'
import { REJECTED } from 'domain/transfer-request-review/constants'
import { BannedUserReason } from './BannedUserReason'
import { StatusNotes } from './StatusNotes'
import { TransferRequestHistory } from './TransferRequestHistory'

export interface ViewTransferRequestProps {
  data: {
    approversGroup: {
      groupId: string
      approved: number
      members: {
        email: string
        userRoleId: number
      }[]
    }[]
    status: string
    changesRequested: any[]
    notes: string
    banActionedBy: string
    id: string
    program_name: string
    team: string
    wallet_id: string
    wallet_address: string
    wallet_is_verified: boolean
    wallet_name: string
    request_unit: string
    payment_unit: string
    expected_transfer_date: string
    amount: number
    created_at: string
    receiver: string
    receiver_is_banned: boolean
    attachment_id: string
    attachment_filename: string
    attachment_uploader_email: string
    attachment_user_email: string
    history: any
    applyer: string
    isVoidable?: boolean
    isEditable?: boolean
    applyer_id?: number
    wallet_blockchain_name: string
  }
  role: string
}

interface ShowAttachmentProps {
  data: any
}

export const ViewTransferRequest = ({ data, role }: ViewTransferRequestProps) => {
  const { approversGroup, status } = data

  const hasGroupApproval = approversGroup?.some(group => group.approved)
  const rejected = [REJECTED, REJECTED_BY_APPROVER_STATUS, REJECTED_BY_CONTROLLER_STATUS].includes(status)
  const submitted = [SUBMITTED_STATUS, SUBMITTED_BY_APPROVER_STATUS].includes(status)
  const isApprover = role === APPROVER_ROLE

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-4 max-w-3xl mx-auto">
        {(submitted || hasGroupApproval) &&
          !rejected &&
          role &&
          approversGroup?.length > 1 &&
          approversGroup
            .sort(group => group.approved)
            .map(group => {
              return (
                <div
                  key={group.groupId}
                  className={`border-l-4 pl-2 sm:pl-0 sm:border-l-0 sm:border-t-4 w-60 first:mt-5 sm:first:mt-0 py-2 sm:py-0 ${
                    group.approved ? 'border-green-700' : 'border-gray-200'
                  }`}
                >
                  <p className="text-green-700 sm:pt-4 ">{group.approved ? 'Approved by' : 'Waiting for approval'}</p>
                  {group.members.map(member => (
                    <p className="break-all" key={member.email}>
                      {member.email}
                    </p>
                  ))}
                </div>
              )
            })}
      </div>
      <div className="my-8 max-w-3xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center items-start mb-7 gap-3 sm:gap-0">
          <div>
            <h1 className="text-gray-700 font-medium">Transfer Request #{data?.id}</h1>
          </div>
          <div className="flex sm:ml-auto">{data?.status && <StatusBadge status={status} />}</div>
        </div>
        <StatusNotes changesRequested={data?.changesRequested} status={data?.status} notes={data?.notes} />
        {data?.receiver_is_banned && <BannedUserReason bannedAuthor={data?.banActionedBy} />}

        <Divider className="my-8" />
        <RequestorReceiver
          applyer={data?.applyer}
          issuedOn={data?.created_at}
          receiver={data?.receiver}
          expectedTransferDate={data?.expected_transfer_date || (DateTime.now().plus({ days: 30 }).toISO() as string)}
        />

        <Divider className="my-8" />

        <div className="my-8 space-y-6">
          <TextInput name="program" label="Program" disabled defaultValue={data?.program_name} />
          <TextInput name="projectName" label="Project Name" disabled defaultValue={data?.team} />
          {data?.wallet_id && data?.wallet_address ? (
            <SelectInput
              value={data.wallet_id}
              label="Wallet Address"
              name="walletAddress"
              disabled
              options={[
                {
                  label: (
                    <>
                      <WalletAddress
                        address={data.wallet_address}
                        isVerified={data.wallet_is_verified}
                        label={data.wallet_name}
                        blockchain={data.wallet_blockchain_name}
                        shortenLength="very-short"
                        className="sm:hidden"
                      />
                      <WalletAddress
                        address={data.wallet_address}
                        isVerified={data.wallet_is_verified}
                        label={data.wallet_name}
                        blockchain={data.wallet_blockchain_name}
                        className="hidden sm:flex"
                      />
                    </>
                  ),
                  value: data?.wallet_id,
                },
              ]}
            />
          ) : (
            <TextInput name="wallet" label="Wallet Address" disabled defaultValue="-" />
          )}

          <NumberInput
            label={`Request Amount in ${data?.request_unit}`}
            disabled
            rightIcon={data?.request_unit}
            thousandSeparator={true}
            defaultValue={data?.amount}
            name="amount"
          />

          <ProgramInfo
            paymentCurrency={{ name: data?.payment_unit }}
            requestCurrency={{ name: data?.request_unit }}
            expectedTransferDate={data?.expected_transfer_date || (DateTime.now().plus({ days: 30 }).toISO() as string)}
          />
          {isApprover && (
            <div className="p-4 text-sm rounded-lg text-gamboge-orange bg-papaya-whip">
              Please double-check the requestor&apos;s email address to make sure that this is not an impersonated email address
            </div>
          )}
          {data?.attachment_id && <ShowAttachment data={data} />}
        </div>
        <Divider />
        {data?.history?.length > 0 && <TransferRequestHistory history={data?.history} role={role} owner={data?.receiver} />}
      </div>
    </>
  )
}

const ShowAttachment = ({ data }: ShowAttachmentProps) => {
  const { handleDownloadFile } = useDownloadFile({ fileId: data?.attachment_id, fileName: data?.attachment_filename })

  return (
    <div>
      <p className="text-sm mb-1">Attachment</p>
      <div className="flex items-center justify-between">
        <div className="w-max">
          <div className="flex flex-row text-green-700 text-sm font-bold hover:underline cursor-pointer" onClick={handleDownloadFile}>
            <PhotoIcon width={20} height={20} className="mr-2 text-gray-900" />
            {data?.attachment_filename}
          </div>
        </div>
        <p className="text-gray-500 text-sm">Uploaded by: {data?.attachment_uploader_email || data?.attachment_user_email}</p>
      </div>
    </div>
  )
}
