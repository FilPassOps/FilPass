import NextErrorComponent from 'next/error'
import { NextPageContext } from 'next/types'

interface ErrorProps {
  statusCode: number
  hasGetInitialPropsRun: boolean
  err: Error & { digest?: string }
}

const MyError = (props: ErrorProps) => <NextErrorComponent statusCode={props.statusCode} />

MyError.getInitialProps = async (contextData: NextPageContext) => {
  // In case this is running in a serverless function, await this in order to give Sentry
  // time to send the error before the lambda exits
  console.log(`_error.js getInitialProps missing data at path: ${contextData.asPath}`)

  // This will contain the status code of the response
  return NextErrorComponent.getInitialProps(contextData)
}

export default MyError
