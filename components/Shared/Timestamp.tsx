import { DateTime } from 'luxon'
import React from 'react'

interface Props {
  date: string
  format: Intl.DateTimeFormatOptions
}

const Timestamp: React.FC<Props> = ({ date, format }: Props) => {
  return <span suppressHydrationWarning>{DateTime.fromISO(date).toLocaleString(format)}</span>
}

export default Timestamp
