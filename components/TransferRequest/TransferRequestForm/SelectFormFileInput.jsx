import { FormTooltip } from '../shared/FormTooltip'
import { AttachmentInput } from './AttachmentInput'

export const SelectFormFileInput = ({ isUSResident, setUserFileId, userFileId }) => {
  const type = isUSResident === 'Yes' ? 'W9_FORM' : 'W8_FORM'

  return (
    <AttachmentInput
      userAttachmentId={userFileId}
      setUserAttachmentId={setUserFileId}
      uploadingForOthers={false}
      setAsActive={false}
      type={type}
      disabled={isUSResident === null || isUSResident === undefined}
      label={
        <div className="flex items-center gap-1 text-sm leading-5 font-medium text-gray-700">
          <p>{formatLabel(isUSResident)}</p>
          {!!isUSResident && <FormTooltip type={type} />}
        </div>
      }
    />
  )
}
const formatLabel = isUSResident => {
  switch (isUSResident) {
    case 'Yes':
      return 'Form W9 (Max 3 MB)'
    case 'No':
      return 'Form W8 (Max 3 MB)'
    default:
      return 'Form W8/W9 (Max 3 MB)'
  }
}
