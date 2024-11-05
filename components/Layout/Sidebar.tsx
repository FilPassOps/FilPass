/* eslint-disable @next/next/no-img-element */
import {
  CircleStackIcon,
  DocumentTextIcon,
  IdentificationIcon,
  LifebuoyIcon,
  UserIcon,
  UsersIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/solid'

import { useAuth } from 'components/Authentication/Provider'
import { LinkButton } from 'components/Shared/Button'
import { RoleComponent } from 'components/Shared/RoleComponent'
import { AppConfig } from 'config'
import { ADDRESS_MANAGER_ROLE, SUPERADMIN_ROLE, USER_ROLE } from 'domain/auth/constants'

import { UserResult } from 'domain/user'
import { classNames } from 'lib/class-names'
import Link from 'next/link'
import { useRouter } from 'next/router'
import projectVersion from 'project-version'
import { Dispatch, SetStateAction, useEffect, useMemo, useState } from 'react'

interface NavigationItem {
  target: string
  text: string
  icon: React.ForwardRefExoticComponent<
    React.PropsWithoutRef<React.SVGProps<SVGSVGElement>> & { title?: string; titleId?: string } & React.RefAttributes<SVGSVGElement>
  >
  roles: string[]
  items?: {
    text: string
    roles: string[]
    filter?: string
    subPath?: string
    params?: string
  }[]
}

const navigation: NavigationItem[] = [
  {
    target: '/transfer-credits',
    text: 'Channels',
    icon: CircleStackIcon,
    roles: [USER_ROLE],
    items: [
      {
        text: 'Overview',
        roles: [USER_ROLE],
      },
      {
        text: 'Create Channel',
        roles: [USER_ROLE],
        subPath: '/create-channel',
      },
      {
        text: 'Transaction History',
        roles: [USER_ROLE],
        subPath: '/transaction-history',
      },
    ],
  },
  {
    target: '/user-settings',
    text: 'User Settings',
    icon: UsersIcon,
    roles: [SUPERADMIN_ROLE],
  },
  {
    target: '/user-address',
    text: 'User Address',
    icon: IdentificationIcon,
    roles: [ADDRESS_MANAGER_ROLE],
  },
  {
    target: '/transaction-manager',
    text: 'Transactions',
    icon: DocumentTextIcon,
    roles: [SUPERADMIN_ROLE],
  },
  {
    target: '/profile-settings',
    text: 'Profile & Settings',
    icon: UserIcon,
    roles: [],
  },
]

interface SidebarProps {
  toggle?: boolean
  setSidebarToggle: Dispatch<SetStateAction<boolean>>
}

export const Sidebar = ({ toggle = false, setSidebarToggle }: SidebarProps) => {
  const { user } = useAuth()

  const filteredNavigationList = useMemo(
    () => navigation.filter(item => item.roles.length === 0 || user?.roles?.some(userRole => item.roles.includes(userRole.role))),
    [user],
  )

  if (!user) return null

  return (
    <div className={`${toggle ? 'flex md:w-64' : 'hidden md:flex'} h-full min-h-screen md:min-h-0 flex-col md:fixed md:inset-y-0 z-50`}>
      {/* Sidebar component, swap this element with another sidebar if you like */}
      <div className="flex flex-col flex-grow bg-teal-800 overflow-y-auto md:pt-5">
        <div className="hidden md:flex items-center shrink-0 px-4">
          <Link href="/transfer-credits" passHref className="h-14 w-full relative outline-offset-8">
            <img className={`object-fill h-full ${toggleClasses(toggle, 'block')}`} src="/logo-written.svg" alt="Logo" />
          </Link>
        </div>
        <div className="md:mt-5 flex-1 flex flex-col">
          <nav className="flex-1 flex flex-col gap-3">
            <div className="h-16 relative flex justify-between md:hidden gap-1 px-2 py-3 bg-gray-50">
              <button onClick={() => setSidebarToggle(false)} className="p-2 text-gray-400" aria-label="Close">
                <XMarkIcon width={20} />
              </button>
              <div className="flex gap-2">
                <div>
                  <LinkButton variant="primary" href="/transfer-credits">
                    <div className="flex items-center text-sm font-semibold whitespace-nowrap">Overview Channels</div>
                  </LinkButton>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-1 px-2">
              {filteredNavigationList?.map(nav => (
                <NavItem key={nav.target} navItem={nav} user={user} toggle={toggle} setSidebarToggle={setSidebarToggle} />
              ))}
            </div>
          </nav>

          <RoleComponent roles={[USER_ROLE]}>
            <a
              href={`mailto:${AppConfig.app.emailConfig.supportAddress}`}
              className="flex items-center gap-4 mt-2 py-5 px-4 border-y border-teal-700 font-medium text-teal-200"
            >
              <LifebuoyIcon className="h-6 w-6 text-teal-200" />
              <span className={toggleClasses(toggle, 'inline')}>Contact Support</span>
            </a>
          </RoleComponent>
          <span>
            <p className={`${toggleClasses(toggle, 'block')} font-medium text-base pb-1 text-white p-4`}>
              Operated by {AppConfig.app.companyName}
            </p>
            <p className={`${toggleClasses(toggle, 'block')} font-medium text-sm text-white p-4`}>Version {projectVersion}</p>
          </span>
        </div>
      </div>
    </div>
  )
}

const NavItem = ({
  navItem,
  user,
  toggle,
  setSidebarToggle,
}: {
  navItem: (typeof navigation)[number]
  user: UserResult
  toggle: boolean
  setSidebarToggle: Dispatch<SetStateAction<boolean>>
}) => {
  const router = useRouter()
  const isItemSelected = router.pathname.startsWith(navItem.target)
  const [isNavItemOpened, setNavItemOpened] = useState(isItemSelected)

  useEffect(() => {
    if (!toggle) {
      setNavItemOpened(false)
    }
  }, [toggle])

  const onNavItemClick = () => {
    setSidebarToggle(true)
    setNavItemOpened(prev => !prev)
  }

  if (!navItem.items) {
    return (
      <Link
        key={navItem.target}
        href={navItem.target}
        passHref
        className={classNames(
          isItemSelected ? 'bg-teal-900 text-white' : 'text-teal-100',
          'flex items-center gap-2 leading-5 text-sm font-medium p-2 rounded-md focus-within:bg-teal-900 focus-within:text-white hover:bg-teal-900 hover:text-white hover:font-extrabold',
        )}
      >
        <navItem.icon className="h-6 w-6" aria-hidden="true" />
        <span className={toggleClasses(toggle, 'inline')}>{navItem.text}</span>
      </Link>
    )
  }

  return (
    <div
      className={classNames(
        isItemSelected ? 'bg-teal-900 text-white' : 'text-teal-100',
        'leading-5 text-sm font-medium p-2 rounded-md focus-within:bg-teal-900 focus-within:text-white hover:bg-teal-900 hover:text-white',
      )}
    >
      <button className="w-full flex items-center justify-between outline-offset-8 leading-5 " onClick={onNavItemClick}>
        <div className="flex items-center gap-2">
          <navItem.icon className="h-6 w-6" aria-hidden="true" />
          <span className={toggleClasses(toggle, 'inline')}>{navItem.text}</span>
        </div>
        {!isNavItemOpened && <ChevronDownIcon width={20} aria-hidden="true" className={toggleClasses(toggle, 'block')}></ChevronDownIcon>}
        {isNavItemOpened && <ChevronUpIcon width={20} aria-hidden="true" className={toggleClasses(toggle, 'block')}></ChevronUpIcon>}
      </button>
      <ul className={`${isNavItemOpened && toggle ? 'block' : 'hidden'} mt-2`}>
        {navItem.items.map(subItem => {
          if (!user.roles.some(role => subItem.roles.includes(role.role))) return null

          const target = `${navItem.target}${subItem.subPath ?? ''}${subItem.filter ? `?${subItem.filter}` : ''}`
          return (
            <li key={target} className="py-2 hover:font-extrabold">
              <Link href={target} passHref className="flex items-center outline-offset-4">
                <div className="w-8">
                  {(router.asPath === target || (subItem.filter && router.asPath.includes(subItem.filter))) && (
                    <svg className="ml-2" height="8" width="8">
                      <circle cx="4" cy="4" r="4" fill="white" />
                    </svg>
                  )}
                </div>
                <div>{subItem.text}</div>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function toggleClasses(toggle: boolean, classNames: string) {
  return `${toggle ? classNames : `${classNames} md:sr-only`}`
}
