export type ShortenLength = 'short' | 'very-short'

export const shortenAddress = (address: string, size: ShortenLength) => {
  const mapping = {
    short: 12,
    'very-short': 6,
  } as const

  return `${address.substring(0, mapping[size])}...${address.substring(address.length - mapping[size])}`.toLowerCase() as Lowercase<string>
}
