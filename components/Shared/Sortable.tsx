import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/solid'
import Link from 'next/link'
import { useRouter } from 'next/router'

interface SortableProps {
  by: string
  children: React.ReactNode
  defaultSortField?: string
  defaultSortOrder?: string
}

export default function Sortable({ by, children, defaultSortField = 'create_date', defaultSortOrder = 'desc' }: SortableProps) {
  const router = useRouter()
  const isSelectedForSort = router.query.sort === by
  const showIcon = isSelectedForSort || (!router.query.sort && by === defaultSortField)

  const order = router.query.order || defaultSortOrder
  const linkOrder = (isSelectedForSort && order === 'desc') || !router.query.order ? 'asc' : 'desc'
  const orderIcon = order === 'asc' ? <ChevronUpIcon className="h-5 w-5 inline" /> : <ChevronDownIcon className="h-5 w-5 inline" />

  const searchParams = new URLSearchParams({ ...router.query, sort: by, order: linkOrder })
  return (
    <Link href={`?${searchParams.toString()}`}>
      {children} {showIcon && orderIcon}
    </Link>
  )
}
