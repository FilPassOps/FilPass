import { DocumentTextIcon, PhotoIcon } from '@heroicons/react/24/outline'
import { Divider } from 'components/shared/Divider'
import { NumberInput, SelectInput, TextInput } from 'components/shared/FormInput'
import { LoadingIndicator } from 'components/shared/LoadingIndicator'
import { StatusBadge } from 'components/shared/Status'
import {
  REJECTED_BY_APPROVER_STATUS,
  REJECTED_BY_CONTROLLER_STATUS,
  SUBMITTED_BY_APPROVER_STATUS,
  SUBMITTED_STATUS,
} from 'domain/transferRequest/constants'
import { classNames } from 'lib/classNames'
import { DateTime } from 'luxon'
import { FormTooltip } from '../shared/FormTooltip'
import { ProgramInfo } from '../shared/ProgramInfo'
import { RequestorReceiver } from '../shared/RequestorReceiver'
import { useDownloadFile } from '../shared/useDownloadFile'

import { WalletAddress } from 'components/shared/WalletAddress'
import { APPROVER_ROLE } from 'domain/auth/constants'
import { REJECTED } from 'domain/transferRequestReview/constants'
import { BannedUserReason } from './BannedUserReason'
import { StatusNotes } from './StatusNotes'
import { TransferRequestHistory } from './TransferRequestHistory'

import useDelegatedAddress, { WalletSize } from 'components/web3/useDelegatedAddress'
import { shortenAddress } from 'lib/shortenAddress'

const SHORT_WITH_DOTS = WalletSize.SHORT + 3

export const ViewTransferRequest = ({ data, role, showLegacyWarning }) => {
  const { loadingFile, fileError, handleDownloadFile } = useDownloadFile({ fileId: data?.form_id, fileName: data?.form_filename })
  const { approversGroup, status } = data

  const hasGroupApproval = approversGroup?.some(group => group.approved)
  const rejected = [REJECTED, REJECTED_BY_APPROVER_STATUS, REJECTED_BY_CONTROLLER_STATUS].includes(status)
  const submitted = [SUBMITTED_STATUS, SUBMITTED_BY_APPROVER_STATUS].includes(status)
  const isApprover = role === APPROVER_ROLE

  const getDelegatedAddress = useDelegatedAddress()

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
                    group.approved ? 'border-indigo-600' : 'border-gray-200'
                  }`}
                >
                  <p className="text-indigo-600 sm:pt-4 ">{group.approved ? 'Approved by' : 'Waiting for approval'}</p>
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
          expectedTransferDate={data?.expected_transfer_date || DateTime.now().plus({ days: 30 }).toISO()}
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
                        address={
                          data.wallet_address.length > SHORT_WITH_DOTS
                            ? shortenAddress(data.wallet_address, WalletSize.SHORT)
                            : data.wallet_address
                        }
                        isVerified={data.wallet_is_verified}
                        delegatedAddress={data.delegated_address || getDelegatedAddress(data.wallet_address)?.shortAddress}
                        label={data.wallet_name}
                        className="sm:hidden"
                      />
                      <WalletAddress
                        address={data.wallet_address}
                        isVerified={data.wallet_is_verified}
                        delegatedAddress={data.delegated_address || getDelegatedAddress(data.wallet_address)?.fullAddress}
                        label={data.wallet_name}
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

          {!!data?.vesting_start_epoch && <TextInput label="Vesting Start Epoch" disabled defaultValue={data.vesting_start_epoch} />}

          {!!data?.vesting_months && <TextInput label="Vesting Month" disabled defaultValue={data.vesting_months} />}

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
            selectedProgram={{ deliveryMethod: data?.program_delivery_method }}
            expectedTransferDate={data?.expected_transfer_date || DateTime.now().plus({ days: 30 }).toISO()}
          />
          {data?.form_type && data?.form_filename && (
            <div>
              <div className="flex space-x-1">
                <p className="text-sm font-medium leading-5 text-gray-700">Form {data?.form_type === 'W9_FORM' ? 'W9' : 'W8'}</p>
                <FormTooltip type={data?.form_type} />
              </div>

              <div className="flex items-center justify-between mt-2.5">
                <div className="flex items-center">
                  <DocumentTextIcon className="w-6 h-6 mr-2 shrink-0" />
                  <button
                    className={classNames(
                      'text-sm text-indigo-500 font-bold hover:underline cursor-pointer',
                      loadingFile && 'opacity-50 cursor-wait'
                    )}
                    disabled={loadingFile}
                    onClick={handleDownloadFile}
                  >
                    {data?.form_filename}
                  </button>
                  {loadingFile && <LoadingIndicator className="text-indigo-500 ml-2" />}
                </div>
                <p className="text-gray-500 text-sm">Uploaded by: {data?.form_uploader_email || data?.form_user_email}</p>
              </div>
              {fileError && <p className="text-red-500 text-sm">Failed to load file. Please, try again.</p>}
            </div>
          )}
          {showLegacyWarning && <StatusNotes status="LEGACY" />}
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

const ShowAttachment = ({ data }) => {
  const { handleDownloadFile } = useDownloadFile({ fileId: data?.attachment_id, fileName: data?.attachment_filename })

  return (
    <div>
      <p className="text-sm mb-1">Attachment</p>
      <div className="flex items-center justify-between">
        <div className="w-max">
          <div className="flex flex-row text-purple-500 text-sm font-bold hover:underline cursor-pointer" onClick={handleDownloadFile}>
            <PhotoIcon width={20} height={20} className="mr-2 text-gray-900" />
            {data?.attachment_filename}
          </div>
        </div>
        <p className="text-gray-500 text-sm">Uploaded by: {data?.attachment_uploader_email || data?.attachment_user_email}</p>
      </div>
    </div>
  )
}
