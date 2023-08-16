import { PhotoIcon } from '@heroicons/react/24/outline'
import { Divider } from 'components/shared/Divider'
import { NumberInput, SelectInput, TextInput } from 'components/shared/FormInput'
import { StatusBadge } from 'components/shared/Status'
import { WalletAddress } from 'components/shared/WalletAddress'
import { DateTime } from 'luxon'
import { TOKEN } from 'system.config'
import { ProgramInfo } from '../shared/ProgramInfo'
import { RequestorReceiver } from '../shared/RequestorReceiver'
import { useDownloadFile } from '../shared/useDownloadFile'
import { StatusNotes } from './StatusNotes'
import { TransferRequestHistory } from './TransferRequestHistory'

export const EditTransferRequestAsApprover = ({ data, role }) => {
  return (
    <div className="my-8 max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-7">
        <div>
          <h1 className="text-gray-700 font-medium">Transfer Request #{data?.id}</h1>
        </div>
        {data?.status && <StatusBadge status={data.status} />}
      </div>
      <StatusNotes changesRequested={data?.changesRequested} status={data?.status} notes={data?.notes} />

      <Divider className="my-8" />
      <RequestorReceiver
        applyer={data?.applyer}
        issuedOn={data?.created_at}
        receiver={data?.receiver}
        expectedTransferDate={data?.expected_transfer_date || DateTime.now().plus({ days: 30 }).toISO()}
      />

      <Divider className="my-8" />

      <div className="my-8 space-y-6">
        <TextInput label="Program" disabled defaultValue={data?.program_name} />
        <TextInput label="Project Name" disabled defaultValue={data?.team} />
        <SelectInput
          options={[
            {
              label: data?.wallet_id
                ? (() => {
                    return (
                      data?.wallet_address && (
                        <>
                          <WalletAddress
                            address={data.wallet_address}
                            isVerified={data.wallet_is_verified}
                            label={data.wallet_name}
                            walletSize="short"
                            blockchain={TOKEN.name}
                            className="sm:hidden"
                          />
                          <WalletAddress
                            address={data.wallet_address}
                            isVerified={data.wallet_is_verified}
                            label={data.wallet_name}
                            blockchain={TOKEN.name}
                            className="hidden sm:flex"
                          />
                        </>
                      )
                    )
                  })()
                : '-',
              value: data?.wallet_id,
            },
          ]}
          value={data?.wallet_id}
          label="Wallet Address"
          disabled
        />

        <NumberInput
          label={`Request Amount in ${data?.request_unit}`}
          disabled
          rightIcon={data?.request_unit}
          thousandSeparator={true}
          defaultValue={data?.amount}
        />

        <ProgramInfo
          paymentCurrency={{ name: data?.payment_unit }}
          requestCurrency={{ name: data?.request_unit }}
          selectedProgram={{ deliveryMethod: data?.program_delivery_method }}
          expectedTransferDate={data?.expected_transfer_date || DateTime.now().plus({ days: 30 }).toISO()}
        />
        {data?.attachment_id && <ShowAttachment data={data} />}
      </div>
      <Divider />
      {data?.history?.length > 0 && <TransferRequestHistory history={data?.history} role={role} owner={data?.receiver} />}
    </div>
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
