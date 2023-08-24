import { XMarkIcon } from '@heroicons/react/24/outline'
import { MultipleSelectInputV2, SelectInputOption } from 'components/shared/FormInput'
import { useState } from 'react'

interface ProgramFilterProps {
  options?: SelectInputOption[]
  handleOnChange: (selectedData: any[] | null) => void
  selectedOptions?: any[]
}

export const ProgramFilter = ({ options = [], handleOnChange, selectedOptions = [] }: ProgramFilterProps) => {
  const [toggleBtnValue, setToggleBtnValue] = useState(false)
  const renderActionBtn = () => {
    if (!selectedOptions.length) {
      return null
    }

    return (
      <button
        className="absolute top-1/2 right-3 transform -translate-y-1/2 rounded-full h-6 w-6 flex items-center justify-center text-indigo-600 bg-indigo-50 text-xs"
        onClick={() => handleOnChange([])}
        onMouseEnter={() => setToggleBtnValue(true)}
        onMouseLeave={() => setToggleBtnValue(false)}
      >
        {toggleBtnValue && <XMarkIcon width={16} />}
        {!toggleBtnValue && selectedOptions.length}
      </button>
    )
  }

  return (
    <div className="w-36">
      <MultipleSelectInputV2
        options={options}
        placeholder="Program"
        name="program"
        id='program'
        onChange={handleOnChange}
        value={selectedOptions}
        className="w-full"
        actionComponent={renderActionBtn()}
      />
    </div>
  )
}
