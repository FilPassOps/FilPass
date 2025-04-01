import { Menu, Transition } from '@headlessui/react'
import { Bars3BottomLeftIcon } from '@heroicons/react/24/solid'
import { useAuth } from 'components/Authentication/Provider'
import { UserIcon } from 'components/Shared/icons/UserIcon'
import { api } from 'lib/api'
import { classNames } from 'lib/class-names'
import { useRouter } from 'next/router'
import { Dispatch, Fragment, SetStateAction } from 'react'

interface HeaderProps {
  title: string
  setSidebarToggle: Dispatch<SetStateAction<boolean>>
}

export const Header = ({ title, setSidebarToggle }: HeaderProps) => {
  const { user } = useAuth()
  const { push } = useRouter()

  const handleLogout = async () => {
    console.log('Logging out...');
    const res = await api.post('/auth/logout');
    console.log('Logout response:', res);
    if (res?.data?.success) {
      push('/')
    }
  }

  const userNavigation = [{ name: 'Sign out', onClick: handleLogout }]

  return (
    <div className="sticky top-0 z-40 shrink-0 flex h-16 bg-white shadow">
      <button
        type="button"
        className="px-4 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-green-700"
        onClick={() => setSidebarToggle(toggle => !toggle)}
      >
        <span className="sr-only">Open sidebar</span>
        <Bars3BottomLeftIcon className="h-6 w-6" aria-hidden="true" />
      </button>
      <div className="flex-1 flex justify-between px-4 md:px-8">
        <div className="flex-1 flex items-center text-base md:text-2xl font-bold text-deep-koamaru">{title}</div>
        <div className="ml-4 flex justify-end items-center">
          <Menu as="div" className="relative">
            <div>
              <Menu.Button className="max-w-xs bg-white flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-700">
                <span className="sr-only">Open user menu</span>
                <div className="h-8 w-8 rounded-full bg-green-800 flex items-center justify-center">
                  <UserIcon className="w-5 h-5" />
                </div>
                <span className="hidden md:block ml-2 text-sm text-deep-koamaru">{user?.email}</span>
              </Menu.Button>
            </div>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                {userNavigation.map(item => (
                  <Menu.Item key={item.name}>
                    {({ active }) => (
                      <a
                        onClick={item.onClick}
                        className={classNames(active ? 'bg-gray-100' : '', 'block px-4 py-2 text-sm text-gray-700 cursor-pointer')}
                      >
                        {item.name}
                      </a>
                    )}
                  </Menu.Item>
                ))}
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </div>
    </div>
  )
}
