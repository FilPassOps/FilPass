import { WalletVerification } from '@prisma/client'
import { ApproveBlockedModal } from 'components/Compliance/Modals/ApproveBlockedModal'
import { RejectBlockedModal } from 'components/Compliance/Modals/RejectBlockedModal'
import { ViewReasonModal } from 'components/Compliance/Modals/ViewReasonModal'
import { UserList } from 'components/Compliance/UserList'
import { Layout } from 'components/Layout'
import { PaginationWrapper } from 'components/shared/usePagination'
import { PLATFORM_NAME } from 'system.config'
import { findAllPII, findAllSanctioned } from 'domain/user'
import { withComplianceSSR } from 'lib/ssr'
import Head from 'next/head'
import { ReactElement, useState } from 'react'

interface FlaggedUsersPage {
  data: {
    id: number
    email?: string
    firstName?: string
    lastName?: string
    dateOfBirth?: string
    countryResidence?: string
    wallets: { address: string; verification: WalletVerification }[]
  }[]
  totalItems: number
  pageSize: number
  status: 'FLAGGED' | 'BLOCKED' | 'UNBLOCKED'
}

export default function FlaggedUsersPage({ data, totalItems, pageSize, status }: FlaggedUsersPage) {
  const [selectedUserId, setSelectedUserId] = useState<number>()
  const [approveModalOpen, setApproveModalOpen] = useState(false)
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [selectedUserViewReason, setSelectedUserViewReason] = useState<string>()
  const [viewReasonModalOpen, setViewReasonModalOpen] = useState(false)

  const handleOnUnblockClick = (userId: number) => {
    setSelectedUserId(userId)
    setApproveModalOpen(true)
  }

  const handleOnBlockClick = (userId: number) => {
    setSelectedUserId(userId)
    setRejectModalOpen(true)
  }

  const handleOnViewClick = (flaggedReason: string) => {
    setSelectedUserViewReason(flaggedReason)
    setViewReasonModalOpen(true)
  }

  return (
    <>
      <Head>
        <title>Compliance - {PLATFORM_NAME}</title>
      </Head>
      <PaginationWrapper totalItems={totalItems} pageSize={pageSize} isLoading={false}>
        <UserList
          data={data}
          handleOnUnblockClick={handleOnUnblockClick}
          handleOnBlockClick={handleOnBlockClick}
          handleOnViewClick={handleOnViewClick}
          status={status}
        />
      </PaginationWrapper>
      <ApproveBlockedModal open={approveModalOpen} onModalClosed={() => setApproveModalOpen(false)} userId={selectedUserId} />
      <RejectBlockedModal open={rejectModalOpen} onModalClosed={() => setRejectModalOpen(false)} userId={selectedUserId} />
      <ViewReasonModal
        open={viewReasonModalOpen}
        onModalClosed={() => setViewReasonModalOpen(false)}
        reason={selectedUserViewReason}
        trustedDangerousHtml
      />
    </>
  )
}

FlaggedUsersPage.getLayout = function getLayout(page: ReactElement) {
  return <Layout title="Compliance">{page}</Layout>
}

export const getServerSideProps = withComplianceSSR(async ({ query }: any) => {
  const status = query.status || 'FLAGGED'
  const page = parseInt(query.page || 1)
  const pageSize = parseInt(query.itemsPerPage || 100)

  let result

  if (status === 'FLAGGED') {
    result = await findAllSanctioned({ isSanctioned: true, isReviewedByCompliance: false, page, pageSize })
  } else if (status === 'BLOCKED') {
    result = await findAllSanctioned({ isSanctioned: true, isReviewedByCompliance: true, page, pageSize })
  } else if (status === 'UNBLOCKED') {
    result = await findAllSanctioned({ isSanctioned: false, isReviewedByCompliance: true, page, pageSize })
  } else {
    result = await findAllPII({ page, pageSize })
  }

  const { data, error } = result

  if (error) {
    throw new Error(error.errors.users.message)
  }

  return {
    props: {
      data: JSON.parse(JSON.stringify(data?.users)),
      totalItems: data?.totalItems,
      pageSize,
      status,
    },
  }
})
