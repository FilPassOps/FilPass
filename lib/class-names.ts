/**
 * @deprecated you can use tailwind-merge
 * @example import {twMerge} from 'tailwind-merge'
 */
export function classNames(...classes: any[]) {
  return classes.filter(Boolean).join(' ')
}
