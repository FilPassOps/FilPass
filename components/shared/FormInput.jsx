/* eslint-disable react/display-name */
import { Listbox } from '@headlessui/react'
import { ChevronDownIcon, ChevronUpIcon, EyeIcon, EyeSlashIcon, XMarkIcon } from '@heroicons/react/24/solid'
import { classNames } from 'lib/classNames'
import { forwardRef, useEffect, useRef, useState } from 'react'
import { IMaskInput } from 'react-imask'
import { NumericFormat } from 'react-number-format'
import errorsMessages from 'wordings-and-errors/errors-messages'
import { Button } from './Button'

export const NumberInput = forwardRef(({ error, id, label, rightIcon, className = '', disabled, ...props }, ref) => {
  const classes = getInputClasses({ error, disabled })
  return (
    <InputController id={id} label={label} error={error}>
      <div className="relative w-full">
        <NumericFormat id={id} getInputRef={ref} className={classNames(classes, className)} disabled={disabled} {...props} />
        {rightIcon && <div className="absolute flex justify-center items-center text-gray-500 right-3 inset-y-0">{rightIcon}</div>}
      </div>
    </InputController>
  )
})

export const SelectInput = forwardRef(
  (
    {
      error,
      id,
      label,
      value,
      onChange,
      options = [],
      placeholder,
      disabled,
      emptyState,
      className,
      buttonClasses,
      name,
      isClearable = false,
      ...props
    },
    // eslint-disable-next-line no-unused-vars
    ref
  ) => {
    const classes = getSelectClasses({ error, disabled })
    const selected = options.find(c => c.value === value) || null
    return (
      <InputController id={id} label={label} error={error} name={name}>
        <Listbox value={selected} onChange={val => onChange(val.value)} disabled={disabled} {...props}>
          {({ open }) => (
            <div className={classNames('mt-1 relative', className)}>
              <Listbox.Button className={classNames(classes, buttonClasses)} ref={ref}>
                <span className={classNames('block truncate', selected?.label ? 'text-black' : error ? 'text-red-300' : 'text-gray-500')}>
                  {selected?.decorator || ''}
                  {selected?.label || placeholder}
                </span>
                {!disabled && (
                  <span className="absolute inset-y-0 right-0 flex items-center pr-2 cursor-default">
                    {open ? (
                      <ChevronUpIcon className="h-7 w-7 text-gray-400" aria-hidden="true" />
                    ) : (
                      <ChevronDownIcon className="h-7 w-7 text-gray-400" aria-hidden="true" />
                    )}
                  </span>
                )}
                {isClearable && !disabled && (
                  <button
                    type="button"
                    onClick={() => onChange('')}
                    title="Clear filter"
                    className="absolute bottom-2.5 text-gray-400 cursor-pointer hover:text-gray-500 right-9"
                  >
                    <XMarkIcon height={16} width={16} />
                  </button>
                )}
              </Listbox.Button>

              <Listbox.Options className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                {emptyState && !options.length && (
                  <Listbox.Option disabled>
                    <div className="flex flex-1 items-center pl-4 pt-3 pb-3">
                      <span className={classNames('block truncate font-normal')}>{emptyState}</span>
                    </div>
                  </Listbox.Option>
                )}
                {options.map(option => (
                  <Listbox.Option
                    key={option.value}
                    className={({ active }) =>
                      classNames(active ? 'text-white bg-indigo-600' : 'text-gray-900', 'cursor-default select-none relative p-3')
                    }
                    value={option}
                  >
                    {({ selected }) => (
                      <div className="flex flex-1 items-center gap-0.5">
                        <span className={classNames(selected ? 'font-semibold' : 'font-normal', 'block truncate')}>{option.label}</span>

                        {option?.rightElement}
                      </div>
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </div>
          )}
        </Listbox>
      </InputController>
    )
  }
)

export const MultipleSelectInput = ({
  id,
  label,
  error,
  placeholder,
  disabled,
  emptyState,
  value = [],
  onChange,
  options,
  variant,
  name,
  truncate = false,
  ...rest
}) => {
  const [selecteds, setSelecteds] = useState(value)
  const classes = getSelectClasses({ error, disabled, variant })

  return (
    <InputController id={id} label={label} error={error} name={name}>
      <Listbox defaultValue={selecteds} disabled={disabled} name={name} {...rest}>
        {({ open }) => (
          <>
            <div className="mt-1 relative">
              <Listbox.Button className={classes} title={selecteds.map(item => item.label).join(', ')}>
                <span
                  className={classNames(
                    selecteds.length > 0
                      ? `text-black ${truncate ? 'truncate inline-block w-[calc(80%)]' : ''}`
                      : error
                      ? 'text-red-300'
                      : variant === 'invisible'
                      ? 'text-black'
                      : 'text-gray-500'
                  )}
                >
                  {selecteds.length > 0 ? selecteds.map(({ label }) => label).join(', ') : placeholder}
                </span>
                {!disabled && (
                  <span className="absolute inset-y-0 right-0 flex items-center pr-2 cursor-default">
                    {open ? (
                      <ChevronUpIcon className="h-7 w-7 text-gray-400" aria-hidden="true" />
                    ) : (
                      <ChevronDownIcon className="h-7 w-7 text-gray-400" aria-hidden="true" />
                    )}
                  </span>
                )}
              </Listbox.Button>
              <Listbox.Options className="absolute z-20 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                {emptyState && !options.length && (
                  <Listbox.Option disabled>
                    {() => (
                      <div className="flex flex-1 items-center pl-4 pt-3 pb-3">
                        <span className={classNames('block truncate font-normal')}>{emptyState}</span>
                      </div>
                    )}
                  </Listbox.Option>
                )}
                <div className="overflow-auto max-h-36">
                  {options.map(option => {
                    const handleChange = () => {
                      if (selecteds.find(item => item.value === option.value)) {
                        onChange && onChange(selecteds.filter(item => item.value !== option.value))
                        setSelecteds(selecteds.filter(item => item.value !== option.value))
                      } else {
                        onChange && onChange([...selecteds, option])
                        setSelecteds([...selecteds, option])
                      }
                    }
                    return (
                      <div key={option.value} className="relative">
                        {option.tooltip && (
                          <div className="absolute break-normal h-11 text-xs bg-gray-700 text-white opacity-0 hover:opacity-100 p-2 z-50">
                            {option.tooltip}
                          </div>
                        )}
                        <div
                          className={classNames(
                            'cursor-default select-none relative p-3 text-gray-900 ',
                            !disabled && 'hover:bg-indigo-600 hover:text-white',
                            (disabled || option.disabled) && 'opacity-50 hover:bg-white pointer-events-none'
                          )}
                        >
                          <div className="flex flex-1 w-full items-center">
                            <CheckboxInput
                              id={option.value}
                              value={Boolean(selecteds.find(item => item.value === option.value))}
                              onChange={handleChange}
                              className="w-full"
                              disabled={disabled}
                              title={option.tooltip}
                            >
                              <span className="flex items-center truncate">{option.label}</span>
                            </CheckboxInput>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Listbox.Options>
            </div>
          </>
        )}
      </Listbox>
    </InputController>
  )
}

export const MultipleSelectInputV2 = ({
  id,
  label,
  error,
  placeholder,
  disabled,
  emptyState,
  value = [],
  onChange,
  options,
  variant,
  name,
  actionComponent = null,
  ...rest
}) => {
  const [selecteds, setSelecteds] = useState(value)
  useEffect(() => {
    if (value.length !== selecteds.length) {
      setSelecteds(value)
    }
  }, [value, selecteds])
  const classes = getSelectClasses({ error, disabled, variant })
  return (
    <InputController id={id} label={label} error={error} name={name}>
      <Listbox defaultValue={selecteds} disabled={disabled} name={name} {...rest}>
        {() => (
          <>
            <div className="mt-1 relative">
              <Listbox.Button className={classes}>
                <span className="text-gray-500">{placeholder}</span>
                <span className="absolute inset-y-0 right-0 flex items-center pr-2 cursor-default">
                  <ChevronDownIcon className="h-7 w-7 text-gray-400" aria-hidden="true" />
                </span>
              </Listbox.Button>
              {!disabled && actionComponent}
              <Listbox.Options className="absolute z-20 mt-1 w-min bg-white shadow-lg max-h-60 rounded-md text-base ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm right-0 overflow-hidden">
                {emptyState && !options.length && (
                  <Listbox.Option disabled>
                    {() => (
                      <div className="flex flex-1 items-center pl-4 pt-3 pb-3">
                        <span className={classNames('block truncate font-normal')}>{emptyState}</span>
                      </div>
                    )}
                  </Listbox.Option>
                )}
                <div className="overflow-auto max-h-36">
                  {options.map(option => {
                    const handleChange = () => {
                      if (selecteds.find(item => item.value === option.value)) {
                        onChange && onChange(selecteds.filter(item => item.value !== option.value))
                        setSelecteds(selecteds.filter(item => item.value !== option.value))
                      } else {
                        onChange && onChange([...selecteds, option])
                        setSelecteds([...selecteds, option])
                      }
                    }
                    return (
                      <div
                        key={option.value}
                        className={classNames(
                          'cursor-default select-none relative p-3 text-gray-900 ',
                          !disabled && 'hover:bg-indigo-600 hover:text-white',
                          disabled && 'opacity-50 hover:bg-white pointer-events-none'
                        )}
                      >
                        <div className="flex flex-1 w-full items-center">
                          <CheckboxInput
                            id={option.value}
                            value={Boolean(selecteds.find(item => item.value === option.value))}
                            onChange={handleChange}
                            className="w-full"
                            disabled={option.disabled}
                          >
                            <span className="flex items-center truncate">{option.label}</span>
                          </CheckboxInput>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Listbox.Options>
            </div>
          </>
        )}
      </Listbox>
    </InputController>
  )
}

export const CheckRadioInput = forwardRef(
  ({ formId = 'profile', error, label, options = [], value, disabled, checkboxPosition = 'justify-start', ...props }, ref) => {
    const { checkboxClasses, iconClasses } = getRadioClasses({ error, disabled })

    return (
      <>
        <div className="text-center text-sm leading-5 font-medium text-gray-700">{label}</div>
        <div role="radiogroup" className={`flex ${checkboxPosition} items-center gap-4 mt-3`}>
          {options.map((option, index) => (
            <div key={`${formId}-${option}-${index}`} className="flex relative items-center">
              <input
                {...props}
                id={`${formId}-${option}-${index}`}
                ref={ref}
                type="radio"
                value={option}
                className={checkboxClasses}
                disabled={disabled}
                tabIndex={0}
              />
              <label htmlFor={`${formId}-${option}-${index}`} className="flex items-center font-medium text-gray-700 text-sm">
                <div
                  role="radio"
                  aria-checked={value === option}
                  style={{ minWidth: '1rem', minHeight: '1rem' }}
                  className={iconClasses(value === option)}
                >
                  {value === option && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path
                        d="M9.20643 0.792787C9.3939 0.980314 9.49922 1.23462 9.49922 1.49979C9.49922 1.76495 9.3939 2.01926 9.20643 2.20679L4.20643 7.20679C4.0189 7.39426 3.76459 7.49957 3.49943 7.49957C3.23427 7.49957 2.97996 7.39426 2.79243 7.20679L0.792431 5.20679C0.610272 5.01818 0.509478 4.76558 0.511757 4.50339C0.514035 4.24119 0.619204 3.99038 0.804612 3.80497C0.99002 3.61956 1.24083 3.51439 1.50303 3.51211C1.76523 3.50983 2.01783 3.61063 2.20643 3.79279L3.49943 5.08579L7.79243 0.792787C7.97996 0.605316 8.23427 0.5 8.49943 0.5C8.7646 0.5 9.0189 0.605316 9.20643 0.792787Z"
                        fill="white"
                      />
                    </svg>
                  )}
                </div>
                {option}
              </label>
            </div>
          ))}
        </div>
      </>
    )
  }
)

export const CheckboxInput = forwardRef(({ error, id, children, name, onChange = () => {}, onBlur, value, disabled, className }, ref) => {
  const checkboxClasses = getCheckboxClasses({ error, disabled })
  return (
    <div className="relative flex items-start w-full">
      <div className={classNames('flex', className)}>
        <input
          id={id}
          name={name}
          ref={ref}
          type="checkbox"
          className={checkboxClasses}
          disabled={disabled}
          onChange={onChange}
          checked={value}
          onBlur={onBlur}
        />
        <label htmlFor={id} className="flex items-center w-full">
          <div className="w-full">{children}</div>
        </label>
      </div>
    </div>
  )
})

export const TextInput = forwardRef(({ error, id, label, className, disabled, name, ...props }, ref) => {
  const classes = getInputClasses({ error, disabled })
  return (
    <InputController id={id} label={label} error={error} name={name}>
      <input ref={ref} id={id} name={name} className={classNames(classes, className)} disabled={disabled} {...props} />
    </InputController>
  )
})

export const TextArea = forwardRef(({ error, id, label, className, disabled, ...props }, ref) => {
  const classes = getInputClasses({ error, disabled })
  return (
    <InputController id={id} label={label} error={error}>
      <textarea ref={ref} id={id} className={classNames(classes, className)} disabled={disabled} {...props} />
    </InputController>
  )
})

export const PasswordInput = forwardRef(({ error, label, id, disabled, ...props }, ref) => {
  const classes = getInputClasses({ error, disabled })
  const [show, setShowPassword] = useState(false)

  return (
    <InputController id={id} label={label} error={error}>
      <>
        <input
          id={id}
          ref={ref}
          className={classNames(classes, 'pr-10')}
          type={!show ? 'password' : 'text'}
          autoComplete="current-password"
          disabled={disabled}
          {...props}
        />
        <div className="absolute inset-y-0 right-0 flex items-center space-x-2 pr-3">
          <div className="h-5 cursor-pointer" onClick={() => setShowPassword(curr => !curr)}>
            {!show && <EyeIcon className="h-5 w-5 text-gray-300" />}
            {show && <EyeSlashIcon className="h-5 w-5 text-gray-300" />}
          </div>
        </div>
      </>
    </InputController>
  )
})

export const UploadFileButton = ({ children, onChange, disabled, loading, accept = 'application/pdf' }) => {
  const inputRef = useRef(null)

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        name="file"
        id="file"
        accept={accept}
        className="hidden"
        onClick={e => (e.target.value = null)}
        onChange={e => onChange && onChange(e.target.files[0])}
      />
      <Button onClick={() => inputRef?.current?.click()} disabled={disabled} loading={loading}>
        {children}
      </Button>
    </>
  )
}

const Label = ({ inputId, children }) => {
  return (
    <label id={`label-${inputId}`} htmlFor={inputId} className="block text-sm font-medium leading-5 text-gray-700">
      {children}
    </label>
  )
}

const InputController = ({ id, label, error, children, name: inputName }) => {
  return (
    <div className="w-full">
      <Label inputId={id}>{label}</Label>
      <div className="mt-1 relative">{children}</div>
      {error && (
        <p className="mt-1 text-sm text-red-500">
          {error.message && error.message}
          {!error.message && getErrorMessage(error, inputName)}
        </p>
      )}
    </div>
  )
}

export const DateInput = forwardRef(({ error, id, label, className, disabled, value, onChange, ...props }, ref) => {
  const classes = getInputClasses({ error, disabled })
  return (
    <InputController id={id} label={label} error={error}>
      <IMaskInput
        className={classNames(classes, className)}
        mask={Date}
        inputRef={ref}
        onAccept={value => onChange(value)}
        defaultValue={value}
        {...props}
      />
    </InputController>
  )
})

const getErrorMessage = (error, inputName) => {
  let { type } = error
  if (Array.isArray(error)) {
    type = error.find(e => e?.ref?.name === inputName)?.type
    if (!type) return ''
  }

  if (type === 'required' || type === 'min') {
    return errorsMessages.required_field.message
  }

  if (type === 'internal') {
    return error[inputName]
  }

  console.log('Unmapped field error', `Type:${type}`)
  return ''
}

export const getInputClasses = ({ error, disabled }) =>
  classNames(
    error && 'border-red-300 text-red-900 placeholder-red-300 focus:outline-none focus:ring-red-500 focus:border-red-500 focus:ring-1',
    !error && 'focus:ring-indigo-500 focus:border-indigo-500 border-gray-300',
    'border leading-5 shadow-sm block w-full rounded-md px-3 py-2 text-sm bg-white',
    disabled && 'cursor-default opacity-50 bg-gray-100'
  )

const getSelectClasses = ({ error, disabled, variant }) =>
  classNames(
    error && 'border-red-300 text-red-900 placeholder-red-300 focus:outline-none focus:ring-red-500 focus:border-red-500',
    !error && 'focus:ring-indigo-500 focus:border-indigo-500 border-gray-300',
    'leading-5 block w-full',
    'bg-white relative w-full py-2 text-left cursor-default focus:outline-none text-sm',
    variant !== 'invisible' && 'pl-3 pr-10 border shadow-sm rounded-md focus:ring-1',
    disabled && variant !== 'invisible' && 'cursor-default opacity-50 bg-gray-100',
    disabled && variant === 'invisible' && 'cursor-default opacity-50'
  )

const getCheckboxClasses = ({ error, disabled }) => {
  return classNames(
    error && 'bg-red-100 border border-red-300',
    disabled && 'cursor-default opacity-50',
    !error && 'border border-gray-300',
    'focus:ring-indigo-500 h-4 w-4 text-indigo-600 rounded mr-3'
  )
}

const getRadioClasses = ({ error, disabled }) => {
  const checkboxClasses = classNames(
    error && 'bg-red-100',
    disabled && 'cursor-default opacity-50 bg-gray-300',
    'h-4 w-4 text-white rounded mr-3'
  )
  const iconClasses = checked =>
    classNames(
      error && 'border border-red-300',
      disabled && 'cursor-default opacity-70',
      checked && 'bg-indigo-600 border border-indigo-600',
      !checked && !error && 'bg-white border border-gray-300',
      'focus:ring-indigo-500 h-4 w-4 rounded absolute top-0.5 left-0 flex items-center justify-center'
    )

  return { checkboxClasses, iconClasses }
}
