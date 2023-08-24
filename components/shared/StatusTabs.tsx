import { BLOCKED_STATUS, ON_HOLD_STATUS } from 'domain/transferRequest/constants'
import { classNames } from 'lib/classNames'
import debounce from 'lodash/debounce'
import { useRouter } from 'next/router'

interface StatusTabsProps {
  tabs: { name: string; href: { status: string[] } }[]
  status: string
}

export const StatusTabs = ({ tabs = [], status }: StatusTabsProps) => {
  const { push, query } = useRouter()

  if (status === BLOCKED_STATUS) {
    status = ON_HOLD_STATUS //ON_HOLD is an alias for BLOCKED
  }
  return (
    <div>
      <div className="hidden sm:block">
        <div className="relative">
          <nav className="-mb-px flex" aria-label="Tabs">
            {tabs.map(tab => {
              const currentTab = tabs.length === 1 ? true : tab.href.status.includes(status)
              return (
                <button
                  type="button"
                  key={tab.name}
                  onClick={debounce(
                    () => {
                      push({
                        query: {
                          ...query,
                          ...tab.href,
                        },
                      })
                    },
                    500,
                    { leading: false },
                  )}
                  className={classNames(
                    currentTab
                      ? 'border-indigo-500 text-deep-koamaru font-bold'
                      : 'border-transparent text-pastel-purple hover:text-gray-500 hover:border-gray-300',
                    'whitespace-nowrap py-4 border-b-4 px-8 z-10 text-center',
                  )}
                  aria-current={currentTab ? 'page' : undefined}
                >
                  {tab.name}
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
