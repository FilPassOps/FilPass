class TransactionError extends Error {
  status: any
  errors: any

  constructor(message: string, { status, errors }: { status: any; errors: any }) {
    super(message)
    this.status = status
    this.errors = errors
  }
}

module.exports = {
  TransactionError: TransactionError,
}
