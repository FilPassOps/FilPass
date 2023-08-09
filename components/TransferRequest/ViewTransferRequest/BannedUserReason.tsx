interface BannedUserReasonProps {
  bannedAuthor: string
}

export const BannedUserReason = ({ bannedAuthor }: BannedUserReasonProps) => {
  return (
    <div className="my-7 text-sm rounded-lg p-4 space-y-4 bg-light-red text-international-orange">
      <p className="font-bold">Banned account</p>
      <p>This is user was banned by: {bannedAuthor}</p>
    </div>
  )
}
