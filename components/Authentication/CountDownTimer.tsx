import React, { useEffect, useState } from 'react'

interface CountDownTimerProps {
  deadline: string
  className?: string
}

const CountDownTimer = ({ deadline, className }: CountDownTimerProps) => {
  const [hours, setHours] = useState(0)
  const [minutes, setMinutes] = useState(0)
  const [seconds, setSeconds] = useState(0)

  const leading0 = (num: number) => {
    return num < 10 ? '0' + num : num
  }

  const getTimeUntil = (deadline: string) => {
    const time = Date.parse(deadline) - Date.parse(new Date().toISOString())
    if (time < 0) {
      setHours(0)
      setMinutes(0)
      setSeconds(0)
    } else {
      setHours(Math.floor((time / (1000 * 60 * 60)) % 24))
      setMinutes(Math.floor((time / 1000 / 60) % 60))
      setSeconds(Math.floor((time / 1000) % 60))
    }
  }

  useEffect(() => {
    setInterval(() => getTimeUntil(deadline), 1000)

    return () => getTimeUntil(deadline)
  }, [deadline])

  return <div className={className}>{`${leading0(hours)}:${leading0(minutes)}:${leading0(seconds)}`}</div>
}

export default CountDownTimer
