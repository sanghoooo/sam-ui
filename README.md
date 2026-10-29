# sam-ui — SAM UI 킷

SAM UI 킷과, 그 킷을 다른 프로젝트에 설치하고 쓰게 하는 Claude Code 플러그인 `sam-ui-kit`(마켓플레이스
`sam-ui`)을 관리하는 저장소입니다.

- **킷:** 사이드바 레이아웃(시작용 메뉴), 필터 툴바, SegmentedControl(움직이는 선택 표시), Tabs,
  MonthStepper, Select, Switch, StatePanel, AI Insight 로고, air · TDS · MVNO 로고와 브랜드 색, 라이트(기본) ·
  다크 토큰. React 19 + Tailwind CSS 4, 레이아웃은 Next.js App Router.
- **플러그인:** 설치하면 `sam-ui-kit:ui-kit` 스킬이 생기고, 어떤 프로젝트에서든 "SAM UI 킷 설치해줘"라고 하면
  Claude가 킷을 복사 · 설정하고 이후 화면도 이 킷으로 만듭니다.

## 구성

```
.claude-plugin/marketplace.json   마켓플레이스 sam-ui
plugins/sam-ui-kit/               플러그인 sam-ui-kit
  .claude-plugin/plugin.json      이름 · 버전
  skills/ui-kit/
    SKILL.md                      설치 순서 · 화면 만드는 법 · 스타일 규칙
    references/                   컴포넌트별 사용법, 토큰, 레이아웃
    assets/                       킷 원본 (components, lib, styles/ui-kit.css, public/images)
    scripts/kit.mjs               프로젝트에 설치 · 업데이트 · 점검 (sam-ui.json에 버전과 파일 해시 기록)
    templates/placeholder-page.tsx 메뉴 링크용 "준비 중" 페이지
apps/hoo/                         Next.js 사이트: 킷 소개(/)와 UI 요소를 모두 보여 주는 팔레트(/palette)
scripts/release.sh                버전 올리기 · 검사 · 오프라인 설치용 zip
tests/kit.test.mjs                kit.mjs 시나리오 테스트 (pnpm test)
docs/offline-install.md           zip에 들어가는 설치 안내
```

킷 원본은 `plugins/sam-ui-kit/skills/ui-kit/assets/` 한 곳입니다. 사이트(`apps/hoo`)는 경로 별칭(`@/components/*`,
`@/lib/*`)과 `@source`로 그 파일을 직접 읽으므로 복사본이 없습니다.

## 개발

```sh
pnpm install
pnpm dev        # http://localhost:3102 (/ 소개, /palette 팔레트)
pnpm lint
pnpm test       # kit.mjs 시나리오 테스트
pnpm build
```

킷을 고칠 때:

1. `assets/`의 파일을 고칩니다. 이 파일들은 다른 프로젝트로 복사되므로 주석에 이 저장소 밖의 경로를 쓰지 않습니다.
2. 사용법이 바뀌면 `skills/ui-kit/references/`의 해당 문서와 `SKILL.md`를 함께 고칩니다.
3. 새 컴포넌트나 변형은 팔레트(`apps/hoo/app/palette/palette-demo.tsx`)에 보이게 합니다. 소개 페이지와 사이트 머리는 한국어, 팔레트는 영어로 씁니다.
4. `pnpm lint`, `pnpm build`, 라이트 · 다크 화면 확인.

## 배포

```sh
pnpm release 0.2.0   # plugin.json version 변경 → plugin validate → dist/sam-ui-0.2.0.zip
```

그다음 커밋하고 `v0.2.0` 태그와 함께 기본 브랜치에 머지합니다. 설치한 사람은 Claude Code에서
`/plugin marketplace update sam-ui` 후 `/reload-plugins`로 받습니다(터미널에서는 `claude plugin marketplace
update sam-ui`, `claude plugin update sam-ui-kit@sam-ui` 후 다시 시작). `version`을 올리지 않으면 설치된 쪽에
업데이트가 가지 않습니다.

## 설치 (사용하는 쪽)

GitHub에 접근할 수 있으면:

```
/plugin install sam-ui-kit --marketplace https://github.com/sanghoooo/sam-ui.git
```

또는 `/plugin marketplace add https://github.com/sanghoooo/sam-ui.git` 후 `/plugin install sam-ui-kit@sam-ui`.
GitHub에 접근할 수 없는 PC는 `pnpm release`가 만든 zip을 풀어 로컬 경로로 추가합니다(`docs/offline-install.md`).

## 사용하는 프로젝트의 업데이트

킷을 배포하면 각 프로젝트는 플러그인을 업데이트한 뒤(`/plugin marketplace update sam-ui`,
`/reload-plugins`) Claude에게 "SAM UI 킷 업데이트해줘"라고 합니다. 스킬이 `kit.mjs update`로
처리합니다.

- 프로젝트가 손대지 않은 킷 파일은 새 버전으로 바뀌고, 킷에서 빠진 파일은 지워집니다.
- 프로젝트에서도 바뀐 파일은 덮어쓰지 않고 `merge`로 알려 줍니다. Claude가 킷의 변경을 합친 뒤 `--keep <path>`로
  기록하고, 기록하기 전까지는 업데이트할 때마다 다시 알려 줍니다. 한 파일만 킷 버전으로 되돌릴 때는 `--take <path>`를
  씁니다(`--force`는 `--keep`으로 지정하지 않은 로컬 변경 전부를 되돌립니다).
- 새 킷 파일이 프로젝트의 고유 파일과 이름이 겹치면 `differs`로 알리고 건드리지 않습니다.
- 시작용 파일(`lib/nav.ts`)은 처음 설치 때만 들어가고 이후에는 프로젝트 것입니다. 킷이 바꾸면 `compare`로,
  킷에서 빠지면(0.2.0의 `components/layout/brand.tsx`) `unused`로 한 번 알려 주고 파일은 그대로 둡니다.
- 프로젝트의 킷이 플러그인보다 새 버전이면 update가 거부합니다. 플러그인부터 업데이트합니다.
- 설치 정보는 프로젝트 루트의 `sam-ui.json`(킷 버전, 파일별 해시)에 있고, `kit.mjs check`는 킷과 달라진 파일을
  보여 줍니다.

킷 수정은 이 저장소에서만 합니다. 프로젝트의 사본을 고치면 업데이트 때마다 손으로 합쳐야 합니다.

## 라이선스

코드와 문서는 MIT 라이선스입니다(`LICENSE`). air · T 로고(`assets/public/images/workspaces/`)는 각 소유자의
상표라 이 라이선스에 포함되지 않고, Pretendard 폰트는 SIL Open Font License 1.1(`assets/lib/fonts/OFL.txt`)을
따릅니다.
