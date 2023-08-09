import { ChainBanner } from 'components/web3/ChainBanner'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

interface LayoutProps {
  children: React.ReactNode
  title: string
  containerClass?: string
  defaultPadding?: boolean
}

export const Layout = ({ children, title, containerClass = '', defaultPadding = true }: LayoutProps) => {
  const [sidebarToggle, setSidebarToggle] = useState(false)
  const { asPath } = useRouter()

  useEffect(() => {
    if (Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0) > 768) {
      setSidebarToggle(true)
    }
  }, [])

  useEffect(() => {
    if (Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0) <= 768) {
      setSidebarToggle(false)
    }
  }, [asPath, setSidebarToggle])

  return (
    <div>
      <Sidebar toggle={sidebarToggle} setSidebarToggle={setSidebarToggle} />
      <div
        className={`${
          sidebarToggle ? 'hidden md:block md:pl-64' : 'block pl-0 md:pl-14'
        } flex flex-col flex-1 overflow-x-hidden ${containerClass}`}
      >
        <ChainBanner />
        <Header title={title} setSidebarToggle={setSidebarToggle} />
        <main id="main">
          <div className={defaultPadding ? 'py-6' : 'pb-6'}>
            <div className="mx-auto px-4 sm:px-6 md:px-8">{children}</div>
          </div>
        </main>
      </div>
    </div>
  )
}
