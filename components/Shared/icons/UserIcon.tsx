interface UserIconProps {
  className?: string
}

export function UserIcon({ className }: UserIconProps) {
  return (
    <svg width="1em" height="1em" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path
        d="M14 7.598a3.987 3.987 0 0 0-1.171-2.828A3.988 3.988 0 0 0 10 3.598 3.988 3.988 0 0 0 7.171 4.77 3.987 3.987 0 0 0 6 7.598c0 1.104.448 2.104 1.171 2.828A3.988 3.988 0 0 0 10 11.598a3.988 3.988 0 0 0 2.829-1.172A3.987 3.987 0 0 0 14 7.598ZM5.2 15.598c0 .8 1.8 1.6 4.8 1.6 2.814 0 4.8-.8 4.8-1.6 0-1.6-1.884-3.2-4.8-3.2-3 0-4.8 1.6-4.8 3.2Z"
        fill="#fff"
      />
    </svg>
  )
}
