import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/solid'

export const Filfox = ({ blockExplorerName, blockExplorerUrl, transactionHash }) => (
  <div onClick={e => e.stopPropagation()}>
    <a
      className="flex text-violets-are-blue text-base leading-6 hover:underline z-10"
      href={`${blockExplorerUrl}/${transactionHash}`}
      target="_blank"
      rel="noopener noreferrer"
    >
      {blockExplorerName} <ArrowTopRightOnSquareIcon className="ml-1 h-6 w-6" />
    </a>
  </div>
)
