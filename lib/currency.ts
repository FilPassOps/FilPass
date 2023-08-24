export function formatCurrency(value: any | bigint, locale = 'en') {
  return Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'USD',
  }).format(value)
}

export function formatCrypto(value: any, locale = 'en') {
  return Intl.NumberFormat(locale, {
    style: 'decimal',
  }).format(value)
}
