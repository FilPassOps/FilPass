import { Listbox, Transition } from '@headlessui/react'
import { FunnelIcon } from '@heroicons/react/24/outline'
import { ChevronDownIcon, ChevronUpIcon, XMarkIcon } from '@heroicons/react/24/solid'
import { Program } from '@prisma/client'
import { Button } from 'components/shared/Button'
import { Modal } from 'components/shared/Modal'
import { useRouter } from 'next/router'
import { DetailedHTMLProps, Dispatch, Fragment, LabelHTMLAttributes, SetStateAction, forwardRef, useEffect, useRef, useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { CONFIG } from 'system.config'
import { StatusFilterOption, statusFilterLabel, statusFilterOptions } from './constants'

interface SelectOption {
  value: string | number
  label: string
}

interface FiltersProps {
  programs: Program[]
  statusOptions?: typeof statusFilterOptions
  teams?: string[]
  dateFilterLabel?: string
}

export const Filters = ({ programs, statusOptions, teams, dateFilterLabel = 'Create date' }: FiltersProps) => {
  const { query, push } = useRouter()
  const [filtersModalOpen, setFiltersModalOpen] = useState(false)
  let selectedFilters = 0

  const networks = query.network
    ?.toString()
    .split(',')
    .map(network => network)

  const initialNetworkFilter: SelectOption[] = CONFIG.chains
    .filter(chain => networks?.includes(chain.name))
    .map(chain => ({ value: chain.name, label: chain.name }))

  const programIds = query.programId
    ?.toString()
    .split(',')
    .map(id => parseInt(id))

  const initialProgramsFilter: SelectOption[] = programs
    .filter(program => programIds?.includes(program.id))
    .map(program => ({ value: program.id, label: program.name }))

  const initialRequestNumberFilter = query.number ? parseInt(query.number.toString()) : ''

  const initialStatusFilter =
    query.status && statusOptions?.includes(query.status as StatusFilterOption) ? (query.status as StatusFilterOption) : undefined

  const teamNames = query.team?.toString().split(',')
  const initialTeamFilter = teams?.filter(team => teamNames?.includes(team)).map(team => ({ value: team, label: team }))

  let initialDateRange: [Date | null, Date | null] = [null, null]

  if (query.from && query.to) {
    initialDateRange = [new Date(parseInt(query.from.toString())), new Date(parseInt(query.to.toString()))]
  }

  const initialWalletAddress = query.wallet?.toString()?.toLowerCase() ?? ''

  const [selectedNetwork, setSelectedNetwork] = useState<SelectOption[]>(initialNetworkFilter || [])
  const [selectedPrograms, setSelectedPrograms] = useState<SelectOption[]>(initialProgramsFilter || [])
  const [requestNumber, setRequestNumber] = useState(initialRequestNumberFilter)
  const [selectedStatus, setSelectedStatus] = useState<StatusFilterOption | undefined>(initialStatusFilter)
  const [selectedTeams, setSelectedTeams] = useState<SelectOption[]>(initialTeamFilter || [])
  const [walletAddress, setWalletAdress] = useState(initialWalletAddress)
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>(initialDateRange)
  const [pageStatus, setPageStatus] = useState(query.status)
  const [startDate, endDate] = dateRange

  useEffect(() => {
    if (!statusOptions && query.status !== pageStatus) {
      handleFilterClear()
      setPageStatus(query.status)
    }
  }, [query.status, statusOptions, pageStatus])

  const handleFilterApply = () => {
    if (selectedNetwork.length > 0) {
      query.network = selectedNetwork.map(({ value }) => value).join(',')
    } else {
      delete query.network
    }
    if (selectedPrograms.length > 0) {
      query.programId = selectedPrograms.map(({ value }) => value).join(',')
    } else {
      delete query.programId
    }
    if (requestNumber) {
      query.number = requestNumber.toString()
    } else {
      delete query.number
    }
    if (selectedStatus) {
      query.status = selectedStatus
    } else if (statusOptions) {
      delete query.status
    }
    if (selectedTeams.length > 0) {
      query.team = selectedTeams.map(({ value }) => value).join(',')
    } else {
      delete query.team
    }
    if (dateRange[0] !== null && dateRange[1] !== null) {
      query.from = dateRange[0].getTime().toString()
      query.to = dateRange[1].getTime().toString()
    } else {
      delete query.from
      delete query.to
    }
    if (walletAddress) {
      query.wallet = walletAddress?.toString()?.toLowerCase()
    } else {
      delete query.wallet
    }
    push({
      query,
    })
    setFiltersModalOpen(false)
  }

  const handleFilterClear = () => {
    setSelectedNetwork([])
    setSelectedPrograms([])
    setRequestNumber('')
    setSelectedStatus(undefined)
    setSelectedTeams([])
    setDateRange([null, null])
    setWalletAdress('')
  }

  if (selectedNetwork.length > 0) selectedFilters++
  if (selectedPrograms.length > 0) selectedFilters++
  if (requestNumber) selectedFilters++
  if (selectedStatus) selectedFilters++
  if (selectedTeams.length > 0) selectedFilters++
  if (dateRange[0] !== null && dateRange[1] !== null) selectedFilters++
  if (walletAddress) selectedFilters++

  return (
    <>
      <Button onClick={() => setFiltersModalOpen(true)}>
        <div className="flex items-center gap-2">
          <FunnelIcon height={18} width={18} />
          Filters {selectedFilters > 0 && `(${selectedFilters})`}
        </div>
      </Button>
      {filtersModalOpen && (
        <Modal
          open={filtersModalOpen}
          onModalClosed={() => setFiltersModalOpen(false)}
          isCloseable
          className="rounded-md px-4 pt-5 pb-4 sm:p-6 w-screen sm:max-w-lg"
        >
          <div className="min-w-full min-h-[70vh] md:min-h-[400px] flex flex-col gap-4">
            <h1 className="font-medium text-gray-900 text-lg text-center mb-2">Filters</h1>
            <div className="flex flex-col gap-4">
              <div>
                <FilterLabel htmlFor="request-number">Request number:</FilterLabel>
                <div className="relative">
                  <input
                    className="appearance-none w-full focus:ring-indigo-600 focus:border-indigo-600 border-gray-300 border shadow-sm rounded-md px-3 py-2 text-sm bg-white"
                    type="number"
                    name="request-number"
                    id="request-number"
                    value={requestNumber}
                    onChange={event => setRequestNumber(parseInt(event.currentTarget.value))}
                    placeholder="1234567890"
                  />
                  <div className={`${requestNumber ? 'absolute' : 'hidden'} top-[10px] right-4`}>
                    <button type="button" aria-label="Clear Transfer Request number field" onClick={() => setRequestNumber('')}>
                      <XMarkIcon width={16} height={16} />
                    </button>
                  </div>
                </div>
              </div>
              {statusOptions && (
                <div>
                  <FilterLabel htmlFor="status">Status:</FilterLabel>
                  <div className="w-full">
                    <Listbox value={selectedStatus} onChange={value => setSelectedStatus(value as StatusFilterOption)}>
                      <div className="relative">
                        <Listbox.Button
                          className={({ open }) =>
                            `${
                              open ? 'ring-1 ring-indigo-600 border border-indigo-600' : ''
                            } relative w-full appearance-none border border-gray-300 focus:outline-none focus-visible:border-indigo-600 focus-visible:ring-1 focus-visible:ring-indigo-600 shadow-sm rounded-md px-3 py-2 text-left text-sm bg-white`
                          }
                        >
                          {({ open }) => (
                            <div className="flex items-center justify-between">
                              {selectedStatus ? (
                                <div className="w-full flex items-center justify-between">
                                  <div>{statusFilterLabel[selectedStatus]}</div>
                                  <div role="button" className="mx-2" onClick={() => setSelectedStatus(undefined)}>
                                    <XMarkIcon width={16} height={16} />
                                  </div>
                                </div>
                              ) : (
                                <span className="text-slate-500">Select a program</span>
                              )}
                              {open ? (
                                <ChevronUpIcon width={20} height={20} aria-hidden="true" />
                              ) : (
                                <ChevronDownIcon width={20} height={20} aria-hidden="true" />
                              )}
                            </div>
                          )}
                        </Listbox.Button>
                        <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                          <Listbox.Options className="absolute max-h-40 overflow-y-scroll w-full flex-col py-2 mt-2 bg-white rounded-md shadow-lg z-50 border-gray-300 border focus:outline-none">
                            {statusFilterOptions.sort().map(status => (
                              <Listbox.Option
                                key={status}
                                className={({ active }) =>
                                  `text-sm cursor-pointer select-none px-4 py-1 ${active ? 'bg-indigo-600 text-white' : 'text-gray-900'}`
                                }
                                value={status}
                              >
                                {statusFilterLabel[status]}
                              </Listbox.Option>
                            ))}
                          </Listbox.Options>
                        </Transition>
                      </div>
                    </Listbox>
                  </div>
                </div>
              )}
              <div>
                <FilterLabel htmlFor="program">Program:</FilterLabel>
                <Select
                  name="program"
                  placeholder="Filter and select program(s)"
                  options={programs.map(program => ({ value: program.id, label: program.name }))}
                  onChange={selected => setSelectedPrograms(selected)}
                  selectedOptions={selectedPrograms}
                  setSelectedOptions={setSelectedPrograms}
                />
              </div>
              <div>
                <FilterLabel htmlFor="network">Blockchain network:</FilterLabel>
                <Select
                  name="network"
                  placeholder="Filter and select network"
                  options={CONFIG.chains.map(chain => ({ value: chain.name, label: chain.name }))}
                  onChange={selected => setSelectedNetwork(selected)}
                  selectedOptions={selectedNetwork}
                  setSelectedOptions={setSelectedNetwork}
                />
              </div>
              {teams && (
                <div>
                  <FilterLabel htmlFor="team">Name:</FilterLabel>
                  <Select
                    name="team"
                    placeholder="Filter and select name(s)"
                    options={teams.map(team => ({ value: team, label: team }))}
                    onChange={selected => setSelectedTeams(selected)}
                    selectedOptions={selectedTeams}
                    setSelectedOptions={setSelectedTeams}
                  />
                </div>
              )}
              <div>
                <FilterLabel htmlFor="create-date">{dateFilterLabel}:</FilterLabel>
                <div className="w-full">
                  <DatePicker
                    selectsRange={true}
                    startDate={startDate}
                    endDate={endDate}
                    showYearDropdown
                    onChange={update => {
                      setDateRange(update)
                    }}
                    customInput={<CustomDatepickInput onClear={() => setDateRange([null, null])} />}
                  />
                </div>
              </div>
              <div>
                <FilterLabel htmlFor="wallet-address">Wallet address:</FilterLabel>
                <div className="relative">
                  <input
                    className="appearance-none w-full focus:ring-indigo-600 focus:border-indigo-600 border-gray-300 border shadow-sm rounded-md px-3 py-2 text-sm bg-white"
                    type="text"
                    name="wallet-address"
                    id="wallet-address"
                    value={walletAddress}
                    onChange={event => setWalletAdress(event.currentTarget.value)}
                    placeholder="f1ifoar2uwirdrmr5hylvhpphdph6z6ahrqvxashw"
                  />
                  <div className={`${requestNumber ? 'absolute' : 'hidden'} top-[10px] right-4`}>
                    <button type="button" aria-label="Clear wallet address" onClick={() => setWalletAdress('')}>
                      <XMarkIcon width={16} height={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-4">
              <Button variant="outline" onClick={() => handleFilterClear()}>
                Clear
              </Button>
              <Button onClick={() => handleFilterApply()}>Apply</Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}

type FilterLabelProps = React.PropsWithChildren<
  Omit<DetailedHTMLProps<LabelHTMLAttributes<HTMLLabelElement>, HTMLLabelElement>, 'className'>
>

const FilterLabel = ({ children, ...props }: FilterLabelProps) => {
  return (
    <label className="text-sm font-medium leading-5 text-gray-700 mb-1" {...props}>
      {children}
    </label>
  )
}

const CustomDatepickInput = forwardRef<any, any>(({ value, onClick, onClear }, ref) => (
  <div className="relative flex items-center">
    <button
      id="create-date"
      name="create-date"
      className="appearance-none w-full focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600 border-gray-300 border shadow-sm rounded-md px-3 py-2 text-left text-sm bg-white pr-10"
      onClick={onClick}
      ref={ref}
    >
      {value || <span className="text-slate-500">Select a date interval</span>}
    </button>
    <button className="absolute right-4" aria-label="Clear options" onClick={() => onClear()}>
      <XMarkIcon width={16} height={16} />
    </button>
  </div>
))

CustomDatepickInput.displayName = 'CustomDatepickInput'

interface SelectProps {
  name: string
  options: SelectOption[]
  selectedOptions: SelectOption[]
  placeholder?: string
  setSelectedOptions: Dispatch<SetStateAction<SelectOption[]>>
  onChange: (selectedOptions: SelectOption[]) => void
}

function Select({ name, placeholder, options, onChange, selectedOptions, setSelectedOptions }: SelectProps) {
  const [optionsToggle, setOptionsToggle] = useState(false)
  const [textFilter, setTextFilter] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const select = (option: SelectOption) => {
    setSelectedOptions(prev => [...prev, option])
  }

  const unselect = (option: SelectOption) => {
    setSelectedOptions(prev => prev.filter(listOption => listOption.value !== option.value))
  }

  const selectableOptions = textFilter
    ? options.filter(option => {
        return (
          option.label.toLowerCase().includes(textFilter.toLowerCase()) &&
          !selectedOptions.some(selected => selected.value === option.value)
        )
      })
    : options.filter(option => !selectedOptions.some(selected => selected.value === option.value))

  useEffect(() => {
    onChange(selectedOptions)
  }, [selectedOptions, onChange])

  useEffect(() => {
    const handleFocusEvent = (e: FocusEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOptionsToggle(false)
      }
    }
    document.addEventListener('focusin', handleFocusEvent)
    document.addEventListener('mousedown', handleFocusEvent)

    return () => {
      document.removeEventListener('focusin', handleFocusEvent)
      document.removeEventListener('mousedown', handleFocusEvent)
    }
  }, [])

  return (
    <div ref={containerRef} className="w-full relative">
      <div
        className={`${
          optionsToggle ? 'ring-1 ring-indigo-600 border-indigo-600' : ''
        } flex border-gray-300 border shadow-sm rounded-md py-2`}
      >
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 px-2">
            {selectedOptions
              .sort((a, b) => a.label.localeCompare(b.label))
              .map(option => (
                <div key={option.value} className="flex items-center gap-2 p-2 bg-indigo-600 text-white rounded-md">
                  <div className="border-r border-white pr-2 text-sm">{option.label}</div>
                  <button
                    onClick={() => {
                      unselect(option)
                      inputRef.current?.focus()
                    }}
                    aria-label="Clear selected programs"
                  >
                    <XMarkIcon width={16} height={16} />
                  </button>
                </div>
              ))}
          </div>
          {selectedOptions.length > 0 && <hr className="m-2" />}
          <input
            name={name}
            id={name}
            className="appearance-none border-none shadow-none outline-none focus:ring-0 w-full px-3 py-0 text-sm"
            ref={inputRef}
            type="text"
            value={textFilter}
            onFocus={() => setOptionsToggle(true)}
            onChange={e => setTextFilter(e.currentTarget.value)}
            placeholder={placeholder}
            autoComplete="off"
          ></input>
        </div>
        <div className="flex items-center gap-2 mx-3">
          {selectedOptions.length > 0 && (
            <button aria-label="Clear options" onClick={() => setSelectedOptions([])}>
              <XMarkIcon width={16} height={16} />
            </button>
          )}
          <button aria-label="Toggle options" onClick={() => setOptionsToggle(prev => !prev)}>
            {optionsToggle ? (
              <ChevronUpIcon width={20} height={20} aria-hidden="true" />
            ) : (
              <ChevronDownIcon width={20} height={20} aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
      <ol
        className={`${
          optionsToggle ? 'absolute flex' : 'hidden'
        } max-h-40 overflow-y-scroll w-full flex-col py-2 mt-2 bg-white rounded-md shadow-lg z-50 border-gray-300 border`}
      >
        {selectableOptions
          .sort((a, b) => a.label.localeCompare(b.label))
          .map(option => (
            <button
              className="text-left text-sm px-4 py-1 hover:bg-indigo-600 hover:text-white"
              key={option.value}
              onClick={() => {
                select(option)
                inputRef.current?.focus()
              }}
            >
              {option.label}
            </button>
          ))}
        {selectableOptions.length === 0 && <div className="text-center">No options</div>}
      </ol>
    </div>
  )
}
