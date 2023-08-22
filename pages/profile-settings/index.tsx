import { DocumentMagnifyingGlassIcon, DocumentTextIcon, PlusCircleIcon } from '@heroicons/react/24/solid'
import { yupResolver } from '@hookform/resolvers/yup'
import { Layout } from 'components/Layout'
import { PageAlert, useAlertDispatcher } from 'components/Layout/Alerts'
import { TaxForm } from 'components/ProfileSettings/TaxForm'
import { WalletModal } from 'components/TransferRequest/WalletModal'
import { useDownloadFile } from 'components/TransferRequest/shared/useDownloadFile'
import PersonalInformationFieldGroup, { PersonalInformationFieldGroupValues } from 'components/User/PersonalInformationFieldGroup'
import { WalletList } from 'components/User/WalletList'
import { Button } from 'components/shared/Button'
import { StatusBadge } from 'components/shared/Status'
import { findUserByIdAndEmail, findUserTaxForm } from 'domain/user'
import { personalInformationCheckValidator } from 'domain/user/validation'
import { api } from 'lib/api'
import { classNames } from 'lib/classNames'
import { fetcher } from 'lib/fetcher'
import { getMasterWallet } from 'lib/filecoin'
import { withUserSSR } from 'lib/ssr'
import { DateTime } from 'luxon'
import { ReactElement, useState } from 'react'
import { useForm } from 'react-hook-form'
import useSWR from 'swr'
import yup from 'lib/yup'
import { PLATFORM_NAME } from 'system.config'
import { taxFormValidator } from 'domain/user/validation'

type FormValuePersonal = PersonalInformationFieldGroupValues

type FormValueTax = yup.Asserts<typeof taxFormValidator>

interface UserSettingsProps {
  data: any
  taxForm: FormValuePersonal
}

export default function UserSettings({ data, taxForm }: UserSettingsProps) {
  const { piiUpdatedAt } = data
  const [openWalletModal, setOpenWalletModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { dispatch } = useAlertDispatcher()
  const { data: user, mutate: refresh } = useSWR('/auth/me', fetcher, {
    revalidateOnMount: true,
    fallbackData: data,
  })
  const [lastUpdate, setLastUpdate] = useState(piiUpdatedAt ? DateTime.fromISO(piiUpdatedAt) : undefined)
  const [defaultTaxForm, setDefaultTaxForm] = useState(taxForm)

  const {
    loadingFile: defaultFormLoading,
    fileError: defaultFormError,
    handleDownloadFile: openDefaultForm,
  } = useDownloadFile({ fileId: defaultTaxForm?.publicId || '', fileName: defaultTaxForm?.filename })

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting, isDirty },
    reset,
  } = useForm<FormValuePersonal>({
    resolver: yupResolver(personalInformationCheckValidator),
    defaultValues: {
      firstName: data?.firstName || '',
      lastName: data?.lastName || '',
      dateOfBirth: data?.dateOfBirth || '',
      countryResidence: data?.countryResidence || '',
    },
    shouldFocusError: true,
  })

  const handlePIISubmit = async (values: { dateOfBirth: any }) => {
    const dob = values.dateOfBirth
    const year = dob.getFullYear()
    const month = dob.getMonth()
    const day = dob.getDate()
    const utcDoB = new Date(Date.UTC(year, month, day))
    const result = await api.post('/users/current', { pii: { ...values, dateOfBirth: utcDoB } })
    if (result.status === 200) {
      setLastUpdate(DateTime.fromISO(result.data.piiUpdatedAt))
      dispatch({
        type: 'success',
        title: 'Personal information updated!',
        config: {
          timeout: 3000,
          closeable: true,
        },
      })
    } else if (result.error?.status === 412) {
      dispatch({
        type: 'error',
        title: 'You can only change this information once every 30 days!',
        config: {
          timeout: 5000,
          closeable: true,
        },
      })
    } else {
      dispatch({
        type: 'error',
        title: 'Something went wrong. Please try again.',
        config: {
          timeout: 5000,
          closeable: true,
        },
      })
    }
  }

  const handleTaxFormSubmit = async (values: FormValueTax) => {
    const result = await api.post('/users/current/update-tax-info', { taxForm: values })

    if (result.status === 200) {
      setDefaultTaxForm(result.data)
      dispatch({
        type: 'success',
        title: 'Tax Documents updated!',
        config: {
          timeout: 3000,
          closeable: true,
        },
      })
    } else {
      dispatch({
        type: 'error',
        title: 'Something went wrong. Please try again.',
        config: {
          timeout: 3000,
          closeable: true,
        },
      })
    }
  }

  const defaultWallet = user?.wallets?.find((wallet: { isDefault: any }) => wallet.isDefault)

  return (
    <>
      {defaultTaxForm?.rejectionReason && (
        <PageAlert type="error" withIcon={false} className="mb-8">
          <span className="flex flex-col gap-2">
            <strong className="font-bold">
              <p>Your tax document was rejected for the reason below. Make any suggested changes and upload a new document.</p>
            </strong>
            <p className="whitespace-pre-line">{defaultTaxForm.rejectionReason}</p>
          </span>
        </PageAlert>
      )}

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
      <div className="bg-white rounded-lg shadow-md mt-6">
        <div className="py-5 px-6">
          <h3 className="text-gray-900 text-lg font-medium mb-1">Personal Information</h3>
          <p className="text-gray-500 text-sm font-normal">
            Any update to your personal information will be verified to make sure you can legally receive requests of FIL.
            <br />
            You can only change this information once every 30 days
            {lastUpdate ? ` (Last Update: ${lastUpdate.toLocaleString(DateTime.DATE_SHORT)})` : ''}.
          </p>
        </div>
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-5">
          <form className="flex flex-col gap-2 md:grid auto-rows-min grid-cols-2 gap-x-3 gap-y-6" onSubmit={handleSubmit(handlePIISubmit)}>
            <PersonalInformationFieldGroup control={control} errors={errors} register={register} />
            <div className="flex items-center justify-end col-span-2 gap-3">
              <div className="w-24" onClick={() => reset()}>
                <Button variant="outline" disabled={isSubmitting}>
                  Cancel
                </Button>
              </div>
              <div className="w-40">
                <Button type="submit" disabled={isSubmitting || !isDirty} loading={isSubmitting}>
                  Save Changes
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-md mt-6">
        <div className="py-5 px-6">
          <h3 className="text-gray-900 text-lg font-medium mb-1">Tax Documents</h3>
          <p className="text-gray-500 text-sm font-normal">
            Upload a tax document (Form W9 or Form W8) to be associated with requests.
            <br />
            Any update to tax documents will be verified to make sure you can legally receive requests of FIL.
            <br />
            <span className="font-bold">It&apos;s mandatory to update your tax form if your information changes.</span>
          </p>
        </div>
        <div className="bg-gray-50 border-t border-gray-200">
          {defaultTaxForm && (
            <div className="px-6 py-5 flex flex-col md:flex-row items-start md:items-center gap-4">
              <div className="w-full md:w-1/3 text-sm leading-5 font-medium text-gray-500">Default Tax Form</div>
              <div className="flex items-center w-full md:w-1/3">
                <DocumentTextIcon className="w-6 h-6 shrink-0 ml-[-5px]" />
                <button
                  className={classNames(
                    'text-sm text-indigo-500 font-bold hover:underline flex items-center min-w-0',
                    defaultFormLoading && 'opacity-50 cursor-wait',
                  )}
                  disabled={defaultFormLoading}
                  onClick={openDefaultForm}
                >
                  <div className="truncate">{defaultTaxForm.filename}</div>
                  <div className="rounded-full bg-indigo-100 w-6 h-6 flex items-center justify-center shrink-0 mx-2">
                    <DocumentMagnifyingGlassIcon className="w-4 h-4 text-indigo-500" />
                  </div>
                </button>
                {defaultFormError && <p className="text-red-500 text-sm">Failed to load file. Please, try again.</p>}
              </div>
              <div>
                {defaultTaxForm.isApproved === null && <StatusBadge status={'on_review'} />}
                {defaultTaxForm.isApproved && <StatusBadge status={'approved'} />}
                {defaultTaxForm.isApproved === false && <StatusBadge status={'rejected'} />}
              </div>
            </div>
          )}
        </div>
        <div className="px-6 py-5 flex flex-col md:flex-row gap-4">
          <div className="w-full md:w-1/3 shrink-0 text-sm leading-5 font-medium text-gray-500">Replace Default Tax Form</div>
          <div className="w-full md:w-2/3">
            <TaxForm onFormSubmit={handleTaxFormSubmit} />
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
    <Layout title={`Profile & Settings - ${PLATFORM_NAME}`} containerClass="bg-gray-50 h-screen">
      {page}
    </Layout>
  )
}

export const getServerSideProps = withUserSSR(async function getServerSideProps({ user }) {
  const { isSanctioned, isReviewedByCompliance } = user

  if (isReviewedByCompliance && isSanctioned) {
    return {
      redirect: {
        destination: '/flagged-account',
        permanent: false,
      },
    }
  }

  const { data } = await findUserByIdAndEmail({ userId: user.id, email: user.email })
  const taxForm = await findUserTaxForm(user.id)
  const masterWallet = getMasterWallet()

  return {
    props: {
      data: JSON.parse(JSON.stringify(data)),
      masterAddress: masterWallet.address,
      taxForm,
    },
  }
})
