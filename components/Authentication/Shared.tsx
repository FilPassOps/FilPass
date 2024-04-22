/* eslint-disable @next/next/no-img-element */

import Image from 'next/image'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 space-y-12 mx-auto max-w-md">
      <div className="relative w-full flex-1 max-h-[20rem] min-h-[5rem] flex justify-center items-center">
        <Image src="/logo-written-dark.svg" alt="Logo" fill className="object-contain" />
      </div>
      {children}
    </div>
  )
}
