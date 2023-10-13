import { FunnelIcon } from '@heroicons/react/24/outline'
import { Program } from '@prisma/client'
import { Button } from 'components/Shared-tmp/Button'
import dynamic from 'next/dynamic'
import { useState } from 'react'
import 'react-datepicker/dist/react-datepicker.css'
import { statusFilterOptions } from './constants'
const FiltersModal = dynamic(() => import('./FiltersModal').then(mod => mod.default))

interface FiltersProps {
  programs: Program[]
  statusOptions?: typeof statusFilterOptions
  teams?: string[]
  dateFilterLabel?: string
  showCountByNetworkForController?: boolean
}

export const Filters = ({
  programs,
  statusOptions,
  teams,
  dateFilterLabel = 'Create date',
  showCountByNetworkForController,
}: FiltersProps) => {
  const [filtersModalOpen, setFiltersModalOpen] = useState(false)
  const [filtersCounter, setFiltersCounter] = useState(0)

  function handleOnClose() {
    setFiltersModalOpen(false)
  }

  function handleFiltersCounter(counter: number) {
    setFiltersCounter(counter)
  }

  return (
    <>
      <Button onClick={() => setFiltersModalOpen(true)}>
        <div className="flex items-center gap-2">
          <FunnelIcon height={18} width={18} />
          Filters {filtersCounter > 0 && `(${filtersCounter})`}
        </div>
      </Button>
      {filtersModalOpen && (
        <FiltersModal
          isOpen={filtersModalOpen}
          closeModal={handleOnClose}
          handleFiltersCounter={handleFiltersCounter}
          programs={programs}
          dateFilterLabel={dateFilterLabel}
          showCountByNetworkForController={showCountByNetworkForController}
          statusOptions={statusOptions}
          teams={teams}
        />
      )}
    </>
  )
}
