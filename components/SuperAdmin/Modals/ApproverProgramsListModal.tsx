import { Modal } from 'components/Shared/Modal'
import { Cell, Header, Table, TableBody, TableHead } from 'components/Shared/Table'
import { formatPaymentMethod } from 'components/SuperAdmin/Shared/utils'

interface ApproverProgramsListModalProps {
  data: {
    id: string
    name: string
    request_unit: string
    payment_unit: string
    delivery_method: string
  }[]
  open: boolean
  onModalClosed: () => void
}

export const ApproverProgramsListModal = ({ data = [], open, onModalClosed }: ApproverProgramsListModalProps) => {
  const hasProgram = data.filter(program => Object.keys(program).length)
  return (
    <Modal open={open} onModalClosed={onModalClosed} className="p-0 w-2/4 rounded">
      <h2 className="text-lg font-medium p-5 border-b border-gray-300">Assigned Programs</h2>
      <div className="p-4 bg-gray-50">
        <Table>
          <TableHead>
            <tr>
              <Header className="w-10/12">Program Name</Header>
              <Header className="w-9/12">Payment Method</Header>
              <Header className="w-10/12 ">Delivery Method</Header>
            </tr>
          </TableHead>
          <TableBody>
            {data.map(program => {
              if (!Object.keys(program).length) {
                return null
              }

              return (
                <tr key={program.id}>
                  <Cell className="break-all">{program.name}</Cell>
                  <Cell className="break-all">{formatPaymentMethod(program.request_unit, program.payment_unit)}</Cell>
                  <Cell className="break-all">{program.delivery_method}</Cell>
                </tr>
              )
            })}
          </TableBody>
        </Table>
        {!hasProgram.length && (
          <p className="text-center text-sm space-y-7 py-7 text-gray-800 bg-white border border-gray-100 rounded-sm">No data</p>
        )}
      </div>
    </Modal>
  )
}
