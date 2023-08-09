export function formatCurrency(value, locale = 'en') {
  return Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'USD',
  }).format(value)
}

export function formatCrypto(value, locale = 'en') {
  return Intl.NumberFormat(locale, {
    style: 'decimal',
  }).format(value)
}
