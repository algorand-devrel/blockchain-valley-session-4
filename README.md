# 🎓 블록체인 밸리 X 알고랜드 개발자 부트캠프

## 🚩 세션 4: AlgoKit Utils와 App Client를 사용해 스마트 계약 배포 및 호출하는 방법을 배워보자!

네번째 알고랜드 개발자 부트캠프에 오신 블록체인 밸리 학회원분들 반갑습니다~!

세부 일정:

1. 알고랜드 스마트 계약 호출에 관한 모든것 알아보기 (30분)
2. 코드 데모 (30분)
3. 코딩 세션 (2시간)

알고랜드 스마트 계약 호출에 관한 모든 것 👉 [PPT 슬라이드](https://docs.google.com/presentation/d/1VOYewmGymgK8QSpm_Y3WeqL3QFSzGbfCSSDtrlgKtJo/edit?usp=sharing)

이번 코딩 세션에서는 [알고랜드 파이썬](https://algorandfoundation.github.io/puya/index.html)으로 작성된 디지털 마켓플레이스 스마트 계약을 [AlgoKit Utils TypeScript](https://github.com/algorandfoundation/algokit-utils-ts)와 [Application Client](https://github.com/algorandfoundation/algokit-client-generator-ts/tree/main)를 사용해 배포 및 호출하는 법을 배워 React 프론트앤드 연동을 구축해보겠습니다.

DigitalMarketplace 앱 설명

이 간단한 DigitalMarketplace 앱은 에섯(ASA)를 판매할 수 있는 스마트 계약입니다.

이 앱의 lifecycle은 아래와 같습니다.

1. 앱 생성자(판매자)가 앱을 생성합니다.
2. 앱 생성자(판매자)가 앱을 부트스트랩 메서드를 호출해 부트스트랩합니다. 이때 앱은 판매할 에셋(ASA)을 설정하고, 단가를 설정하고, 앱 계정이 옵트인을 합니다.
3. 구매자가 앱에서 판매하는 에셋(ASA)을 buy메서드를 호출해 구매합니다.
4. 앱 생성자(판매자)가 withdraw_and_delete 메서드를 호출해 앱 계정에 남아있는 에셋(ASA)을 앱 계정으로 전송하고, 모든 수익금을 판매자 계정으로 송금한 뒤, 스마트 계약을 삭제합니다.
   번외: set_price 메서드를 통해 판매할 에셋(ASA)의 단가를 변경할 수 있습니다.

이 알고킷 프로젝트는 3개의 프로젝트 폴더가 있습니다.

1. blockchain-valley-session-4: Personal Bank 데모 코드가 들어있는 프로젝트.
2. digital-marketplace-contract: 디지털 마켓플레이스 스마트계약이 들어있는 프로젝트.
3. coding-assignment: 알고킷 frontend 템플릿으로 만들어진 React 프로젝트.

> 보통의 fullstack 알고킷 템플릿은 blockchain-valley-session-4 폴더 없이 스마트계약 폴더와 프론트앤드 폴더로 구성이 되어있습니다!

오늘 코딩 과제는 coding-assignment 폴더 안에서 진행됩니다. 오늘 문제들은 여러 파일들에 분포되어있으니 밑에
**체크포인트 3** 설명을 꼼꼼히 읽고 진행해주세요!

코딩 과제는 총 5문제로 구성되어 있으며 각 문제에 "**_ 여기에 코드 작성 _**" 부분에 코드를 작성하시면 됩니다. 밑에 체크포인트들을 따라서 진행해주세요!

## 체크포인트 1: 🧰 알고랜드 개발에 필요한 툴킷 설치

1. [AlgoKit 설치](https://github.com/algorandfoundation/algokit-cli/tree/main?tab=readme-ov-file#install).
2. [Docker 설치](https://www.docker.com/products/docker-desktop/). It is used to run a local Algorand network for development.
3. [Node.JS / npm 설치](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)

## 체크포인트 2: 💻 개발 환경 셋업

1. [이 리포를 fork 해주세요.](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/working-with-forks/fork-a-repo)
2. Fork한 리포를 git clone 해주세요.

```bash
cd [DIRECTORY_OF_YOUR_CHOICE]
git clone [FORKED_REPO_URL]
```

3. VSCode에서 이 폴더를 열람해주세요.
4. 열람 후 `blockchain-valley-session-4.code-workspace` 파일을 열람 후 `open workspace` 버튼을 눌러 workspace 모드를 실행시켜주세요.
5. 이제 VSCode 터미널이 4개가 자동 생성될 것 입니다: `ROOT` `blockchain-valley-session-4` `digital-marketplace-contract` `coding-assignment`. 이 중 `ROOT` VSCode 터미널에서 `algokit project bootstrap all` 커맨드를 실행시켜 dependencies들을 설치해주세요. 이러면 모든 프로젝트 폴더의 dependencies들이 설치됩니다.

```bash
algokit project bootstrap all
```

6. 이제 `coding-assignment` 터미널을 선택한 뒤 `poetry shell` 커맨드를 실행해 파이썬 virtual environment를 활성화 시켜주세요.
   1. 파이썬 virtual environment를 비활성화 시킬때는 `exit` 커맨드를 실행하시면 됩니다.

리포 fork, clone 튜토리얼:
https://github.com/algorand-fix-the-bug-campaign/challenge-1/assets/52557585/acde8053-a8dd-4f53-8bad-45de1068bfda

## 체크포인트 3: 📝 문제를 해결하세요!

1. 도커 데스크탑을 실행한 뒤 터미널에서 `algokit localnet start` 커맨드로 로컬 네트워크를 실행시켜주세요.[더 자세히 알고 싶다면 여기를 클릭해주세요!](https://github.com/algorandfoundation/algokit-cli/blob/main/docs/features/localnet.md#creating--starting-the-localnet).
2. `coding-assignment` 터미널에서 `npm run dev`를 실행해서 로컬 서버를 실행한 뒤, 브라우저에 페이지를 열고 진행해주세요!
3. 문제 1은 `src/Home.tsx` 파일 라인 59에 있습니다!
4. 문제 2-5는 `src/methods.ts` 파일에 있습니다!
5. 문제를 다 해결한 뒤 아래 설명 순서를 직접 웹사이트에 가서 실행해보세요.
   1. `Wallet Connection` 버튼을 눌러 로컬 지갑을 연결하세요.
   2. Unitary Price를 1로 설정한 뒤 `create Marketplace` 버튼을 눌러 `methods.ts` 안에 정의되어있는 `create` 함수를 실행하세요. 이때 아래와 같은 창이 뜰건데, 비밀번호 기입 필요 없이 OK 버튼을 눌러 트랜잭션 sign을 해주세요. 이때 총 4번 sign 요청이 뜰 것입니다.
      ![alt text](image.png)
   3. `Desired Quantity`를 10으로 설정해주고 `Buy` 버튼을 눌러 에섯 10개를 구매하세요.이때 트랜잭션 sign 창은 한번 뜹니다.
   4. 모든 에셋이 팔리면 `Delete App` 버튼이 뜰 것입니다. 버튼을 눌러 수익금을 회수하고 마켓플레이스 앱을 삭제해주세요!

이 모든 것이 제대로 실행되면 성공적으로 과제를 해결하신겁니다! 🎉🎉 이제부턴 자유롭게 직접 만든 디지털 마켓플레이스 앱을 사용해보세요~!

https://github.com/algorand-devrel/blockchain-valley-session-4/assets/52557585/811c5a53-7341-4e97-9bf7-07d8f55a0261


## 체크포인트 4: 💯 과제 제출하는 방법

1. 성공적으로 다섯 문제를 해결한 후 본인이 fork한 깃헙 리포로 코드를 푸쉬해주세요. 그런 다음 [원래의 리포로 Pull request를 해주세요.](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request-from-a-fork)
2. Pull Request 템플렛을 따라 앱을 사용하는 영상을 찍어 올려주세요!
