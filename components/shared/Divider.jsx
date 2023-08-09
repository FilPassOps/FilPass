import { classNames } from 'lib/classNames'

export const Divider = ({ className }) => (
  <div className={classNames('w-full border-t border-gray-300', className)} />
)
