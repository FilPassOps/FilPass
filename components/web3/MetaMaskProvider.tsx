import MetaMaskOnboarding from '@metamask/onboarding'
import { Tooltip } from 'components/Layout/Tooltip'
import { Button, ButtonProps } from 'components/shared/Button'
import { useRouter } from 'next/router'
import { Dispatch, MouseEventHandler, ReactNode, SetStateAction, createContext, useContext, useEffect, useRef, useState } from 'react'
import { getMetamaskParam } from 'system.config'
import { twMerge } from 'tailwind-merge'

interface ProviderMessage {
  type: string
  data: unknown
}

type Events = 'accountsChanged' | 'chainChanged' | 'message'

type Methods =
  | 'eth_requestAccounts'
  | 'eth_chainId'
  | 'wallet_switchEthereumChain'
  | 'wallet_addEthereumChain'
  | 'eth_accounts'
  | 'personal_sign'
  | 'Filecoin.MsigCreate'
  | 'Filecoin.Version'

//prettier-ignore
type EventListener<T> =
  T extends 'accountsChanged' ? (accounts: Array<string>) => void
  : T extends 'chainChanged'? (chainId: string) => void
  : T extends 'message' ? (message: ProviderMessage) => void
  : never

//prettier-ignore
type RequestHandler<T> =
T extends 'eth_requestAccounts' ? Array<string>
: T extends 'eth_chainId' ? string
: T extends 'wallet_switchEthereumChain' ? null
: T extends 'wallet_addEthereumChain' ? null
: T extends 'eth_accounts' ? Array<string>
: T extends 'personal_sign' ? string
: unknown

interface Ethereum {
  request: <T extends Methods>(request: { method: T; params?: Array<unknown> }) => Promise<RequestHandler<T>>
  removeListener: <T extends Events>(event: T, handler: EventListener<T>) => void
  on: <T extends Events>(event: T, handler: EventListener<T>) => void
}

export interface CustomWindow extends Window {
  ethereum: Ethereum
}

declare const window: CustomWindow

interface WalletContext {
  wallet?: string
  chainId?: string
  busy: boolean
  connect: () => void
  switchChain: (chainId: string) => void
  setBusy: Dispatch<SetStateAction<boolean>>
}

export const WalletContext = createContext<WalletContext>({
  connect: () => {
    throw new Error('No wallet provider')
  },
  switchChain: () => {
    throw new Error('No wallet provider')
  },
  setBusy: () => {
    throw new Error('No wallet provider')
  },
  wallet: undefined,
  chainId: undefined,
  busy: false,
})

export const MetaMaskProvider = ({ children }: { children: ReactNode | undefined }) => {
  const onboarding = useRef<MetaMaskOnboarding>()
  const [wallet, setWallet] = useState<string>()
  const [chainId, setChainId] = useState<string>()
  const [busy, setBusy] = useState(false)
  const { asPath } = useRouter()

  const handleNewAccounts = async ([wallet]: Array<string>) => {
    setWallet(wallet)
  }

  useEffect(() => {
    if (!onboarding.current) {
      onboarding.current = new MetaMaskOnboarding()
    }
  }, [])

  useEffect(() => {
    const beforeUnloadListener = (event: BeforeUnloadEvent) => {
      if (!busy) return

      event.preventDefault()
      return (event.returnValue = '')
    }

    addEventListener('beforeunload', beforeUnloadListener, { capture: true })

    return () => {
      removeEventListener('beforeunload', beforeUnloadListener, {
        capture: true,
      })
    }
  }, [busy])

  useEffect(() => {
    if (MetaMaskOnboarding.isMetaMaskInstalled()) {
      const onChainChanged = (chainId: string) => {
        setChainId(chainId)
        if (asPath.includes('/disbursement')) {
          window.location.reload()
        }
      }
      window.ethereum.on('chainChanged', onChainChanged)

      return () => {
        window.ethereum.removeListener('chainChanged', onChainChanged)
      }
    }
  }, [asPath])

  useEffect(() => {
    if (MetaMaskOnboarding.isMetaMaskInstalled()) {
      window.ethereum.request({ method: 'eth_chainId' }).then(setChainId)
      window.ethereum.request({ method: 'eth_accounts' }).then(handleNewAccounts)
      window.ethereum.on('accountsChanged', handleNewAccounts)
      return () => {
        window.ethereum.removeListener('accountsChanged', handleNewAccounts)
      }
    }
  }, [])

  const connect = () => {
    setBusy(true)
    if (MetaMaskOnboarding.isMetaMaskInstalled()) {
      window.ethereum
        .request({ method: 'eth_requestAccounts' })
        .then(handleNewAccounts)
        .finally(() => {
          setBusy(false)
        })
      window.ethereum.request({ method: 'eth_chainId' }).then(setChainId)
    } else {
      onboarding.current?.startOnboarding()
      setBusy(false)
    }
  }

  const switchChain = async (chainId: string) => {
    try {
      setBusy(true)
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId }],
      })
    } catch (switchError: any) {
      console.log(switchError)
      // This error code indicates that the chain has not been added to MetaMask.
      if (switchError?.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [getMetamaskParam(chainId)],
          })
        } catch (addError) {
          console.error(addError)
          // handle "add" error
        } finally {
          setBusy(false)
        }
      }
      // handle other "switch" errors
    } finally {
      setBusy(false)
    }
  }

  return <WalletContext.Provider value={{ wallet, chainId, busy, connect, switchChain, setBusy }}>{children}</WalletContext.Provider>
}

export const useMetaMask = () => useContext(WalletContext)

interface WithMetaMaskButtonProps extends Omit<ButtonProps, 'loading' | 'disabled'> {
  connectWalletLabel?: ReactNode
  switchChainLabel?: string
  defaultLabel?: string
  targetChainId?: string
  onBeforeClick?: () => void
}

export const WithMetaMaskButton: React.FC<React.PropsWithChildren<WithMetaMaskButtonProps>> = props => {
  const {
    onClick,
    onBeforeClick,
    connectWalletLabel = 'Connect MetaMask',
    switchChainLabel = 'Switch network',
    targetChainId = props.targetChainId,
    className,
    ...rest
  } = props
  const { wallet, connect, switchChain, busy, chainId: connectedChainId } = useMetaMask()
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLButtonElement>(null)

  const connectedToTargetChain = wallet && connectedChainId === targetChainId

  useEffect(() => {
    if (!busy) {
      setLoading(false)
    }
  }, [busy])

  const handleClick: MouseEventHandler<HTMLButtonElement> = event => {
    setLoading(event.currentTarget === ref.current)
    try {
      if (onBeforeClick) {
        onBeforeClick()
      }
      if (wallet && connectedToTargetChain) {
        onClick?.(event)
      } else if (wallet && targetChainId && !connectedToTargetChain) {
        switchChain(targetChainId)
      } else {
        connect()
      }
    } catch (error: any) {
      console.error(error?.message)
    }
  }

  const buttonLabel = () => {
    if (wallet && connectedToTargetChain) {
      return props.children || props.defaultLabel || 'Continue with MetaMask'
    } else if (wallet && targetChainId && !connectedToTargetChain) {
      return switchChainLabel
    } else {
      return connectWalletLabel
    }
  }

  return (
    <Tooltip content="Select a network to continue">
      <Button
        {...rest}
        ref={ref}
        className={twMerge('flex items-center', className)}
        loading={busy && loading}
        disabled={busy || !props.targetChainId}
        onClick={handleClick}
      >
        {buttonLabel()}
      </Button>
    </Tooltip>
  )
}
