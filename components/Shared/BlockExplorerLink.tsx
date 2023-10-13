import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/solid'

interface Props {
  blockExplorerUrl: string
  blockExplorerName: string
  transactionHash: string
}

export const BlockExplorerLink = ({ blockExplorerName, blockExplorerUrl, transactionHash }: Props) => (
  <a
    className="flex text-violets-are-blue text-base leading-6 hover:underline z-10"
    href={`${blockExplorerUrl}/${transactionHash}`}
    target="_blank"
    rel="noopener noreferrer"
    onClick={e => e.stopPropagation()}
  >
    {blockExplorerName} <ArrowTopRightOnSquareIcon className="ml-1 h-6 w-6" />
  </a>
)
