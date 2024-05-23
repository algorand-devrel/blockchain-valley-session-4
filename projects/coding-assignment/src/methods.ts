import * as algokit from '@algorandfoundation/algokit-utils'
import { DigitalMarketplaceClient } from './contracts/DigitalMarketplace'

/*
=== 먼저 읽고 진행해주세요!! ===
methods.ts 파일은 디지털 마켓플레이스 앱을 생성하고 호출하는 여러 메서드들을 정의하는 파일입니다.
이 파일에는 3개의 함수가 정의되어 있습니다.
1. create
2. buy
3. deleteApp

Home.tsx 파일을 보면 상황에 따라 각 메서드들을 MethodCall.tsx 컴포넌트에 전달해 호출하고 있습니다.
또한 Home.tsx에서 여러분들이 만든 dmClient가 디지털 마켓플레이스의 앱 클라이언트고 이 파일에 있는 3개의
함수들의 전달값으로 사용되고 있습니다.

시작하기 전 Home.tsx 라인 16을 보시면 아래 코드가 있습니다.
- AlgokitConfig.configure({ populateAppCallResources: true })

이 코드 하나로 모든 앱 호출시 필요한 레퍼런스들을 자동으로 기입해주는 기능을 활성화 할 수 있습니다.
즉, 수동적으로 populateAppResources를 설정할 필요가 없습니다! (이거 직접 하게 만들려다가 참았어요 ^^)

이 파일에는 문제 2부터 5까지 총 4문제가 있습니다. 아래 설명들을 자세히 읽고 문제를 풀어주세요!
*/

/**
 * Create the application and opt it into the desired asset
 */
export function create(
  algorand: algokit.AlgorandClient,
  dmClient: DigitalMarketplaceClient,
  sender: string,
  unitaryPrice: bigint,
  quantity: bigint,
  assetBeingSold: bigint,
  setAppId: (id: number) => void,
) {
  return async () => {
    let assetId = assetBeingSold

    if (assetId === 0n) {
      const assetCreate = await algorand.send.assetCreate({
        sender,
        total: quantity,
      })

      assetId = BigInt(assetCreate.confirmation.assetIndex!)
    }

    /*
    문제 2
    문제1에서 생성한 dmClient를 사용하여 앱을 배포하세요.

    이때 `deploy`가 아닌 `create` 메서드를 사용해서 배포하세요.
    `deploy`는 스마트계약이 이미 배포 되있는지 확인하고 배포 되어 있다면 다시 배포하지 않습니다. 과제를 풀때 항상 새로
    배포하는게 편하기 때문에 스크립트가 실행될때마다 배포하는 `create` 메서드를 사용해주세요.

    또한 디지털 마켓플레이스에 create 메서드를 따로 구현하지 않았기 때문에 기본적으로 제공되늗 bare create 메서드를 사용합니다.

    힌트: https://github.com/algorandfoundation/algokit-client-generator-ts/blob/main/docs/usage.md#create-calls
    */

    // 문제 2 시작
    const createResult = await dmClient.create.bare()
    // 문제 2 끝

    /*
    문제 3
    부트스트랩 메서드는 앱이 필요한 미니멈 밸런스를 지급하고 앱이 판매할 NFT 에셋에 옵트인하는 메서드입니다.
    앱이 판매할 준비가 되도록 Bootstrap 메서드를 호출하세요.

    부트스트랩 메서드는 호출 시 판매할 NFT에 옵트인하는 inner transaction이 있습니다.
    따라서 부트스트랩 메서드 호출자가 inner transaction의 트랜잭션 비용을 내야합니다.
    이 부분은 mbrTxn안에 extraFee를 통해서 설정을 해주면 됩니다. 이때 extraFee는 AlgoAmount 데이터타입을 받습니다!!
    extra fee 비용은 0.001 Algos입니다.

    부트스트랩 메서드의 전달값을 확인할려면 digital-marketplace-contract 프로젝트 폴더 안에
    smart_contracts/digital_marketplace/contract.py 파일을 확인해주세요.

    힌트1: AlgoAmount 설정하는 방법: https://github.com/algorandfoundation/algokit-utils-ts/blob/e9682db133fab42627648ac2f779cd91f3e6cd21/docs/capabilities/amount.md#creating-an-algoamount
    힌트2: 앱 클라이언트 메서드 호출때 메서드 전달값 넣는법: https://github.com/algorandfoundation/algokit-client-generator-ts/blob/main/docs/usage.md#abi-arguments
    */

    // 문제 3 시작
    const mbrTxn = await algorand.transactions.payment({
      sender,
      receiver: createResult.appAddress,
      amount: algokit.algos(0.1 + 0.1),
      extraFee: algokit.algos(0.001),
    })

    await dmClient.bootstrap({ asset: assetId, unitaryPrice: unitaryPrice, mbrPay: mbrTxn })

    // 문제 3 끝

    await algorand.send.assetTransfer({
      assetId,
      sender,
      receiver: createResult.appAddress,
      amount: quantity,
    })

    setAppId(Number(createResult.appId))
  }
}

export function buy(
  algorand: algokit.AlgorandClient,
  dmClient: DigitalMarketplaceClient,
  sender: string,
  appAddress: string,
  quantity: bigint,
  unitaryPrice: bigint,
  setUnitsLeft: React.Dispatch<React.SetStateAction<bigint>>,
) {
  return async () => {
    /*
    문제 4
    밑에 `buyerTxn` 결제 트랜잭션를 buy 메서드의 전달값으로 넣어 어토믹 트랜잭션으로 동시에 호출하세요.

    buy 메서드는 호출 시 스마트 계약에 있는 NFT를 구매자 지갑으로 보내주는 inner transaction이 있습니다.
    따라서 buy 메서드 호출자가 inner transaction의 트랜잭션 비용을 내야합니다.
    이 부분은 buyerTxn안에 extraFee를 통해서 설정을 해주면 됩니다. 이때 extraFee는 AlgoAmount 데이터타입을 받습니다!!
    extra fee 비용은 0.001 Algos입니다.

    힌트1: AlgoAmount 설정하는 방법: https://github.com/algorandfoundation/algokit-utils-ts/blob/e9682db133fab42627648ac2f779cd91f3e6cd21/docs/capabilities/amount.md#creating-an-algoamount
    힌트2: 앱 클라이언트 메서드 호출때 메서드 전달값 넣는법: https://github.com/algorandfoundation/algokit-client-generator-ts/blob/main/docs/usage.md#abi-arguments
    */

    // 문제 4 시작
    const buyerTxn = await algorand.transactions.payment({
      sender,
      receiver: appAddress,
      amount: algokit.microAlgos(Number(quantity * unitaryPrice)),
      extraFee: algokit.algos(0.001),
    })

    await dmClient.buy({
      buyerTxn: buyerTxn,
      quantity: quantity,
    })

    // 문제 4 끝

    const state = await dmClient.getGlobalState()
    const info = await algorand.account.getAssetInformation(appAddress, state.assetId!.asBigInt())
    setUnitsLeft(info.balance)
  }
}

export function deleteApp(dmClient: DigitalMarketplaceClient, setAppId: (id: number) => void) {
  return async () => {
    /*
    문제 5
    앱을 삭제하고 수익금을 회수하는 withdrawAndDelete 메서드를 호출하세요.

    withdrawAndDelete 메서드는 OnComplete Actions가 DeleteApplication으로 설정된 특별한 메서드입니다.
    앱 클라이언트에는 delete라는 property가 있습니다. 이 delete property에 withdrawAndDelete 메서드가 있으니 이 메서드를 호출하시면 됩니다.

    앱 클라이언트로 withdrawAndDelete 같은 메서드를 호출할때 전달값을 두개 넣을 수 있습니다.
    1. ABI Arguments: 스마트계약 메서드 호출시 전달값을 넣는 곳입니다.
    2. Additional Parameters: 앱 클라이언트 메서드 호출시 추가적인 설정을 넣는 곳입니다.

    abi argument:
    withdrawAndDelete는 전닯값이 필요없는 메서드입니다. 따라서 빈 객체를 넣어주세요.

    additional parameters:
    withdrawAndDelete는 2개의 inner txn를 보냅니다.
    1. 수익금 판매자에게 송금
    2. 잔여 nft 송금
    따라서 호출시 sendParams 안에 추가 fee 설정을 해야합니다.
    - fee: sendParams 객체 안에 fee를 0.003 Algos로 설정해야합니다.

    힌트1: 앱클라이언트로 앱을 delete 하는법 - https://github.com/algorandfoundation/algokit-client-generator-ts/blob/main/docs/usage.md#update-and-delete-calls
    힌트2: 앱 클라이언트 메서드 호출때 메서드 전달값 넣는법: https://github.com/algorandfoundation/algokit-client-generator-ts/blob/main/docs/usage.md#abi-arguments
    힌트3: additional parameters에 extra fee 설정하는 방법: https://github.com/algorandfoundation/algokit-client-generator-ts/blob/main/docs/usage.md#additional-parameters
    힌트4: AlgoAmount 설정하는 방법: https://github.com/algorandfoundation/algokit-utils-ts/blob/e9682db133fab42627648ac2f779cd91f3e6cd21/docs/capabilities/amount.md#creating-an-algoamount
    힌트5: 다 시도해보고 모르겠을때 보세요!: https://github.com/algorand-devrel/blockchain-valley-session-2/blob/df789308e76a5a6cb3c815b256779fb197add8fd/projects/coding-assignment/smart_contracts/digital_marketplace/deploy-config.ts#L70C1-L74C4
    */

    // 문제 5 시작

    // await appClient.closeOut.withdraw({}, { sendParams: { fee: algokit.transactionFees(2) } })

    await dmClient.delete.withdrawAndDelete(
      {},
      {
        sendParams: {
          fee: algokit.transactionFees(3),
        },
      },
    )
    // 문제 5 끝
    setAppId(0)
  }
}
