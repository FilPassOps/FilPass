/* eslint-disable @next/next/no-img-element */

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="m-auto min-h-screen flex flex-col justify-center py-12 max-w-md items-center space-y-12">
      <div className="flex gap-4 justify-center items-center">
        <img src="/logo-small.svg" alt="Logo" className="block sm:hidden" />
        <img src="/written-logo.svg" alt="Logo" className="block sm:hidden" />
      </div>
      <img src="/logo.svg" alt="Logo" width="80%" className="hidden sm:block" />
      {children}
    </div>
  )
}
