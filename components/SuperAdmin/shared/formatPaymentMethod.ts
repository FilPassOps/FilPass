export const formatPaymentMethod = (request_unit_name?: string, payment_unit_name?: string) => {
  if (!request_unit_name && !payment_unit_name) {
    return '-'
  }

  if (!request_unit_name && payment_unit_name) {
    return payment_unit_name
  }

  return `Request in ${request_unit_name} and Pay in ${payment_unit_name}`
}
