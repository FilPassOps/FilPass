import { ExternalProvider } from '@ethersproject/providers'
import filecoinAddress from '@glif/filecoin-address'
import config from 'chains.config'
import { Layout } from 'components/Layout'
import { Button } from 'components/shared/Button'
import { CustomWindow, useMetaMask } from 'components/web3/MetaMaskProvider'
import { useContract } from 'components/web3/useContract'
import { ethers } from 'ethers'
import { api } from 'lib/api'
import Head from 'next/head'
import { useEffect, useState } from 'react'
import { PLATFORM_NAME } from 'system.config'
import { MultiForwarder, MultiForwarder__factory as MultiForwarderFactory } from 'typechain-types'
import { NextPageWithLayout } from './_app'

declare const window: CustomWindow

const Playground: NextPageWithLayout = () => {
  const { wallet, connect } = useMetaMask()
  const [provider, setProvider] = useState<ethers.providers.Web3Provider>()
  const [signer, setSigner] = useState<ethers.providers.JsonRpcSigner>()
  const { forwardAll } = useContract('Filecoin')

  const [amounts, setAmounts] = useState<string[]>(['0.01'])
  const [destinations, setDestinations] = useState<string[]>(['0x8161d6022Db49f457242645D557dEf05359c9F1B'])
  const [msigWallet, setMsigWallet] = useState('f2hwuttfrzziinrniv57jlgov6mrimvron3ec66ya')
  const [msigSigner, setMsigSigner] = useState('t410f3oxy7m2e3hsx772imwne5nyyysakd7lcvtu67ba')
  const [hash, setHash] = useState<string>()
  const [multiForwarder, setMultiForwarder] = useState<MultiForwarder>()

  useEffect(() => {
    const provider = new ethers.providers.Web3Provider(window.ethereum as ExternalProvider)
    const signer = provider.getSigner()
    const multiForwarder = MultiForwarderFactory.connect(config.multiforwarder, signer)

    setSigner(signer)
    setProvider(provider)
    setMultiForwarder(multiForwarder)

    return () => {
      multiForwarder.removeAllListeners()
    }
  }, [])

  const send = async () => {
    if (!signer || !provider || !destinations || !amounts) {
      return
    }

    try {
      const response = await forwardAll('Forward All ID', destinations, amounts)
      setHash(response.hash)
    } catch (error) {
      console.error(error)
    }
  }

  const handleCreateMsigWallet = async () => {
    const { data } = await api.post('/wallets/create-msig')
    setHash(data)
  }

  const handleAddSigner = async () => {
    const { data } = await api.post('/wallets/add-msig-signer', {
      msigAddress: msigWallet,
      signerAddress: msigSigner,
    })
    setHash(data)
  }

  const readLogs = async () => {
    if (!signer || !provider || !multiForwarder) {
      return
    }
    const receipt = await provider.getTransactionReceipt('0x7625d7998514c9d099ebb1179fa80e1e592d996201c9570dfb36cd37ac8b3f05')

    receipt.logs.forEach(log => {
      if (log.address !== config.multiforwarder) {
        return
      }
      const parsedLog = multiForwarder.interface.parseLog(log)
      console.log(parsedLog)
    })
  }

  return (
    <>
      <Head>
        <title>Playground - {PLATFORM_NAME}</title>
      </Head>
      <div className="w-full">
        <h1 className="font-bold text-lg">Web3 Playground</h1>
        {!wallet && <Button onClick={() => connect()}>Connect to MetaMask</Button>}
        {wallet && (
          <div>
            <div>Ethereum Address: {wallet}</div>
            <div>Filecoin Address: {filecoinAddress.delegatedFromEthAddress(wallet, config.coinType)}</div>
            <div className="mt-4 w-[600px] p-4 border border-black rounded-md flex flex-col gap-2">
              <p>Read Logs</p>
              <button className="py-2 px-4 rounded-md text-white bg-indigo-600" onClick={() => readLogs()}>
                Read Logs
              </button>
            </div>
            <form
              className="mt-4 w-[600px] p-4 border border-black rounded-md flex flex-col gap-2"
              onSubmit={event => {
                event.preventDefault()
                send()
              }}
            >
              <div className="flex flex-col gap-6">
                {destinations.map((value, index) => (
                  <div className="flex flex-col gap-2" key={value}>
                    <div className="flex gap-2 items-center justify-between">
                      <label className="w-1/3" htmlFor="destination">
                        Destination
                      </label>
                      <input
                        className="w-2/3"
                        type="text"
                        id="destination"
                        name="destination"
                        value={destinations[index]}
                        onChange={e =>
                          setDestinations(current => {
                            const newDestination = [...current]
                            newDestination[index] = e.target.value
                            return newDestination
                          })
                        }
                      />
                    </div>
                    <div className="flex gap-2 items-center justify-between">
                      <label className="w-1/3" htmlFor="amount">
                        Amount
                      </label>
                      <input
                        className="w-2/3"
                        type="text"
                        id="amount"
                        name="amount"
                        value={amounts[index]}
                        onChange={e =>
                          setAmounts(current => {
                            const newAmount = [...current]
                            newAmount[index] = e.target.value
                            return newAmount
                          })
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
              <button type="submit" className="py-2 px-4 rounded-md text-white bg-indigo-600">
                Send
              </button>
            </form>
            <div className="mt-4 w-[600px] p-4 border border-black rounded-md flex flex-col gap-2">
              <p>Create Msig Wallet</p>
              <button className="py-2 px-4 rounded-md text-white bg-indigo-600" onClick={() => handleCreateMsigWallet()}>
                Create
              </button>
            </div>
            <form
              className="mt-4 w-[600px] p-4 border border-black rounded-md flex flex-col gap-2"
              onSubmit={event => {
                event.preventDefault()
                handleAddSigner()
              }}
            >
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2 items-center justify-between">
                    <label className="w-1/3" htmlFor="msigWallet">
                      Msig Wallet
                    </label>
                    <input
                      className="w-2/3"
                      type="text"
                      id="msigWallet"
                      name="msigWallet"
                      value={msigWallet}
                      onChange={e => setMsigWallet(e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex gap-2 items-center justify-between">
                    <label className="w-1/3" htmlFor="msigSigner">
                      New Signer
                    </label>
                    <input
                      className="w-2/3"
                      type="text"
                      id="msigSigner"
                      name="msigSigner"
                      value={msigSigner}
                      onChange={e => setMsigSigner(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>
              <button type="submit" className="py-2 px-4 rounded-md text-white bg-indigo-600">
                Add Signer
              </button>
            </form>
            {hash && (
              <div className="mt-6">
                Transaction Hash:{' '}
                <a
                  href={`${config.chain.blockExplorerUrls[0]}/tx/${hash}`}
                  rel="noreferrer"
                  target="_blank"
                  className="underline text-indigo-600"
                >
                  {hash}
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}

export default Playground

Playground.getLayout = function getLayout(page) {
  return <Layout title="Playground">{page}</Layout>
}
