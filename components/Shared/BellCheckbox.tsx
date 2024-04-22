import { BellIcon } from '@heroicons/react/24/outline'
import { useEffect, useState } from 'react'

interface BellCheckboxProps {
  checked?: boolean
  onClick?: (e: any) => void
}

export const BellCheckbox = ({ checked, onClick = () => {} }: BellCheckboxProps) => {
  const [isChecked, setIsChecked] = useState(checked)

  useEffect(() => {
    if (typeof checked !== 'undefined' && checked !== isChecked) {
      setIsChecked(checked)
    }
  }, [checked, isChecked])

  const handleClick = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation()
    setIsChecked(!isChecked)
    onClick({ ...e, target: { ...e.target, checked: !isChecked } })
  }

  return (
    <button onClick={handleClick}>
      {isChecked && <BellIcon className="w-6 text-teal-800" fill="rgba(5, 150, 140, 1)" />}
      {!isChecked && <BellIcon className="w-6 text-gray-400" />}
    </button>
  )
}
