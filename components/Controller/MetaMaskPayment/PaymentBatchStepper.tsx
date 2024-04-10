interface PaymentBatchStepperProps {
  index: number
  status: 'Reviewing' | 'Pending' | 'Sent'
  handleOnClick: (index: number) => void
}

export const PaymentBatchStepper = ({ index, status, handleOnClick }: PaymentBatchStepperProps) => {
  const config = {
    Reviewing: { backgroud: 'bg-blue-600', text: 'text-blue-600' },
    Pending: { backgroud: 'bg-gray-300', text: 'text-gray-500' },
    Sent: { backgroud: 'bg-green-600', text: 'text-gray-500' },
  }
  return (
    <button className="flex flex-col text-xs w-24 flex-shrink-0" onClick={() => handleOnClick(index - 1)}>
      <div className={`h-1 w-full ${config[status].backgroud}`} />
      <div className="flex flex-col items-start">
        <p className={`font-semibold mt-4 ${config[status].text}`}>{`BATCH ${index}`}</p>
        <p className="font-medium text-gray-900">{status}</p>
      </div>
    </button>
  )
}
