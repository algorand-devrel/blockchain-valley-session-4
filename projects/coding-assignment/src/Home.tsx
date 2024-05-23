// src/components/Home.tsx
import { Config as AlgokitConfig } from '@algorandfoundation/algokit-utils'
import AlgorandClient from '@algorandfoundation/algokit-utils/types/algorand-client'
import { useWallet } from '@txnlab/use-wallet'
import algosdk from 'algosdk'
import React, { useEffect, useState } from 'react'
import ConnectWallet from './components/ConnectWallet'
import MethodCall from './components/MethodCall'
import { DigitalMarketplaceClient } from './contracts/DigitalMarketplace'
import * as methods from './methods'
import { getAlgodConfigFromViteEnvironment } from './utils/network/getAlgoClientConfigs'

interface HomeProps {}

const Home: React.FC<HomeProps> = () => {
  AlgokitConfig.configure({ populateAppCallResources: true })
  const [openWalletModal, setOpenWalletModal] = useState<boolean>(false)
  const [appId, setAppId] = useState<number>(0)
  const [assetId, setAssetId] = useState<bigint>(0n)
  const [unitaryPrice, setUnitaryPrice] = useState<bigint>(0n)
  const [quantity, setQuantity] = useState<bigint>(0n)
  const [unitsLeft, setUnitsLeft] = useState<bigint>(0n)
  const [seller, setSeller] = useState<string | undefined>(undefined)
  const { activeAddress, signer } = useWallet()

  useEffect(() => {
    dmClient
      .getGlobalState()
      .then((globalState) => {
        setUnitaryPrice(globalState.unitaryPrice?.asBigInt() || 0n)
        const id = globalState.assetId?.asBigInt() || 0n
        setAssetId(id)
        algorand.account.getAssetInformation(algosdk.getApplicationAddress(appId), id).then((info) => {
          setUnitsLeft(info.balance)
        })
      })
      .catch(() => {
        setUnitaryPrice(0n)
        setAssetId(0n)
        setUnitsLeft(0n)
      })

    algorand.client.algod
      .getApplicationByID(appId)
      .do()
      .then((response) => {
        setSeller(response.params.creator)
      })
      .catch(() => {
        setSeller(undefined)
      })
  }, [appId])

  const algodConfig = getAlgodConfigFromViteEnvironment()
  const algorand = AlgorandClient.fromConfig({ algodConfig })
  algorand.setDefaultSigner(signer)

  /*
  문제 1
  디지털 마켓플레이스 앱 클라이언트 인스턴스를 생성하세요.

  앱 클라이언트는 쉽고 간편하게 스마트계약을 배포 및 호출할 수 있도록 해주는 클라이언트입니다.
  앱 클라이언트 인스턴스를 만드는 방법은 두가지가 있습니다.
  1. resolve by creator and name: 배포자와 앱 이름으로 앱 클라이언트를 찾아서 생성
  2. resolve by id: 앱 ID로 앱 클라이언트를 찾아서 생성

  둘 다 사용 가능하지만 각각 장단점이 있어요.
  creator and name
  - 장점: 앱 이름과 배포자만 알면 앱 아이디를 하드코드할 필요가 없고 개발 중 여러 네트워크에서 자동적으로 앱 아이디를 찾아주기 때문에 편리합니다.
  - 단점: indexer가 필요하기 때문에 indexer API 설정을 해야합니다.

  id
  - 장점: indexer가 필요없어서 가볍게 앱 클라이언트를 생성할 수 있습니다.
  - 단점: 앱 아이디를 알아야하기 때문에 네트워크가 바뀔때 코드를 바꿔줘야할 수 있습니다.

  주목!!!
  - 이 파일 맨 위에 이 코드를 복붙해 마켓플레이스 앱 클라이언트 class를 import하세요: import { DigitalMarketplaceClient } from './contracts/DigitalMarketplace'
  - 여기서는 resolve by id를 사용해주세요!
  - sender값에는 { addr: activeAddress!, signer }를 복붙해주세요. useWallet를 통해 현재 연결된 지갑 주소와 서명자를 사용하는 코드입니다.
  - 앱 클라이언트 인스턴스 만들때 두번째 전달값인 algod는 algorand client 안에 있습니다. 라인 43 참고.

  힌트: https://github.com/algorandfoundation/algokit-client-generator-ts/blob/main/docs/usage.md#creating-an-application-client-instance
  */

  // 문제 1 시작
  const dmClient = new DigitalMarketplaceClient(
    {
      resolveBy: 'id',
      id: appId,
      sender: { addr: activeAddress!, signer },
      name: 'AlternativeName',
    },
    algorand.client.algod,
  )

  // 문제 1 끝

  const toggleWalletModal = () => {
    setOpenWalletModal(!openWalletModal)
  }

  return (
    <div className="hero min-h-screen bg-teal-400">
      <div className="hero-content text-center rounded-lg p-6 max-w-md bg-white mx-auto">
        <div className="max-w-md">
          <h1 className="text-4xl">
            Blockchain Valley <div className="font-bold">Digital Marketplace</div>
          </h1>
          <p className="py-6">
            팔고 싶은 물건이나 아이디어, 자산이 있나요? <br /> 무엇이든 토큰화해 이 마켓플레이스에서 판매하세요!
          </p>

          <div className="grid">
            <button data-test-id="connect-wallet" className="btn m-2" onClick={toggleWalletModal}>
              Wallet Connection
            </button>

            <div className="divider" />

            <label className="label">App ID</label>
            <input
              type="number"
              className="input input-bordered m-2"
              value={appId}
              onChange={(e) => setAppId(e.currentTarget.valueAsNumber || 0)}
            />

            <div className="divider" />

            {activeAddress && appId === 0 && (
              <div>
                <label className="label">Unitary Price</label>
                <input
                  type="number"
                  className="input input-bordered"
                  value={(unitaryPrice / BigInt(10e6)).toString()}
                  onChange={(e) => setUnitaryPrice(BigInt(e.currentTarget.value || '0') * BigInt(10e6))}
                />
                <MethodCall
                  methodFunction={methods.create(algorand, dmClient, activeAddress, unitaryPrice, 10n, 0n, setAppId)}
                  text="Create Marketplace"
                />
              </div>
            )}

            {appId !== 0 && (
              <div>
                <label className="label">Asset ID</label>
                <input type="text" className="input input-bordered" value={assetId.toString()} readOnly />
                <label className="label">Units Left</label>
                <input type="text" className="input input-bordered" value={unitsLeft.toString()} readOnly />
              </div>
            )}

            <div className="divider" />

            {activeAddress && appId !== 0 && unitsLeft !== 0n && (
              <div>
                <label className="label">Price Per Unit</label>
                <input type="text" className="input input-bordered" value={(unitaryPrice / BigInt(10e6)).toString()} readOnly />
                <label className="label">Desired Quantity</label>
                <input
                  type="number"
                  className="input input-bordered"
                  value={quantity.toString()}
                  onChange={(e) => setQuantity(BigInt(e.currentTarget.value || 0))}
                />
                <MethodCall
                  methodFunction={methods.buy(
                    algorand,
                    dmClient,
                    activeAddress,
                    algosdk.getApplicationAddress(appId),
                    quantity,
                    unitaryPrice,
                    setUnitsLeft,
                  )}
                  text={`Buy ${quantity} unit for ${(unitaryPrice * BigInt(quantity)) / BigInt(10e6)} ALGO`}
                />
              </div>
            )}

            {activeAddress !== seller && appId !== 0 && unitsLeft === 0n && (
              <button className="btn btn-disabled m-2" disabled={true}>
                SOLD OUT!
              </button>
            )}

            {activeAddress === seller && appId !== 0 && unitsLeft === 0n && (
              <MethodCall methodFunction={methods.deleteApp(dmClient, setAppId)} text="Delete App" />
            )}
          </div>

          <ConnectWallet openModal={openWalletModal} closeModal={toggleWalletModal} />
        </div>
      </div>
    </div>
  )
}

export default Home
