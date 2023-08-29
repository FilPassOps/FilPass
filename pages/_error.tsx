import NextErrorComponent from 'next/error'
import { NextPageContext } from 'next/types'

interface ErrorProps {
  statusCode: number
  hasGetInitialPropsRun: boolean
  err: Error & { digest?: string }
}

const MyError = (props: ErrorProps) => <NextErrorComponent statusCode={props.statusCode} />

MyError.getInitialProps = async (contextData: NextPageContext) => {
  const errorInitialProps = await NextErrorComponent.getInitialProps(contextData)

  const { res, err, asPath } = contextData

  if (res?.statusCode === 404) {
    return errorInitialProps
  }

  if (err) {
    return errorInitialProps
  }

  // In case this is running in a serverless function, await this in order to give Sentry
  // time to send the error before the lambda exits
  console.log(`_error.js getInitialProps missing data at path: ${asPath}`)

  // This will contain the status code of the response
  return NextErrorComponent.getInitialProps(contextData)
}

export default MyError
