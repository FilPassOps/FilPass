import { classNames } from 'lib/classNames'
import debounce from 'lodash/debounce'
import { useRouter } from 'next/router'
import { useSWRConfig } from 'swr'

interface TabsProps {
  tabs: { label: string; href: { status: string } }[]
  status: string
}

export const Tabs = ({ tabs, status }: TabsProps) => {
  const { push, query } = useRouter()
  const swrConfig = useSWRConfig()
  const cache = swrConfig.cache as any

  return (
    <div>
      <div className="hidden sm:block">
        <div className="relative">
          <nav className="-mb-px flex" aria-label="Tabs">
            {tabs.map(tab => {
              const currentTab = tabs.length === 1 ? true : tab.href.status === status
              return (
                <button
                  type="button"
                  key={tab.label}
                  onClick={debounce(
                    () => {
                      push({
                        query: {
                          ...query,
                          ...tab.href,
                        },
                      })
                      cache.clear()
                    },
                    500,
                    { leading: false }
                  )}
                  className={classNames(
                    currentTab
                      ? 'border-indigo-500 text-deep-koamaru font-bold'
                      : 'border-transparent text-pastel-purple hover:text-gray-500 hover:border-gray-300',
                    'whitespace-nowrap py-4 border-b-4 px-8 z-10 text-center'
                  )}
                  aria-current={currentTab ? 'page' : undefined}
                >
                  {tab.label}
                </button>
              )
            })}
          </nav>
          <div className="border-b-4 border-gray-200 absolute w-full bottom-0" />
        </div>
      </div>
    </div>
  )
}
