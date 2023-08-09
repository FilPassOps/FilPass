import { classNames } from 'lib/classNames'
import Link from 'next/link'
import { ButtonHTMLAttributes, DetailedHTMLProps, forwardRef } from 'react'
import { LoadingIndicator } from './LoadingIndicator'
import styles from './button.module.css'

type Variant =
  | 'primary'
  | 'primary-lighter'
  | 'secondary'
  | 'tertiary'
  | 'outline'
  | 'outline-green'
  | 'outline-red'
  | 'outline-blue'
  | 'red'
  | 'green'
  | 'opacity-red'
  | 'none'

export interface ButtonProps extends Omit<DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>, 'ref'> {
  loading?: boolean
  variant?: Variant
  defaultStyle?: boolean
  toolTipText?: string
  buttonStyle?: string
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    onClick,
    children,
    disabled = false,
    loading = false,
    type = 'button',
    variant = 'primary',
    className = 'w-full',
    defaultStyle = true,
    toolTipText = '',
    buttonStyle = '',
  },
  ref
) {
  return (
    <div className={classNames(toolTipText.length > 0 && styles.trigger, toolTipText.length > 0 && 'relative', className)}>
      <button
        ref={ref}
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={classNames(getButtonClasses({ variant, disabled, defaultStyle }), buttonStyle)}
      >
        {loading && <LoadingIndicator className="-ml-1 mr-3" />}
        {children}
      </button>
      {toolTipText.length > 0 && <div className={styles.tooltip}>{toolTipText}</div>}
    </div>
  )
})

interface LinkButtonProps extends ButtonProps {
  href: string
}

export function LinkButton({
  children,
  href = '',
  disabled = false,
  variant = 'primary',
  defaultStyle = true,
  className = '',
}: LinkButtonProps) {
  return (
    <Link
      href={href}
      passHref={true}
      className={classNames(getButtonClasses({ disabled, variant, defaultStyle }), className)}>
      {children}
    </Link>
  );
}

interface getButtonClassesParams {
  variant: string
  disabled: boolean
  defaultStyle: boolean
}

function getButtonClasses({ variant, disabled, defaultStyle }: getButtonClassesParams) {
  return classNames(
    variant === 'primary' && 'bg-indigo-600 hover:bg-indigo-700 border-transparent text-white',
    disabled && 'opacity-50 pointer-events-none',
    variant === 'primary-lighter' && 'bg-indigo-100 hover:bg-indigo-200 border-transparent text-indigo-600',
    variant === 'secondary' && 'border-black hover:shadow-inner',
    variant === 'tertiary' && 'bg-yellow-600 hover:bg--yellow-700 border-transparent text-white',
    variant === 'outline' && 'border border-gray-300 bg-white text-gray-700 hover:shadow-inner',
    variant === 'outline-green' && 'border border-green-600 bg-white text-green-600 hover:text-green-700 hover:border-green-700',
    variant === 'outline-red' && 'border border-red-600 bg-white text-red-600 hover:text-red-700 hover:border-red-700 w-full',
    variant === 'outline-blue' && 'border border-sky-600 bg-white text-sky-600 hover:text-sky-700 hover:border-sky-700',
    variant === 'outline-blue' && disabled && 'border-gray-500 text-gray-500',
    defaultStyle &&
      'text-sm w-full leading-5 font-medium flex justify-center py-2 px-4 rounded-md shadow-sm border focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500',
    variant === 'red' && 'bg-red-600 hover:bg-red-700 text-white',
    variant === 'green' && 'bg-green-600 hover:bg-green-700 text-white',
    variant === 'opacity-red' && 'bg-red-100 hover:bg-red-200 text-red-400 shadow-none border-none font-light',
    variant === 'none' && 'border-none shadow-none'
  )
}
