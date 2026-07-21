# 🎮 포켓 필드 어드벤처 (Pocket Field Adventure)
> **Code.gs만 구글 앱스 스크립트에 넣고, 프론트엔드는 깃허브 저장소에 관리하는 배포 방식**

---

## 📂 1. 역할 분담 구조

```
[구글 앱스 스크립트 (GAS)]
   └─ Code.gs (백엔드 REST API Engine + Google Sheets DB 조작)

[깃허브 저장소 (GitHub Repository)]
   ├─ index.html (SPA UI 템플릿)
   ├─ css.html   (GBC 레트로 디자인 시스템 & 애니메이션)
   ├─ js.html    (클라이언트 라우터 & GAS API 통신 브리지)
   ├─ setup_sheets.gs (시트 DB 7개 자동 초기화 도우미)
   └─ README.md  (배포 및 운영 가이드)
```

---

## 🚀 2. 설치 및 배포 절차 (3분 완주)

### 1단계: 구글 시트 생성 및 `Code.gs` 입력
1. [Google Sheets](https://sheets.google.com)에서 새 스프레드시트를 만듭니다.
2. 상단 메뉴에서 **[확장 프로그램] -> [Apps Script]**를 클릭합니다.
3. 기본 `Code.gs` 파일 내용을 지우고, 본 프로젝트의 **`Code.gs` 하나만 복사해서 붙여넣습니다.**

### 2단계: DB 7개 시트 생성 (`setup_sheets.gs` 1회 실행)
1. Apps Script의 `+` 버튼 -> `스크립트` 추가를 누르고 이름은 `setup_sheets.gs`로 지정한 뒤, 저장소의 `setup_sheets.gs` 코드 내용을 붙여넣습니다.
2. 상단 실행 함수 드롭다운에서 **`initDatabase`**를 선택하고 **[실행]**을 클릭합니다.
3. 구글 권한 승인 후 실행이 완료되면 구글 시트에 `Members`, `Teams`, `Missions`, `MissionLog`, `Points`, `Sessions`, `Config` 7개 시트가 자동 생성됩니다.

### 3단계: GAS 웹앱 배포 (Web App URL 생성)
1. Apps Script 우측 상단의 **[배포] -> [새 배포]**를 클릭합니다.
2. ⚙ 버튼 -> **[웹 앱]** 선택:
   - **다음 사용자 권한으로 실행**: **나 (웹앱 제작 구글 계정)**
   - **액세스할 수 있는 사용자**: **모든 사용자 (Anyone)** ⚠ (필수)
3. **[배포]**를 클릭한 후 생성된 **웹앱 URL (Web App URL)**을 복사합니다.

---

## 🔗 3. 깃허브 저장소 연동 방식 (2가지 중 선택)

### 방식 A: 깃허브 원본 코드 동적 로드 (추천! 💡)
`Code.gs` 상단의 `GITHUB_RAW_BASE` 변수에 깃허브 저장소의 Raw 주소를 적어두면, 구글 앱스 스크립트에서 실시간으로 깃허브의 `index.html`, `css.html`, `js.html`을 불러와 보여줍니다!
- `Code.gs` 상단 수정 예시:
  ```javascript
  var GITHUB_RAW_BASE = "https://raw.githubusercontent.com/사용자ID/저장소명/main";
  ```
- 이 방식을 사용하면 깃허브에서 HTML/CSS/JS 코드를 수정하고 Push할 때마다 웹앱에 즉시 반영됩니다.

### 방식 B: GitHub Pages 독립 웹 호스팅
깃허브 저장소의 Settings -> **Pages** 메뉴에서 GitHub Pages를 활성화합니다.
- `https://사용자ID.github.io/저장소명/` 주소로 접속한 후, 브라우저 개발자 콘솔(F12)에서 3단계에서 복사한 GAS Web App URL을 설정하거나 `js.html`에 명시해두면 깃허브 페이지에서 GAS 백엔드로 API 통신을 수행합니다.
  ```javascript
  localStorage.setItem('POCKET_GAS_URL', 'https://script.google.com/macros/s/.../exec');
  ```

---

## 📝 4. URL 회신 안내

3단계에서 배포된 **Google Apps Script 웹앱 URL**을 회신해주시면 저장소 세팅 및 링크 연동 배포가 완성됩니다!
