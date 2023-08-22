import { ExternalProvider } from '@ethersproject/providers'
import filecoinAddress from '@glif/filecoin-address'
import config from 'chains.config'
import { Layout } from 'components/Layout'
import { Button } from 'components/shared/Button'
import { CustomWindow, useMetaMask } from 'components/web3/MetaMaskProvider'
import { ethers } from 'ethers'
import { api } from 'lib/api'
import { useEffect, useState } from 'react'
import { PLATFORM_NAME } from 'system.config'
import { MultiForwarder, MultiForwarder__factory as MultiForwarderFactory } from 'typechain-types'
import { NextPageWithLayout } from './_app'

declare const window: CustomWindow

const Playground: NextPageWithLayout = () => {
  const { wallet, connect } = useMetaMask()
  const [provider, setProvider] = useState<ethers.providers.Web3Provider>()
  const [signer, setSigner] = useState<ethers.providers.JsonRpcSigner>()
  const [multiForwarder, setMultiForwarder] = useState<MultiForwarder>()

  const [amounts, setAmounts] = useState<string[]>(['0.01'])
  const [destinations, setDestinations] = useState<string[]>(['0xbE0395df351d895C4E3Da5741140B4C1f9882D0A'])
  const [msigWallet, setMsigWallet] = useState('f2hwuttfrzziinrniv57jlgov6mrimvron3ec66ya')
  const [msigSigner, setMsigSigner] = useState('t410f3oxy7m2e3hsx772imwne5nyyysakd7lcvtu67ba')
  const [hash, setHash] = useState<string>()

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

  const sendFIL = async () => {
    if (!multiForwarder || !signer || !provider || !destinations || !amounts) {
      return
    }

    try {
      const weiValues = amounts.map(amount => ethers.utils.parseEther(amount))
      const weiTotal = weiValues.reduce((a, b) => a.add(b), ethers.BigNumber.from(0))

      const addresses = destinations.map(destination => {
        let address = destination
        if (destination.startsWith('0x')) {
          address = filecoinAddress.delegatedFromEthAddress(destination, config.coinType)
        }
        return filecoinAddress.newFromString(address).bytes
      })

      const response = await multiForwarder.forwardAny('Forward All ID', addresses, weiValues, { value: weiTotal })
      setHash(response.hash)
    } catch (error) {
      console.error(error)
    }
  }

  const forward100 = async () => {
    if (!multiForwarder || !signer || !provider || !destinations || !amounts) {
      return
    }

    try {
      const value = ethers.utils.parseEther('0.01').toString()
      const total = ethers.utils.parseEther('1').toString()
      const t1Address = filecoinAddress.newFromString('t1d6udrjruc3iqhyhrd2rjnjkhzsa6gd6tb63oi6i').bytes
      const t2Address = filecoinAddress.newFromString('t2yusrm7oi4mpl2h6qfncg4f2pz5ymyftdpdfhywa').bytes
      const t4Address = filecoinAddress.newFromString('t410fqfq5marnwspuk4scmrovk7ppau2zzhy3hotesxq').bytes

      const t1Padded = new Uint8Array(32)
      t1Padded.set(t1Address)
      t1Padded.fill(0, t1Address.length, 32)

      const t2Padded = new Uint8Array(32)
      t2Padded.set(t2Address)
      t2Padded.fill(0, t2Address.length, 32)

      const t4Padded = new Uint8Array(32)
      t4Padded.set(t4Address)
      t4Padded.fill(0, t4Address.length, 32)

      const t1Addresses = Array.from({ length: 1 }, () => t1Padded)
      const t2Addresses = Array.from({ length: 1 }, () => t2Padded)
      const t4Addresses = Array.from({ length: 98 }, () => t4Padded)
      const values = Array.from({ length: 100 }, () => value)

      const response = await multiForwarder.forward('Forward Non BLS ID', [...t1Addresses, ...t2Addresses, ...t4Addresses], values, {
        value: total,
      })

      setHash(response.hash)
    } catch (error) {
      console.log(error)
    }
  }

  const forward50 = async () => {
    if (!multiForwarder || !signer || !provider || !destinations || !amounts) {
      return
    }

    try {
      const value = ethers.utils.parseEther('0.01').toString()
      const total = ethers.utils.parseEther('0.45').toString()
      const address = filecoinAddress.newFromString(
        't3vzc7naq3khx3bjkbelvce2yw4brl5bw4ejjhrcdoh63qma66elz26fxkmayl2qtvte7dzgod6qc3ou2j676a',
      ).bytes

      const addresses = Array.from({ length: 45 }, () => address)
      const values = Array.from({ length: 45 }, () => value)

      const response = await multiForwarder.forwardAny('Forward All ID', addresses, values, { value: total })
      setHash(response.hash)
    } catch (error) {
      console.log(error)
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

  const readEventLog = async () => {
    if (!provider || !multiForwarder) return

    const receipt = await provider.getTransactionReceipt('0xcf6ddaf9db364305e3f1f637774a563fc18459ce2b7ba29872ed33394b0269db')

    receipt.logs.forEach(log => {
      if (log.address !== multiForwarder.address) return
      const parsed = multiForwarder.interface.parseLog(log)
      console.log(parsed)
    })
  }

  return (
    <>
      <div className="w-full">
        <h1 className="font-bold text-lg">Web3 Playground</h1>
        {!wallet && <Button onClick={() => connect()}>Connect to MetaMask</Button>}
        {wallet && (
          <div>
            <div>Ethereum Address: {wallet}</div>
            <div>Filecoin Address: {filecoinAddress.delegatedFromEthAddress(wallet, config.coinType)}</div>
            <div className="mt-4 w-[600px] p-4 border border-black rounded-md flex flex-col gap-2">
              <p>Read event log</p>
              <button className="py-2 px-4 rounded-md text-white bg-indigo-600" onClick={() => readEventLog()}>
                Read
              </button>
            </div>
            <form
              className="mt-4 w-[600px] p-4 border border-black rounded-md flex flex-col gap-2"
              onSubmit={event => {
                event.preventDefault()
                sendFIL()
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
                Send FIL
              </button>
            </form>
            <div className="mt-4 w-[600px] p-4 border border-black rounded-md flex flex-col gap-2">
              <p>Send 100 requests of 0.1 FIL to Secp256k1, Actor and Delegated addresses</p>
              <button className="py-2 px-4 rounded-md text-white bg-indigo-600" onClick={() => forward100()}>
                Send 100 Requests
              </button>
            </div>
            <div className="mt-4 w-[600px] p-4 border border-black rounded-md flex flex-col gap-2">
              <p>Send 45 requests of 0.1 FIL to BLS addresses</p>
              <button className="py-2 px-4 rounded-md text-white bg-indigo-600" onClick={() => forward50()}>
                Send 45 Requests
              </button>
            </div>
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
                  href={`${config.chain.blockExplorerUrls[0]}/message/${hash}`}
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
  return <Layout title={`Playground - ${PLATFORM_NAME}`}>{page}</Layout>
}
