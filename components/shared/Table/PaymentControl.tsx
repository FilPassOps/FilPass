import { classNames } from 'lib/class-names'

interface PaymentControlProps {
  applyer?: string
  receiver: string
}

const PaymentControl = ({ applyer, receiver }: PaymentControlProps) => {
  const renderApplyer = applyer && applyer !== receiver

  return (
    <div className="text-sm text-deep-koamaru">
      <div className={classNames(renderApplyer && 'mb-2', 'truncate w-0 min-w-full')}>
        <span className="text-xs p-1 leading-none bg-soap text-rhythm font-medium mr-1">Receiver</span>
        <span className="block break-all whitespace-normal 2xl:inline 2xl:truncate">{receiver}</span>
      </div>
      {renderApplyer && (
        <div className="truncate w-0 min-w-full">
          <span className="text-xs p-1 leading-none bg-rhythm text-anti-flash-white font-medium mr-1">Requestor</span>
          <span className="block break-all whitespace-normal 2xl:inline 2xl:truncate">{applyer}</span>
        </div>
      )}
    </div>
  )
}

export default PaymentControl
