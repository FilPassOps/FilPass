import { InformationCircleIcon } from '@heroicons/react/24/outline'
import { ViewReasonModal } from 'components/Compliance/Modals/ViewReasonModal'
import { Button } from 'components/shared/Button'
import Sortable from 'components/shared/Sortable'
import { Cell, Header, Table, TableBody, TableHead } from 'components/shared/Table'
import { APPROVER_ROLE } from 'domain/auth/constants'
import { classNames } from 'lib/classNames'
import { DateTime } from 'luxon'
import { useEffect, useState } from 'react'
import { ApproverProgramsListModal } from './Modals/ApproverProgramsListModal'
import { BanUserModal } from './Modals/BanUserModal'
import { UnbanUserModal } from './Modals/UnbanUserModal'
import { SelectRoles } from './shared/SelectRole'

interface UserListProps {
  data?: any[]
  loggedUser?: any
}

interface User {
  id: number
  email: string
}

export const UserList = ({ data = [] }: UserListProps) => {
  const [openProgramListModal, setOpenProgramListModal] = useState(false)
  const [openBanModal, setOpenBanModal] = useState(false)
  const [openUnbanModal, setOpenUnbanModal] = useState(false)
  const [viewReasonModalOpen, setViewReasonModalOpen] = useState(false)
  const [programList, setProgramList] = useState([])
  const [selectedUser, setSelectedUser] = useState<User>()
  const [selectedUserViewReason, setSelectedUserViewReason] = useState<string>()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const table = document.querySelector('table')
    if (table) {
      table.addEventListener('scroll', e => {
        setScrolled(true)
        if ((e.target as HTMLElement).scrollLeft === 0) {
          setScrolled(false)
        }
      })
    }
  }, [])

  const handleOnViewClick = (reason: string) => {
    setSelectedUserViewReason(reason)
    setViewReasonModalOpen(true)
  }

  return (
    <div className="flex flex-col relative">
      <Table>
        <TableHead>
          <tr>
            <Header style={{ minWidth: 100, width: 100 }}>User ID</Header>
            <Header style={{ minWidth: 200 }}>
              <Sortable by={'email_pq'}>Email</Sortable>
            </Header>
            <Header style={{ minWidth: 350 }}>Role</Header>
            <Header style={{ minWidth: 200 }}>
              <Sortable by={'create_date'}>Create Date</Sortable>
            </Header>
            <Header style={{ minWidth: 200 }}>
              <Sortable by={'programs_assigned'}>Programs Assigned</Sortable>
            </Header>
            <Header></Header>
            <Header>Ban reason</Header>
            <Header>Action</Header>
          </tr>
        </TableHead>
        <TableBody>
          {data.map(user => (
            <tr key={user.id}>
              <Cell className="break-all">{user.id}</Cell>
              <Cell className="break-all">{user.email}</Cell>
              <Cell className={classNames('break-all w-full', scrolled && 'relative', !scrolled && 'absolute')} style={{ maxWidth: 300 }}>
                <SelectRoles user={user} scrolled={scrolled} />
              </Cell>
              <Cell className="break-all">{DateTime.fromISO(user.created_at).toLocaleString(DateTime.DATETIME_SHORT_WITH_SECONDS)}</Cell>
              <Cell>{user.programs_assigned}</Cell>
              <Cell>
                <Button
                  variant="outline-blue"
                  disabled={!user?.roles?.includes(APPROVER_ROLE)}
                  onClick={() => {
                    setProgramList(user.approver_programs)
                    setOpenProgramListModal(true)
                  }}
                >
                  View
                </Button>
              </Cell>
              {/* @ts-ignore */}
              <Cell className="break-all">
                {user.is_banned ? (
                  <button className="flex items-center justify-center gap-1" onClick={() => handleOnViewClick(user.ban_reason)}>
                    View
                    <InformationCircleIcon width={16} height={16} className="text-indigo-800" />
                  </button>
                ) : (
                  '-'
                )}
              </Cell>
              <Cell>
                {user.is_banned ? (
                  <Button
                    variant="outline-green"
                    onClick={() => {
                      setOpenUnbanModal(true)
                      setSelectedUser({ id: user.id, email: user.email })
                    }}
                  >
                    Unban
                  </Button>
                ) : (
                  <Button
                    variant="outline-red"
                    onClick={() => {
                      setOpenBanModal(true)
                      setSelectedUser({ id: user.id, email: user.email })
                    }}
                  >
                    Ban
                  </Button>
                )}
              </Cell>
            </tr>
          ))}
        </TableBody>
      </Table>

      <ApproverProgramsListModal data={programList} open={openProgramListModal} onModalClosed={() => setOpenProgramListModal(false)} />
      <BanUserModal open={openBanModal} onModalClosed={() => setOpenBanModal(false)} user={selectedUser as User} />
      <UnbanUserModal open={openUnbanModal} onModalClosed={() => setOpenUnbanModal(false)} user={selectedUser as User} />
      <ViewReasonModal open={viewReasonModalOpen} onModalClosed={() => setViewReasonModalOpen(false)} reason={selectedUserViewReason} />
    </div>
  )
}
