import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/solid'
import config from 'chains.config'

export const Filfox = ({ transfer_hash }) => (
  <div onClick={e => e.stopPropagation()}>
    <a
      className="flex text-violets-are-blue text-base leading-6 hover:underline z-10"
      href={`${config.chain.blockExplorerUrls[0]}/${transfer_hash}`}
      target="_blank"
      rel="noopener noreferrer"
    >
      {config.chain.blockExplorerName} <ArrowTopRightOnSquareIcon className="ml-1 h-6 w-6" />
    </a>
  </div>
)
