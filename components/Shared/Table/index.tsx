import { classNames } from 'lib/class-names'
import Link from 'next/link'

interface TableProps {
  style?: React.CSSProperties
  className?: string
  tableHasScrollbar?: boolean
}

interface TableHeaderProps {
  className?: string
  style?: React.CSSProperties
  minWidth?: number
}

interface TableCellProps {
  className?: string
  style?: React.CSSProperties
  minWidth?: number
}

interface TableLinkedCellProps {
  className?: string
  style?: React.CSSProperties
  href: string
}

interface TableHeadProps {
  className?: string
  style?: React.CSSProperties
}

interface TableBodyProps {
  className?: string
  style?: React.CSSProperties
}

export const Header: React.FunctionComponent<React.PropsWithChildren<TableHeaderProps>> = ({
  className = '',
  children,
  style,
  minWidth = 145,
}) => {
  return (
    <th
      scope="col"
      className={classNames(className, 'px-4 py-4 text-left capitalize text-base leading-tight whitespace-normal')}
      style={{ minWidth: minWidth, width: '100%', ...style }}
    >
      {children}
    </th>
  )
}

export const Cell: React.FunctionComponent<React.PropsWithChildren<TableCellProps>> = ({
  className = '',
  children,
  style,
  minWidth = 145,
}) => {
  return (
    <td className={classNames(className, 'px-4 py-4')} style={{ minWidth: minWidth, ...style }}>
      {children}
    </td>
  )
}

export const LinkedCell: React.FunctionComponent<React.PropsWithChildren<TableLinkedCellProps>> = ({
  className = '',
  children,
  style,
  href,
}) => {
  return (
    <Cell className={className} style={style}>
      <Link href={href}>{children}</Link>
    </Cell>
  )
}

export const Table: React.FunctionComponent<React.PropsWithChildren<TableProps>> = ({
  children,
  style,
  tableHasScrollbar = true,
  className = '',
}) => {
  return (
    <div className="w-full flex flex-col">
      <div className="-my-2 sm:-mx-6 lg:-mx-8">
        <div className="py-2 align-middle inline-block sm:px-6 lg:px-8 w-full">
          <div className="shadow">
            <table style={style} className={classNames(className, 'w-full h-full block', tableHasScrollbar && 'overflow-x-auto')}>
              {children}
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export const TableHead: React.FunctionComponent<React.PropsWithChildren<TableHeadProps>> = ({ className = '', children }) => {
  return (
    <thead
      className={classNames(
        className,
        'bg-azureish-white border-2 border-b-0 border-azureish-white text-deep-koamaru font-bold text-base flex-none whitespace-nowrap',
      )}
    >
      {children}
    </thead>
  )
}

export const TableBody: React.FunctionComponent<React.PropsWithChildren<TableBodyProps>> = ({ className = '', children }) => {
  return (
    <tbody
      className={classNames(
        className,
        'bg-white text-sm text-deep-koamaru divide-y-2 divide-y-azureish-white border-l-2 border-r-2 border-b-2 border-azureish-white',
      )}
    >
      {children}
    </tbody>
  )
}
