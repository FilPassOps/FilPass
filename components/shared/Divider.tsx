import { classNames } from 'lib/classNames'

interface DividerProps {
  className?: string
}

export const Divider = ({ className }: DividerProps) => <div className={classNames('w-full border-t border-gray-300', className)} />
