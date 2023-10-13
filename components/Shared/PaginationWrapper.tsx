import { ChevronDoubleLeftIcon, ChevronDoubleRightIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { KeyboardEvent, ReactNode } from 'react'

import { classNames } from 'lib/class-names'
import { useRouter } from 'next/router'
import { Button } from './Button'
import { NumberInput, SelectInput } from './FormInput'
import { LoadingIndicator } from './LoadingIndicator'

export interface PaginationWrapperProps {
  children: ReactNode
  totalItems?: number
  pageSize?: number
  isLoading?: boolean
  childrenContainerClass?: string
}

export const PaginationWrapper = ({
  children,
  totalItems = 0,
  pageSize = 100,
  isLoading = false,
  childrenContainerClass = '',
}: PaginationWrapperProps) => {
  const { push, query } = useRouter()

  const totalPages = Math.ceil(totalItems / pageSize)
  const currentPage = parseInt(query.page as string) || 1

  const handlePageChangedOnTextField = (event: KeyboardEvent<HTMLInputElement>) => {
    const { currentTarget, code } = event
    if (!code || code !== 'Enter') {
      return
    }

    const value = parseInt(currentTarget.value)

    if (!value) {
      return
    }

    if (value <= 0) {
      return changePage({ page: 1 })
    }

    changePage({ page: value > totalPages ? totalPages : value })
  }

  const changePage = (params: object) => {
    push({
      query: {
        ...query,
        ...params,
      },
    })
  }

  const options = [
    {
      value: '100',
      label: '100 items',
    },
    {
      value: '200',
      label: '200 items',
    },
    {
      value: '500',
      label: '500 items',
    },
    {
      value: '1000',
      label: '1000 items',
    },
  ]

  return (
    <>
      <div className={classNames('w-full', childrenContainerClass)}>{children}</div>
      <div className="flex flex-col sm:flex-row pt-6 justify-between mb-48 w-full ">
        <div className="flex flex-row items-center">
          <p>Show</p>
          <div className="mx-2">
            <SelectInput
              //@ts-ignore
              options={options}
              name="itemsPerPage"
              label=""
              value={`${pageSize}`}
              onChange={(value: number) => changePage({ page: 1, itemsPerPage: value })}
            />
          </div>
          <p> Total {totalItems} Items</p>
        </div>
        <div className="flex justify-center mt-4">{isLoading && <LoadingIndicator className="text-indigo-500" />}</div>
        <div className="flex flex-row items-center">
          <div className="flex flex-row items-center mr-2">
            <p>Page </p>
            <div className="w-16 mx-2">
              {/* @ts-ignore  */}
              <NumberInput disabled={!totalItems || totalItems <= 100} value={currentPage} onKeyPress={handlePageChangedOnTextField} />
            </div>
            <p>of {totalPages} </p>
          </div>
          <div className="flex flex-row items-center">
            <Button
              defaultStyle={false}
              className="mr-1"
              disabled={currentPage === 1}
              buttonStyle="p-1 rounded-md shadow-sm border focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={() => changePage({ page: 1 })}
            >
              <ChevronDoubleLeftIcon width={12} />
            </Button>
            <Button
              defaultStyle={false}
              className="mr-1"
              disabled={currentPage === 1}
              onClick={() => changePage({ page: currentPage - 1 })}
              buttonStyle="p-1 rounded-md shadow-sm border focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <ChevronLeftIcon width={12} />
            </Button>
            <Button
              defaultStyle={false}
              className="mr-1"
              disabled={currentPage >= totalPages}
              onClick={() => changePage({ page: currentPage + 1 })}
              buttonStyle="p-1 rounded-md shadow-sm border focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <ChevronRightIcon width={12} />
            </Button>
            <Button
              defaultStyle={false}
              disabled={currentPage >= totalPages}
              onClick={() => changePage({ page: totalPages })}
              buttonStyle="p-1 rounded-md shadow-sm border focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <ChevronDoubleRightIcon width={12} />
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}

export const checkItemsPerPage = (itemsPerPage: any) => {
  const PAGINATION_DEFAULT_VALUES = ['100', '200', '500', '1000']

  return PAGINATION_DEFAULT_VALUES.includes(itemsPerPage)
}

export const getItemsPerPage = (itemsPerPage: any) => {
  const PAGINATION_DEFAULT_VALUES = ['100', '200', '500', '1000']

  const pageSize = PAGINATION_DEFAULT_VALUES.find(item => item === itemsPerPage)

  return parseInt(pageSize || PAGINATION_DEFAULT_VALUES[0])
}
