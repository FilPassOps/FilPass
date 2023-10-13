import { twMerge } from 'tailwind-merge'

interface DividerProps {
  className?: string
  label?: string
}

export const Divider = ({ className, label }: DividerProps) => {
  if (label) {
    return (
      <div className="flex items-center">
        <div className="flex-grow bg-gray-300 h-0.5"></div>
        <div className="mx-4 text-gray-500">{label}</div>
        <div className="flex-grow bg-gray-300 h-0.5"></div>
      </div>
    )
  } else {
    return <div className={twMerge('w-full border-t border-gray-300', className)} />
  }
}
