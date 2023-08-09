import { FunnelIcon } from '@heroicons/react/24/outline'
import { ProgramFilter } from 'components/shared/ProgramFilter'
import { useRouter } from 'next/router'
import { useState } from 'react'

export const ListFilter = ({ programs = [] }) => {
  const { push, query } = useRouter()
  const initialValues = query.programId?.split(',').map(programId => ({ value: parseInt(programId) })) ?? []
  const [selectedOptions, setSelectedOptions] = useState(initialValues)

  const formOptions = programs.map(program => ({
    value: program.id,
    label: program.name,
    decorator: 'Filter: ',
  }))

  const handleOnChange = currentQuery => selectedData => {
    const selectedPrograms = selectedData?.map(({ value }) => ({ value })) ?? []
    setSelectedOptions(selectedPrograms)
    const query = {
      ...currentQuery,
    }
    if (selectedPrograms.length) {
      query.programId = selectedPrograms.map(({ value }) => value).join(',')
    } else {
      delete query.programId
    }
    push({
      query,
    })
  }

  return (
    <div className="flex flex-row flex-grow items-center justify-end relative ml-auto pr-1">
      <FunnelIcon height={18} width={18} className="ml-3 mr-3" />
      <ProgramFilter
        options={formOptions}
        placeholder={formOptions.length ? 'Select the approver' : 'There are no approvers left to add to this group'}
        handleOnChange={handleOnChange(query)}
        selectedOptions={selectedOptions}
      />
    </div>
  )
}
