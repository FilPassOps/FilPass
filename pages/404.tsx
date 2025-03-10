import { FaceFrownIcon } from '@heroicons/react/24/outline'
import { LinkButton } from 'components/Shared/Button'
import { AppConfig } from 'config'
import Head from 'next/head'

export default function NotFoundPage() {
  return (
    <>
      <Head>
        <title key="not-found">{`Not Found - ${AppConfig.app.name}`}</title>
      </Head>
      <div className="h-screen flex flex-col justify-center items-center py-16">
        <FaceFrownIcon className="w-14 h-14 text-gray-500 mb-3" />
        <h1 className="text-gray-500 text-3xl font-bold mb-3">404 NOT FOUND</h1>
        <p className="text-base font-normal text-gray-500 mb-9">We could not find the page you are looking for</p>
        <div className="w-44">
          <LinkButton variant="outline" href="/transfer-credits">
            Go Back
          </LinkButton>
        </div>
      </div>
    </>
  )
}
