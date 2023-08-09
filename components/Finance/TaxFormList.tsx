import Sortable from 'components/shared/Sortable'
import { Cell, Header, Table, TableBody, TableHead } from 'components/shared/Table'
import { DownloadFile } from 'components/TransferRequest/shared/useDownloadFile'
import { DateTime } from 'luxon'
import { TaxStatus } from 'pages/tax-review'
import { Dispatch, SetStateAction, useEffect, useRef } from 'react'

interface TaxForm {
  id: number
  user: {
    email: string
  }
  publicId?: string
  filename?: string
  rejectionReason?: string
  createdAt?: string
  type?: string
  selected: boolean
}
interface TaxFormListProps {
  status: TaxStatus
  taxForms: TaxForm[]
  setTaxForms: Dispatch<SetStateAction<TaxForm[]>>
  selectedTotalTaxForms: number
}

const FORM_TYPE_LABEL = {
  W8_FORM: 'W-8',
  W9_FORM: 'W-9',
}

export const TaxFormList = ({ taxForms, setTaxForms, status, selectedTotalTaxForms }: TaxFormListProps) => {
  const selectAllRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (selectAllRef.current) {
      const selectedRequests = taxForms.filter(item => item.selected).length
      selectAllRef.current.indeterminate = selectedRequests > 0 && selectedRequests < taxForms.length
    }
  }, [taxForms])

  const handleOnSelectAll = (value: boolean) => {
    setTaxForms(taxForms.map(item => ({ ...item, selected: value })))
  }

  const handleOnSelectTaxForm = (id: number, value: boolean) => {
    const nextTaxForms = [...taxForms]
    const taxFormSelected = nextTaxForms.find(taxForm => taxForm.id === id)

    if (!taxFormSelected) {
      console.error(`Invalid state - id: ${id}`)
      return null
    }

    taxFormSelected.selected = value
    setTaxForms(nextTaxForms)
  }

  return (
    <div className="flex flex-col relative">
      {/* @ts-ignore */}
      <Table>
        <TableHead>
          <tr>
            {/* @ts-ignore */}
            <Header style={{ minWidth: '30px', width: '5%' }}>
              <label htmlFor="selectAll" className="sr-only">
                Select all
              </label>
              {taxForms.length > 1 && (
                <input
                  id="selectAll"
                  type="checkbox"
                  className="cursor-pointer p-1"
                  checked={selectedTotalTaxForms === taxForms.length}
                  onChange={event => handleOnSelectAll(event.target.checked)}
                  ref={selectAllRef}
                />
              )}
            </Header>
            {/* @ts-ignore */}
            <Header style={{ minWidth: 100, width: '15%' }}>
              <Sortable by={'email_pq'}>Email</Sortable>
            </Header>
            {/* @ts-ignore */}
            <Header style={{ width: '16%' }}>Tax Doc</Header>
            <Header style={{ width: '5%' }}>Type</Header>
            <Header style={{ width: '16%' }}>Upload Date</Header>
            {status === TaxStatus.REJECTED && (
              // @ts-ignore
              <Header style={{ width: '100%' }}>Reason</Header>
            )}
          </tr>
        </TableHead>
        <TableBody>
          {taxForms.map(taxForm => (
            <tr key={taxForm.id}>
              {/* @ts-ignore */}
              <Cell style={{ minWidth: 60 }} onClick={e => e.stopPropagation()}>
                <label className="sr-only" htmlFor={`selectTax${taxForm.id}`}>{`Select tax form of ${taxForm.user.email}`}</label>
                <input
                  id={`selectTax${taxForm.id}`}
                  className="p-1"
                  type="checkbox"
                  checked={taxForm.selected}
                  onChange={event => handleOnSelectTaxForm(taxForm.id, event.target.checked)}
                />
              </Cell>
              {/* @ts-ignore */}
              <Cell className="break-all">{taxForm.user.email}</Cell>
              {/* @ts-ignore */}
              {taxForm.publicId ? (
                <Cell className="break-all">
                  <DownloadFile fileId={taxForm.publicId} filename={taxForm.filename} />
                </Cell>
              ) : (
                <Cell className="break-all">No file</Cell>
              )}
              {/* @ts-ignore */}
              <Cell className="break-all">{FORM_TYPE_LABEL[taxForm.type] || ''}</Cell>
              {/* @ts-ignore */}
              <Cell className="break-all">
                {taxForm.createdAt ? DateTime.fromISO(taxForm.createdAt).toLocaleString(DateTime.DATETIME_SHORT_WITH_SECONDS) : ''}
              </Cell>
              {status === TaxStatus.REJECTED && (
                // @ts-ignore
                <Cell className="break-all">{taxForm.rejectionReason}</Cell>
              )}
            </tr>
          ))}
        </TableBody>
      </Table>
      {taxForms.length === 0 && (
        <p className="text-center text-sm space-y-7 py-7 text-gray-800 bg-white border border-gray-100 rounded-sm">No data</p>
      )}
    </div>
  )
}
