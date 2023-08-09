import { captureEvent } from '@sentry/nextjs'

export const captureJobEvent = async (transferRequestId: number, message: string, error: any) => {
  captureEvent({
    message,
    contexts: {
      transferRequest: {
        id: transferRequestId,
      },
    },
    level: 'warning',
    exception: error,
  })
}
