import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { ReactNode, RefAttributes } from 'react'
import { twMerge } from 'tailwind-merge'

type TooltipProps = TooltipPrimitive.TooltipContentProps &
  RefAttributes<HTMLDivElement> & {
    children: ReactNode
    content: ReactNode
    showArrow?: boolean
  }

export function Tooltip({ children, content, className, showArrow = false, ...props }: TooltipProps) {
  if (!content) return children

  return (
    <TooltipPrimitive.Provider delayDuration={0}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Content
          side="top"
          align="center"
          className={twMerge('z-50 overflow-hidden rounded-md border px-3 py-1.5 text-sm text-gray-900 shadow-sm bg-white', className)}
          {...props}
        >
          {content}
          {showArrow && <TooltipPrimitive.Arrow width={11} height={5} />}
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  )
}
