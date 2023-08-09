import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/solid'
import Link from 'next/link'
import { useRouter } from 'next/router'

export default function Sortable({ by, children, defaultSortField = 'create_date', defaultSortOrder = 'desc' }) {
  const router = useRouter()
  const isSelectedForSort = router.query.sort === by
  const showIcon = isSelectedForSort || (!router.query.sort && by === defaultSortField)

  let order = router.query.order || defaultSortOrder
  const linkOrder = (isSelectedForSort && order === 'desc') || !router.query.order ? 'asc' : 'desc'
  const orderIcon = order === 'asc' ? <ChevronUpIcon className="h-5 w-5 inline" /> : <ChevronDownIcon className="h-5 w-5 inline" />

  let searchParams = new URLSearchParams({ ...router.query, sort: by, order: linkOrder })
  return (
    (<Link href={`?${searchParams.toString()}`}>

      {children} {showIcon && orderIcon}

    </Link>)
  );
}
