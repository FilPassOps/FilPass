import { CheckIcon, ExclamationTriangleIcon, InformationCircleIcon, XMarkIcon } from '@heroicons/react/24/solid'
import React, { Dispatch, FC, HTMLAttributes, SetStateAction, createContext, useContext, useRef, useState } from 'react'

type AlertType = 'success' | 'error' | 'warning'

interface AlertConfig {
  timeout?: number
  closeable?: boolean
}

interface DispatchedAlert {
  type?: AlertType
  title: string
  config?: AlertConfig
  body?: React.FC<React.PropsWithChildren<unknown>>
}

const AlertDispatcherContext = createContext<{
  ref?: React.RefObject<HTMLDialogElement>
  dispatchedAlert?: DispatchedAlert
  setDispatchedAlert: Dispatch<SetStateAction<DispatchedAlert | undefined>>
}>({
  setDispatchedAlert: () => {
    throw new Error('No alert context provider')
  },
})

export const useAlertDispatcher = () => {
  const { ref, setDispatchedAlert } = useContext(AlertDispatcherContext)

  const dispatch = (alert: DispatchedAlert) => {
    setDispatchedAlert(alert)

    if (!ref?.current?.open) {
      ref?.current?.showModal()
    }

    if (alert.config?.timeout) {
      setTimeout(() => {
        ref?.current?.close()
      }, alert.config.timeout)
    }
  }
  const close = () => {
    ref?.current?.close()
    setDispatchedAlert(undefined)
  }

  return { dispatch, close }
}

export const AlertDispatcherProvider: FC<React.PropsWithChildren<unknown>> = ({ children }) => {
  const [dispatchedAlert, setDispatchedAlert] = useState<DispatchedAlert>()
  const ref = useRef<HTMLDialogElement>(null)

  return <AlertDispatcherContext.Provider value={{ ref, dispatchedAlert, setDispatchedAlert }}>{children}</AlertDispatcherContext.Provider>
}

export const AlertContainer: FC<React.PropsWithChildren<unknown>> = () => {
  const { ref, dispatchedAlert } = useContext(AlertDispatcherContext)

  return (
    <dialog ref={ref} id="alert" className="relative rounded w-full md:w-[512px] bg-white shadow-2xl border border-gray-200 p-12">
      {dispatchedAlert?.config?.closeable && (
        <button className="absolute top-4 right-4 text-gray-800" onClick={() => ref?.current?.close()}>
          <XMarkIcon className="h-5 w-5 text-gray-400" aria-label="Close dialog" />
        </button>
      )}
      <Alert alert={dispatchedAlert} />
    </dialog>
  )
}

interface AlertProps {
  alert?: DispatchedAlert
}

const Alert: React.FC<React.PropsWithChildren<AlertProps>> = ({ alert }) => {
  if (!alert) return null

  const { type, title, body: BodyRender } = alert

  return (
    <>
      <div className="flex justify-center items-center pb-2">
        <AlertIcon type={type} />
      </div>
      <div className="flex items-center justify-center"></div>
      <h1 className="my-2 font-medium text-lg leading-6 text-center">{title}</h1>
      <div className="text-sm leading-5 text-gray-500">{BodyRender && <BodyRender />}</div>
    </>
  )
}

const AlertIcon = ({ type }: { type?: AlertType }) => {
  switch (type) {
    case 'success':
      return (
        <span className="rounded-full w-14 h-14 flex justify-center items-center bg-green-100">
          <CheckIcon className="h-7 w-7 text-green-500" />
        </span>
      )
    case 'warning':
      return (
        <span className="rounded-full w-14 h-14 flex justify-center items-center bg-yellow-100">
          <ExclamationTriangleIcon className="h-7 w-7 text-yellow-600" />
        </span>
      )
    case 'error':
      return (
        <span className="rounded-full w-14 h-14 flex justify-center items-center bg-red-100">
          <XMarkIcon className="h-7 w-7 text-red-500" />
        </span>
      )
    default:
      return null
  }
}

interface PageAlertProps {
  type?: 'success' | 'error' | 'warning' | 'info'
  withIcon?: boolean
  className?: HTMLAttributes<HTMLDivElement>['className']
}

const pageAlertTypeMap = {
  success: {
    background: 'bg-approved-green',
    textColor: 'text-kelly-green',
    icon: CheckIcon,
    iconColor: 'text-kelly-green',
  },
  warning: {
    background: 'bg-papaya-whip',
    textColor: 'text-gamboge-orange',
    icon: ExclamationTriangleIcon,
    iconColor: 'text-yellow-600',
  },
  error: {
    background: 'bg-light-red',
    textColor: 'text-red-700',
    icon: XMarkIcon,
    iconColor: 'text-red-700',
  },
  info: {
    background: 'bg-blue-100',
    textColor: 'text-blue-600',
    icon: InformationCircleIcon,
    iconColor: 'text-blue-600',
  },
}

export const PageAlert: React.FC<React.PropsWithChildren<PageAlertProps>> = props => {
  const { type = 'info', withIcon = true, children, className = '' } = props
  const Icon = pageAlertTypeMap[type].icon

  if (!children) return null

  return (
    <div className={`${pageAlertTypeMap[type].background} p-4 mt-5 flex gap-3 rounded items-center ${className}`}>
      {withIcon && <Icon className={`${pageAlertTypeMap[type].iconColor} w-6 h-6`} />}
      <div className={`${pageAlertTypeMap[type].textColor} flex-1 flex-col text-sm font-medium`}>{children}</div>
    </div>
  )
}
