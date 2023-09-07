import { stringify } from 'csv-stringify/sync'
import JsFileDownload from 'js-file-download'

const csvTemplate = stringify(
  [['Email', 'Name', 'Wallet Address', 'Amount', 'Vesting Start Epoch', 'Vesting Months', 'Should Receiver Review']],
  {
    delimiter: ',',
  }
)

export const handleDownloadCSVTemplate = () => {
  const blob = new Blob([csvTemplate])
  JsFileDownload(blob, 'Batch-transfer-request-template.csv')
}
