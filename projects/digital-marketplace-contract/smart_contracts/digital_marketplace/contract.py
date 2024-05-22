# pyright: reportMissingModuleSource=false
from algopy import (
    Asset,
    Global,
    Txn,
    UInt64,
    arc4,
    gtxn,
    itxn,
)

"""
DigitalMarketplace 앱 설명

이 간단한 DigitalMarketplace 앱은 에섯(ASA)를 판매할 수 있는 스마트 계약입니다.

이 앱의 lifecycle은 아래와 같습니다.
1. 앱 생성자(판매자)가 앱을 생성합니다.
2. 앱 생성자(판매자)가 앱을 부트스트랩 메서드를 호출해 부트스트랩합니다. 이때 앱은 판매할 에셋(ASA)을 설정하고, 단가를 설정하고, 앱 계정이 옵트인을 합니다.
3. 구매자가 앱에서 판매하는 에셋(ASA)을 buy메서드를 호출해 구매합니다.
4. 앱 생성자(판매자)가 withdraw_and_delete 메서드를 호출해 앱 계정에 남아있는 에셋(ASA)을 앱 계정으로 전송하고, 모든 수익금을 판매자 계정으로 송금한 뒤, 스마트 계약을 삭제합니다.
번외: set_price 메서드를 통해 판매할 에셋(ASA)의 단가를 변경할 수 있습니다.
"""


class DigitalMarketplace(arc4.ARC4Contract):

    """
    DigitalMarketplace 앱은 세개의 상태를 가지고 있습니다.
    1. asset_id: 판매할 에셋(ASA)의 아이디; UInt64타입을 가진 글로벌 상태(Global State)
    2. unitary_price: 판매할 에셋(ASA)의 가격. UInt64타입을 가진 글로벌 상태(Global State)
    3. bootstrapped: 앱에서 에셋을 판매할 준비가 되었는지 체크하는 bool 타입의 글로벌 상태(Global State). bootstrap 메서드가 실행되면 True로 변경됩니다.
    """
    def __init__(self) -> None:
        self.asset_id = UInt64(0)
        self.unitary_price = UInt64(0)
        self.bootstrapped = False

    """
    set_price 메서드는 판매할 에셋의 단가를 변경하는 메서드입니다.
    """
    @arc4.abimethod
    def set_price(self, unitary_price: UInt64) -> None:
        assert Txn.sender == Global.creator_address

        self.unitary_price = unitary_price

    """
    bootstrap 메서드는 앱이 판매할 에셋(ASA)을 설정하고, 단가를 설정하고 에셋이 앱 계정이 옵트인 하는 메서드입니다. 
    즉 앱이 판매할 준비를 하는 메서드입니다.
    """
    @arc4.abimethod
    def bootstrap(
        self, asset: Asset, unitary_price: UInt64, mbr_pay: gtxn.PaymentTransaction
    ) -> None:
        assert Txn.sender == Global.creator_address
        assert not Global.current_application_address.is_opted_in(Asset(self.asset_id))

        assert mbr_pay.receiver == Global.current_application_address
        assert mbr_pay.amount == Global.min_balance + Global.asset_opt_in_min_balance

        self.asset_id = asset.id
        self.unitary_price = unitary_price
        self.bootstrapped = True

        itxn.AssetTransfer(
            xfer_asset=asset,
            asset_receiver=Global.current_application_address,
            asset_amount=0,
        ).submit()

    """
    buy 메서드는 앱에서 판매하는 에셋(ASA)을 구매할때 구매자가 호출하는 메서드입니다.
    """
    @arc4.abimethod
    def buy(
        self,
        buyer_txn: gtxn.PaymentTransaction,
        quantity: UInt64,
    ) -> None:
        assert self.unitary_price != UInt64(0)

        assert buyer_txn.sender == Txn.sender
        assert buyer_txn.receiver == Global.current_application_address
        assert buyer_txn.amount == self.unitary_price * quantity

        itxn.AssetTransfer(
            xfer_asset=self.asset_id,
            asset_receiver=Txn.sender,
            asset_amount=quantity,
        ).submit()

    """
    withdraw_and_delete 메서드는 앱 계정에 있는 잔여 에셋(ASA)을 앱 계정으로 전송하고, 
    모든 수익금을 판매자 계정으로 송금한 뒤,
    스마트 계약을 삭제하는 메서드입니다.
    """
    @arc4.abimethod(allow_actions=["DeleteApplication"])
    def withdraw_and_delete(self) -> None:
        assert Txn.sender == Global.creator_address

        itxn.AssetTransfer(
            xfer_asset=self.asset_id,
            asset_receiver=Global.creator_address,
            asset_amount=0,
            asset_close_to=Global.creator_address,
        ).submit()

        itxn.Payment(
            receiver=Global.creator_address,
            amount=0,
            close_remainder_to=Global.creator_address,
        ).submit()
