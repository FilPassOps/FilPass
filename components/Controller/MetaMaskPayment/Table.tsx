import { twMerge } from 'tailwind-merge'

interface TableProps {
  cols?: 'grid-cols-2' | 'grid-cols-3' | 'grid-cols-4' | 'grid-cols-5'
  className?: string
}

export const Table: React.FC<React.PropsWithChildren<TableProps>> = ({ children, cols = 'grid-cols-4', className }) => {
  return (
    <div className={twMerge(`min-w-max max-h-96 overflow-y-scroll grid ${cols} border border-gray-200 text-sm sm:text-base`, className)}>
      {children}
    </div>
  )
}

export const TableHeader: React.FC<React.PropsWithChildren<unknown>> = ({ children }) => {
  return <div className="bg-azureish-white p-4 font-bold sticky top-0">{children}</div>
}

export const TableDiv: React.FC<React.PropsWithChildren<unknown>> = ({ children }) => {
  return <div className="p-4 border-t border-gray-200 flex items-center">{children}</div>
}
