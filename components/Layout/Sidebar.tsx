/* eslint-disable @next/next/no-img-element */
import {
  BanknotesIcon,
  CircleStackIcon,
  DocumentTextIcon,
  HomeIcon,
  IdentificationIcon,
  LifebuoyIcon,
  ServerIcon,
  UserIcon,
  UsersIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/solid'

import { useAuth } from 'components/Authentication/Provider'
import { TokenPrice } from 'components/Controller/TokenPrice'
import { LinkButton } from 'components/Shared/Button'
import { RoleComponent } from 'components/Shared/RoleComponent'
import { AppConfig } from 'config'
import { ADDRESS_MANAGER_ROLE, APPROVER_ROLE, CONTROLLER_ROLE, SUPERADMIN_ROLE, USER_ROLE, VIEWER_ROLE } from 'domain/auth/constants'
import { ACTIVE_STATUS, ARCHIVED_STATUS } from 'domain/programs/constants'
import {
  APPROVED_STATUS,
  DRAFT_STATUS,
  PAID_STATUS,
  PROCESSING_STATUS,
  REJECTED_BY_CONTROLLER_STATUS,
  REJECTED_STATUS,
  REQUIRES_CHANGES_STATUS,
  SUBMITTED_STATUS,
  VOIDED_STATUS,
} from 'domain/transfer-request/constants'
import { UserResult } from 'domain/user'
import { classNames } from 'lib/class-names'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { BatchActionsButton } from 'pages/approvals'
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
    target: '/my-transfer-requests',
    text: 'My Requests',
    icon: HomeIcon,
    roles: [],
  },
  {
    target: '/transfer-credits',
    text: 'Transfer Credits',
    icon: CircleStackIcon,
    roles: [USER_ROLE],
    items: [
      {
        text: 'Overview',
        roles: [USER_ROLE],
      },
      {
        text: 'Buy Credits',
        roles: [USER_ROLE],
        subPath: '/buy',
      },
      {
        text: 'Transaction History',
        roles: [USER_ROLE],
        subPath: '/transaction-history',
      },
    ],
  },
  {
    target: '/approvals',
    text: 'My Approvals',
    icon: DocumentTextIcon,
    roles: [APPROVER_ROLE, VIEWER_ROLE],
    items: [
      {
        filter: `status=${SUBMITTED_STATUS}`,
        text: 'Pending You',
        roles: [APPROVER_ROLE],
      },
      {
        filter: `status=${PROCESSING_STATUS}`,
        text: 'Pending Others',
        roles: [APPROVER_ROLE],
      },
      {
        filter: `status=${APPROVED_STATUS}`,
        text: 'Approved',
        roles: [APPROVER_ROLE],
      },
      {
        filter: `status=${PAID_STATUS}`,
        text: 'Paid',
        roles: [APPROVER_ROLE, VIEWER_ROLE],
      },
      {
        filter: `status=${REQUIRES_CHANGES_STATUS}`,
        text: 'Requires Changes',
        roles: [APPROVER_ROLE],
      },
      {
        filter: `status=${REJECTED_STATUS}`,
        text: 'Rejected',
        roles: [APPROVER_ROLE],
      },
      {
        filter: `status=${VOIDED_STATUS}`,
        text: 'Voided',
        roles: [APPROVER_ROLE],
      },
      {
        filter: `status=${DRAFT_STATUS}`,
        text: 'Draft',
        roles: [APPROVER_ROLE],
      },
    ],
  },
  {
    target: '/disbursement',
    text: 'Disbursement',
    icon: BanknotesIcon,
    roles: [CONTROLLER_ROLE],
    items: [
      {
        filter: `status=${APPROVED_STATUS}&sort=createdAt&order=asc`,
        text: 'Approved',
        roles: [CONTROLLER_ROLE],
      },
      {
        filter: `status=${PAID_STATUS}&sort=updatedAt&order=desc`,
        text: 'Paid',
        roles: [CONTROLLER_ROLE],
      },
      {
        filter: `status=${REJECTED_BY_CONTROLLER_STATUS}&sort=createdAt&order=asc`,
        text: 'Rejected',
        roles: [CONTROLLER_ROLE],
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
    target: '/program-settings',
    text: 'Program Settings',
    icon: ServerIcon,
    roles: [SUPERADMIN_ROLE],
    items: [
      {
        filter: `status=${ACTIVE_STATUS}`,
        text: 'Active',
        roles: [SUPERADMIN_ROLE],
      },
      {
        filter: `status=${ARCHIVED_STATUS}`,
        text: 'Archived',
        roles: [SUPERADMIN_ROLE],
      },
    ],
  },
  {
    target: '/user-address',
    text: 'User Address',
    icon: IdentificationIcon,
    roles: [ADDRESS_MANAGER_ROLE],
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
          <Link href="/my-transfer-requests" passHref className="h-10 w-full relative outline-offset-8">
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
                <RoleComponent roles={[APPROVER_ROLE]}>
                  <div>
                    <BatchActionsButton />
                  </div>
                </RoleComponent>
                <div>
                  <LinkButton variant="primary" href="/transfer-requests/create">
                    <div className="flex items-center text-sm font-semibold whitespace-nowrap">Create New Request</div>
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
          <RoleComponent roles={[SUPERADMIN_ROLE, CONTROLLER_ROLE]}>
            <div className={`${toggle ? 'block p-3' : 'md:hidden'}`}>
              <TokenPrice />
            </div>
          </RoleComponent>
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
