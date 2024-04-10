import { flip, useFloating } from '@floating-ui/react-dom'
import { Popover } from '@headlessui/react'
import { ArrowUturnLeftIcon, InformationCircleIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import { Button } from 'components/Shared/Button'
import { Cell, Header, Table, TableBody, TableHead } from 'components/Shared/Table'
import Timestamp from 'components/Shared/Timestamp'
import { formatPaymentMethod } from 'components/SuperAdmin/Shared/utils'
import { ACTIVE_STATUS } from 'domain/programs/constants'
import { DateTime } from 'luxon'
import dynamic from 'next/dynamic'
import { Fragment, useState } from 'react'

const ArchiveProgramModal = dynamic(() => import('./Modals/ArchiveProgramModal').then(mod => mod.ArchiveProgramModal))
const CreateOrEditProgramModal = dynamic(() => import('./Modals/CreateOrEditProgramModal').then(mod => mod.CreateOrEditProgramModal))

interface ProgramListProps {
  data?: {
    id: number
    program_name: string
    request_unit_name: string
    payment_unit_name: string
    isArchived: boolean
    approversRole: {
      id: number
      email: string
    }[][]
    viewersRole: {
      id: number
      email: string
    }[]
    created_at: string
  }[]
  approversData?: {
    id: number
    email: string
    roleId: number
    roleName: string
    roleDescription: string
  }[]
  viewersData?: {
    id: number
    email: string
    roleId: number
    roleName: string
    roleDescription: string
  }[]
  refreshPrograms: () => void
  openCreateOrEditModal: boolean
  setOpenCreateOrEditModal: (value: boolean) => void
  currentProgram?: any
  setCurrentProgram: (value?: any) => void
  status: string
}

interface GroupColumn {
  groupList: {
    id: number
    email: string
  }[][]
  groupName?: string
  membersName?: string
}

export const ProgramList = ({
  data = [],
  approversData = [],
  viewersData = [],
  refreshPrograms,
  openCreateOrEditModal,
  setOpenCreateOrEditModal,
  currentProgram,
  setCurrentProgram,
  status,
}: ProgramListProps) => {
  const [openArchiveModal, setOpenArchiveModal] = useState(false)
  const isActive = status === ACTIVE_STATUS

  const handleOpenArchiveModal = (program: any) => {
    setCurrentProgram(program)
    setOpenArchiveModal(true)
  }

  const handleOpenEditModal = (program: any) => {
    setCurrentProgram(program)
    setOpenCreateOrEditModal(true)
  }

  return (
    <>
      <div className="flex flex-col">
        <Table>
          <TableHead>
            <tr>
              <Header style={{ minWidth: 200 }}>Program Name</Header>
              <Header style={{ minWidth: 245 }}>Payment Method</Header>
              <Header style={{ minWidth: 200 }}>Approver</Header>
              <Header style={{ minWidth: 200 }}>Viewer</Header>
              <Header style={{ minWidth: 200 }}>Create Date</Header>
              <Header style={{ minWidth: 80 }}>Edit</Header>
              <Header style={{ minWidth: 80 }}>{isActive ? 'Archive' : 'Unarchive'}</Header>
            </tr>
          </TableHead>
          <TableBody>
            {data.map(program => (
              <tr key={program.id}>
                <Cell className="break-all">{program.program_name}</Cell>
                <Cell className="break-all">{formatPaymentMethod(program.request_unit_name, program.payment_unit_name)}</Cell>
                <Cell className="break-all">
                  {program.approversRole.length > 0 ? <GroupColumnValue groupList={program.approversRole} /> : '-'}
                </Cell>
                <Cell className="break-all">
                  {program.viewersRole.length > 0 ? (
                    <GroupColumnValue groupList={[program.viewersRole]} groupName="Viewers" membersName="viewers" />
                  ) : (
                    '-'
                  )}
                </Cell>
                <Cell>
                  <Timestamp date={program.created_at} format={DateTime.DATETIME_SHORT_WITH_SECONDS} />
                </Cell>
                <Cell style={{ minWidth: 80 }}>
                  <Button variant="none" onClick={() => handleOpenEditModal(program)}>
                    <PencilIcon className="w-5 text-sky-600" />
                  </Button>
                </Cell>
                <Cell style={{ minWidth: 80 }}>
                  <Button variant="none" onClick={() => handleOpenArchiveModal(program)}>
                    {isActive && <TrashIcon className="w-5 text-red-600" />}
                    {!isActive && <ArrowUturnLeftIcon className="w-5 text-orange-300" />}
                  </Button>
                </Cell>
              </tr>
            ))}
          </TableBody>
        </Table>
        {data.length === 0 && (
          <p className="text-center text-sm space-y-7 py-7 text-gray-800 bg-white border border-gray-100 rounded-sm">No data</p>
        )}
      </div>
      {openArchiveModal && (
        <ArchiveProgramModal
          onModalClosed={() => setOpenArchiveModal(false)}
          open={openArchiveModal}
          program={currentProgram}
          isActive={isActive}
        />
      )}
      {openCreateOrEditModal && (
        <CreateOrEditProgramModal
          open={openCreateOrEditModal}
          onModalClosed={() => {
            setOpenCreateOrEditModal(false)
            setTimeout(() => setCurrentProgram(), 300)
          }}
          approversData={approversData}
          viewersData={viewersData}
          program={currentProgram}
          programs={data}
          isEditable={!!currentProgram}
          refreshPrograms={refreshPrograms}
        />
      )}
    </>
  )
}

const getGroupColumnValue = ({ groupList, groupName, membersName }: GroupColumn) => {
  if (groupList.length === 1 && groupList[0].length === 1) {
    return { approverColumnValue: groupList[0][0].email, showIcon: false }
  }

  if (groupList.length === 1 && groupList[0].length > 1) {
    return { approverColumnValue: `${groupList[0].length} ${membersName}`, showIcon: true }
  }

  if (groupList.length > 1) {
    return { approverColumnValue: groupName, showIcon: true }
  }
  return null
}

const GroupColumnValue = ({ groupList, groupName = 'Multistage', membersName = 'approvers' }: GroupColumn) => {
  const { x, y, refs, strategy } = useFloating({
    placement: 'bottom',
    middleware: [flip()],
  })

  const columnValue = getGroupColumnValue({ groupList, groupName, membersName })

  if (!columnValue?.showIcon) {
    return columnValue?.approverColumnValue
  }

  return (
    <Popover className="relative">
      <Popover.Button className="relative after:absolute after:-inset-2" ref={refs.reference as any}>
        <p className={`flex items-center gap-1 ${columnValue.showIcon ? 'font-medium' : 'font-normal'}`}>
          {columnValue.approverColumnValue}
          <InformationCircleIcon width={16} height={16} className="text-green-800" />
        </p>
      </Popover.Button>

      <Popover.Panel
        className="absolute z-10 bg-white rounded-md shadow-allDirections w-72"
        ref={refs.floating as any}
        style={{
          position: strategy,
          top: y ?? 0,
          left: x ?? 0,
        }}
      >
        <ol>
          {groupList.map((group, index) => (
            <Fragment key={index}>
              <li className="p-4">
                {groupList.length > 1 && <p className="text-gray-900 mb-2">{`Group ${index + 1}`}</p>}
                <ul>
                  {Object.values(group).map(approver => (
                    <li key={approver.email} className="text-gray-500">
                      {approver.email}
                    </li>
                  ))}
                </ul>
              </li>
              <hr />
            </Fragment>
          ))}
        </ol>
      </Popover.Panel>
    </Popover>
  )
}

export default ProgramList
