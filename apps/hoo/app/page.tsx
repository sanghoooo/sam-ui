import {
  ArrowRight,
  Blocks,
  MessageSquare,
  PanelLeft,
  ShieldCheck,
  Sparkles,
  SunMoon,
  User,
} from "lucide-react";
import type { StaticImageData } from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { WORKSPACES, WorkspaceLogo } from "@/components/layout/workspace-logo";
import { AiInsightTitle } from "@/components/ui/ai-insight";
import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import plugin from "../../../plugins/sam-ui/.claude-plugin/plugin.json";
import { CopyButton } from "./_intro/copy-command";
import { HeroPreview } from "./_intro/hero-preview";
import { InstallGuide } from "./_intro/install-guide";
import dashboardBuilt from "./_intro/shots/dashboard-built.webp";
import kitInstalled from "./_intro/shots/kit-installed.webp";
import screenBuilt from "./_intro/shots/screen-built.webp";

const REPO = "https://github.com/sanghoooo/sam-ui";

const FEATURES = [
  {
    icon: Blocks,
    title: "함께 어울리는 컴포넌트",
    body: "버튼, 배지, 카드, 툴바, 필드, 셀렉트, 세그먼트, 탭, 월 선택, 스위치가 한 화면에 나란히 놓여도 자연스럽게 어울립니다.",
  },
  {
    icon: PanelLeft,
    title: "바로 쓰는 앱 셸",
    body: "접히는 사이드바, 페이지 헤더, 뒤로 가기 버튼을 갖춘 Next.js App Router 레이아웃입니다. 메뉴는 파일 하나로 관리합니다.",
  },
  {
    icon: SunMoon,
    title: "토큰으로 라이트 · 다크",
    body: "모든 색이 다크 값을 가진 토큰이라, dark: 클래스 하나 없이도 화면이 테마를 따라 바뀝니다.",
  },
  {
    icon: Sparkles,
    title: "AI 결과를 위한 표시",
    body: "움직이는 AI Insight 제목이 AI가 만든 요약을 알려 주고, 움직임 줄이기 설정에서는 멈춰 있습니다.",
  },
  {
    icon: MessageSquare,
    title: "Claude가 킷으로 만듭니다",
    body: "플러그인의 스킬이 모든 컴포넌트와 스타일 규칙을 알고 있어, 새 화면도 기존 화면과 같은 모습으로 나옵니다.",
  },
  {
    icon: ShieldCheck,
    title: "수정을 지키는 업데이트",
    body: "킷이 파일마다 해시를 기록합니다. 업데이트는 손대지 않은 파일만 바꾸고, 고친 파일은 알려 줍니다.",
  },
];

const STEPS = [
  {
    title: "플러그인 설치",
    body: "마켓플레이스 sam-plugins를 추가하고 sam-ui를 설치합니다. Claude Code, Claude 앱, Codex 중 편한 한 곳에서만 하면 됩니다.",
    detail: <InstallGuide />,
  },
  {
    title: "킷 설치 요청",
    body: "프로젝트에서 “SAM UI 킷 설치해줘”라고 요청하거나 /sam-ui-kit을 실행하면 Claude가 컴포넌트를 복사하고 토큰과 앱 셸을 연결한 뒤, 모든 파일을 sam-ui.json에 기록합니다.",
    detail: (
      <div className="flex flex-wrap items-end gap-x-3 gap-y-2">
        <Prompt text="SAM UI 킷 설치해줘" />
        <span className="ml-2.5 pb-3 text-[12px] font-semibold text-muted-foreground">
          또는
        </span>
        <Prompt command text="/sam-ui-kit" />
      </div>
    ),
    result: {
      image: kitInstalled,
      alt: "킷을 설치한 직후의 화면: 시작 메뉴가 있는 사이드바와 '준비 중인 화면입니다' 안내가 있는 개요 페이지",
      caption:
        "설치 직후 화면: 시작 메뉴가 있는 사이드바와 아직 비어 있는 개요 페이지",
    },
  },
  {
    title: "화면 설명",
    body: "Claude가 킷의 컴포넌트로 라이트 · 다크 모두에 맞는 화면을 만듭니다.",
    detail: (
      <Prompt text="기준월 필터, 사업 선택, 주문 · 매출 탭이 있는 현황 페이지 만들어줘" />
    ),
    result: {
      image: screenBuilt,
      alt: "기준월과 사업 필터, 주문 · 매출 탭, 이번 달 · 최근 6개월 평균 카드, 사업별 이번 달 · 지난달 · 전월 대비 · 비중 표가 있는 개요 화면",
      caption:
        "요청대로 만든 화면: 기준월 · 사업 필터, 주문 · 매출 탭, 이번 달 카드와 사업별 현황 표",
    },
  },
  {
    title: "차트 대시보드",
    body: "킷에 든 차트로 추이, 막대, 비중을 한 화면에 그립니다. 툴팁과 색이 같아 차트끼리도 어울립니다.",
    detail: (
      <Prompt text="주문 추이와 채널 · 요금제 비중을 차트로 보여 주는 대시보드 만들어줘" />
    ),
    result: {
      image: dashboardBuilt,
      alt: "일별 주문 추이와 오늘 · 목표선, 온라인 비중 링, 사업별 월간 주문 막대, 요금제별 비중 트리맵, 채널별 주문 막대 목록이 있는 주문 분석 화면",
      caption:
        "요청대로 만든 대시보드: 일별 추이, 온라인 비중, 사업별 월간 막대, 요금제 트리맵, 채널별 주문",
    },
  },
];

const UPDATE_LOG = [
  ["updated", "components/ui/tabs.tsx", ""],
  ["added", "components/ui/switch.tsx", ""],
  ["local", "lib/utils.ts", "changed here; the kit's version did not change"],
  [
    "merge",
    "components/ui/card.tsx",
    "changed here and in the kit: left as it is",
  ],
  ["compare", "lib/nav.ts", "a starter the kit changed: yours is kept"],
] as const;

export default function IntroPage() {
  return (
    <>
      {/* The hero's wash starts at the top of the page, so it shows through the translucent header. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[600px] bg-gradient-to-b from-ring/12 to-transparent"
      />
      <main>
        <section>
          <div className="mx-auto max-w-6xl px-4 pt-14 pb-10 lg:px-6 lg:pt-20">
            <div className="mx-auto max-w-3xl text-center">
              <Badge>v{plugin.version} · Claude Code / Codex 플러그인</Badge>
              <h1 className="mt-5 break-keep text-[36px] leading-[1.1] font-bold tracking-tight sm:text-[52px]">
                대시보드를 첫 화면부터 완성된 모습으로
              </h1>
              <p className="mx-auto mt-5 max-w-2xl break-keep text-[16px] leading-relaxed text-muted-foreground sm:text-[17px]">
                SAM UI는 대시보드를 위한 React · Tailwind CSS 4 킷입니다. Claude
                Code / Codex 플러그인이 킷을 설치하고 최신으로 유지하며, 새
                화면도 같은 컴포넌트로 만듭니다.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <a
                  className={buttonClass({
                    className: "h-10 px-5 text-[14px]",
                    variant: "primary",
                  })}
                  href="#get-started"
                >
                  시작하기 <ArrowRight className="size-4" />
                </a>
                <Link
                  className={buttonClass({
                    className: "h-10 px-5 text-[14px]",
                  })}
                  href="/palette"
                >
                  팔레트 보기
                </Link>
                <Link
                  className={buttonClass({
                    className: "h-10 px-5 text-[14px]",
                  })}
                  href="/charts"
                >
                  차트 보기
                </Link>
              </div>
              <p className="mt-6 text-[12px] text-muted-foreground">
                React 19 · Next.js 16 · TypeScript 7 · Tailwind CSS 4
              </p>
            </div>
            <div className="mt-12">
              <HeroPreview />
            </div>
            <p className="mt-3 text-center text-[11px] text-muted-foreground">
              킷으로 만든 화면입니다. 기준월이나 사업을 바꿔 보세요.
            </p>
          </div>
        </section>

        <Section
          eyebrow="사용 방법"
          id="get-started"
          title="빈 프로젝트에서 완성된 화면까지, 네 번의 요청"
        >
          <ol className="space-y-4">
            {STEPS.map(({ title, body, detail, result }, i) => (
              <li key={title}>
                <Card className="flex gap-4 p-6">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-[13px] font-bold text-primary-foreground">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="mt-0.5 text-[15px] font-bold">{title}</h3>
                    <p className="mt-1.5 break-keep text-[13px] leading-relaxed text-muted-foreground">
                      {body}
                    </p>
                    <div className="mt-5">{detail}</div>
                    {result && <Result {...result} />}
                  </div>
                </Card>
              </li>
            ))}
          </ol>
        </Section>

        <Section
          eyebrow="구성"
          id="features"
          title="대시보드 화면에 필요한 것만 담았습니다"
        >
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <li key={title}>
                <Card className="h-full p-6">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-muted">
                    <Icon className="size-[18px]" />
                  </span>
                  <h3 className="mt-4 text-[15px] font-bold">{title}</h3>
                  <p className="mt-1.5 break-keep text-[13px] leading-relaxed text-muted-foreground">
                    {body}
                  </p>
                </Card>
              </li>
            ))}
          </ul>
          <Card className="mt-4 flex flex-wrap items-center justify-between gap-x-8 gap-y-4 p-6">
            <div>
              <h3 className="text-[15px] font-bold">
                air · TDS · MVNO 워크스페이스 내장
              </h3>
              <p className="mt-1 break-keep text-[13px] text-muted-foreground">
                라이트 · 다크용 마크와 브랜드 색을 토큰으로 제공합니다.
              </p>
            </div>
            <ul className="flex flex-wrap items-center gap-5">
              {WORKSPACES.map((workspace) => (
                <li
                  className="flex items-center gap-2 text-[13px] font-semibold"
                  key={workspace.id}
                >
                  <WorkspaceLogo id={workspace.id} />
                  <span
                    aria-hidden
                    className="size-2.5 rounded-full"
                    style={{ background: workspace.color }}
                  />
                  {workspace.name}
                </li>
              ))}
            </ul>
          </Card>
        </Section>

        <Section
          eyebrow="업데이트"
          id="updates"
          title="새 버전이 나와도 내 작업은 그대로"
        >
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[2fr_3fr]">
            <ul className="space-y-4">
              {[
                [
                  "모든 파일을 추적합니다",
                  "sam-ui.json에 킷 버전과, 파일마다 기준이 된 킷 버전의 해시를 기록합니다.",
                ],
                [
                  "고친 파일은 그대로 둡니다",
                  "직접 고친 파일은 --take로 요청할 때만 킷 버전으로 바뀝니다.",
                ],
                [
                  "메뉴는 시작 파일입니다",
                  "lib/nav.ts는 처음 한 번만 복사되고, 이후 킷의 변경은 알려 주기만 합니다.",
                ],
              ].map(([title, body]) => (
                <li className="flex gap-3" key={title}>
                  <ShieldCheck className="mt-0.5 size-[18px] shrink-0 text-muted-foreground" />
                  <div>
                    <h3 className="text-[14px] font-semibold">{title}</h3>
                    <p className="mt-0.5 break-keep text-[13px] leading-relaxed text-muted-foreground">
                      {body}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            <Card className="overflow-hidden">
              <div className="border-b border-border bg-muted/60 px-4 py-2 text-[12px] text-muted-foreground">
                “SAM UI 킷 업데이트해줘”
              </div>
              <div className="overflow-x-auto p-4 font-mono text-[12px] leading-relaxed">
                <p className="text-muted-foreground">$ node kit.mjs update .</p>
                {UPDATE_LOG.map(([label, file, note]) => (
                  <p className="whitespace-nowrap" key={file}>
                    <span className="inline-block w-20 font-semibold">
                      {label}
                    </span>
                    {file}
                    {note && (
                      <span className="text-muted-foreground"> ({note})</span>
                    )}
                  </p>
                ))}
                <p className="mt-1 text-muted-foreground">
                  sam-ui 0.3.0 -&gt; {plugin.version}: 1 added, 1 updated, 0
                  removed.
                </p>
              </div>
            </Card>
          </div>
        </Section>

        <section className="mx-auto max-w-6xl px-4 pb-20 lg:px-6">
          <Card className="flex flex-col items-center gap-5 px-6 py-12 text-center">
            <AiInsightTitle as="span" />
            <h2 className="max-w-2xl break-keep text-[26px] leading-tight font-bold tracking-tight sm:text-[32px]">
              모든 컴포넌트와 차트를 두 테마로 확인하세요
            </h2>
            <p className="max-w-xl break-keep text-[14px] text-muted-foreground">
              팔레트와 차트 페이지에서 모든 변형과 상태를 볼 수 있습니다. 위쪽의
              다크 모드를 켜고 함께 확인하세요.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                className={buttonClass({
                  className: "h-10 px-5 text-[14px]",
                  variant: "primary",
                })}
                href="/palette"
              >
                팔레트 열기 <ArrowRight className="size-4" />
              </Link>
              <Link
                className={buttonClass({
                  className: "h-10 px-5 text-[14px]",
                })}
                href="/charts"
              >
                차트 열기
              </Link>
              <a
                className={buttonClass({ className: "h-10 px-5 text-[14px]" })}
                href="#get-started"
              >
                플러그인 설치
              </a>
            </div>
          </Card>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-[12px] text-muted-foreground lg:px-6">
          <p>
            <span className="font-semibold text-foreground">SAM UI</span> v
            {plugin.version}
          </p>
          <nav aria-label="바닥글" className="flex gap-4">
            <Link className="hover:text-foreground" href="/palette">
              팔레트
            </Link>
            <Link className="hover:text-foreground" href="/charts">
              차트
            </Link>
            <a className="hover:text-foreground" href={REPO}>
              소스
            </a>
          </nav>
        </div>
      </footer>
    </>
  );
}

function Section({
  id,
  eyebrow,
  title,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section
      className="mx-auto max-w-6xl scroll-mt-16 px-4 py-14 lg:px-6"
      id={id}
    >
      <p className="text-[13px] font-semibold text-muted-foreground">
        {eyebrow}
      </p>
      <h2 className="mt-2 max-w-3xl break-keep text-[26px] leading-tight font-bold tracking-tight sm:text-[32px]">
        {title}
      </h2>
      <div className="mt-8">{children}</div>
    </section>
  );
}

/** What a step leaves behind, as a screenshot that opens full size, with a caption. */
function Result({
  image,
  alt,
  caption,
}: {
  image: StaticImageData;
  alt: string;
  caption: string;
}) {
  return (
    <figure className="mt-5 max-w-3xl">
      <a
        className="block overflow-hidden rounded-xl border border-border transition-opacity hover:opacity-90"
        href={image.src}
        rel="noreferrer"
        target="_blank"
      >
        <img
          alt={alt}
          className="h-auto w-full"
          height={image.height}
          loading="lazy"
          src={image.src}
          width={image.width}
        />
      </a>
      <figcaption className="mt-2 break-keep text-[12px] text-muted-foreground">
        {caption}
      </figcaption>
    </figure>
  );
}

/**
 * A request to Claude, as a chat bubble from the person beside it, with a button that copies it. The bubble's
 * tail leaves its square bottom-left corner and curls out to a rounded tip by the person. A `command` is a slash
 * command: set in mono without quotes, and without the person, who is already beside the request it stands in for.
 */
function Prompt({
  text,
  command = false,
}: {
  text: string;
  command?: boolean;
}) {
  return (
    <div className="flex items-end gap-1">
      {!command && (
        <User
          aria-hidden
          className="mb-1 size-5 shrink-0 text-muted-foreground"
        />
      )}
      <div className="relative ml-2.5 flex w-fit max-w-full min-w-0 items-center gap-1 rounded-2xl rounded-bl-none bg-muted py-1.5 pr-1.5 pl-4 text-[13px]">
        <svg
          aria-hidden
          className="absolute bottom-0 -left-[11px] h-4 w-3 text-muted"
          fill="currentColor"
          viewBox="0 0 12 16"
        >
          <path d="M12 0C12 6.5 9.4 11 5 13.4C2.4 14.8 2.6 16 5.2 16H12Z" />
        </svg>
        <p
          className={cn(
            "break-keep py-1.5",
            command && "font-mono text-[12px]",
          )}
        >
          {command ? text : `“${text}”`}
        </p>
        <CopyButton
          className="shrink-0"
          label={command ? "명령 복사" : "요청 복사"}
          text={text}
        />
      </div>
    </div>
  );
}
