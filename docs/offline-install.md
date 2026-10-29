# sam-plugins (오프라인): SAM UI 킷 Claude Code 플러그인 sam-ui

SAM UI 킷(사이드바 레이아웃, 필터 툴바, 세그먼트 · 탭 · 월 선택 · 스위치, 라이트/다크 토큰, air · TDS · MVNO
로고와 브랜드 색)을 프로젝트에 설치하고 그 킷으로 화면을 만드는 Claude Code 플러그인입니다.
네트워크 없이 이 폴더에서 바로 설치합니다.

## 설치

1. 이 폴더(`sam-plugins`)를 원하는 곳에 둡니다. 예: `~/sam-plugins`
2. Claude Code에서:

   ```
   /plugin marketplace add ~/sam-plugins
   /plugin install sam-ui@sam-plugins
   ```

   터미널에서는 `claude plugin marketplace add ~/sam-plugins` 후 `claude plugin install sam-ui@sam-plugins`.
3. 쓸 프로젝트를 새 세션으로 열고 "SAM UI 킷 설치해줘"라고 하면 `sam-ui:sam-ui-kit` 스킬이 킷을 복사 ·
   설정하고, 이후 화면도 이 킷으로 만듭니다. 요구 사항: React 19, Tailwind CSS 4, `@/*` 경로 별칭(레이아웃은
   Next.js App Router).

이전 이름(0.3.5까지 `sam-ui@sam-plugins`, 0.4의 `sam-ui-kit@sam-ui`, 0.5.0 · 0.5.1의 `sam-ui@hoo-plugins`)으로
설치했다면 먼저 `claude plugin marketplace remove hoo-plugins`(또는 `sam-ui`, `sam-plugins`)로 이전 마켓플레이스와 그
플러그인을 지우고 위 순서로 설치합니다. 범위(`--scope`)는 붙이지 않습니다.

## 업데이트

새 버전 zip을 받으면 기존 `sam-plugins` 폴더를 지우고(또는 이름을 바꾸고) 같은 자리에 새로 풉니다. 그 위에
덮어쓰면 새 버전에서 빠진 파일이 남아 프로젝트에 다시 들어갑니다. 그다음 Claude Code에서:

```
/plugin marketplace update sam-plugins
/reload-plugins
```

터미널에서는 `claude plugin marketplace update sam-plugins`, `claude plugin update sam-ui@sam-plugins` 후 Claude
Code를 다시 시작합니다.

사업 로고가 들어 있으니 다른 곳에 다시 배포하지 마세요.
