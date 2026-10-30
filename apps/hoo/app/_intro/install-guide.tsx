"use client";

import { type ReactNode, useState } from "react";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { ClaudeIcon, CodexIcon, GeminiIcon } from "./agent-icons";
import { CopyCommand } from "./copy-command";
import { ScreenSwiper, type Slide } from "./screen-swiper";
import addPlugins from "./shots/claude-app-1-add-plugins.webp";
import search from "./shots/claude-app-2-search.webp";
import add from "./shots/claude-app-3-add.webp";
import added from "./shots/claude-app-4-added.webp";
import { Terminal } from "./terminal";

const MARKETPLACE = "https://github.com/sanghoooo/sam-plugins.git";
/** Codex adds a GitHub marketplace by owner/repo. */
const CODEX_MARKETPLACE = "sanghoooo/sam-plugins";
const REPO = "https://github.com/sanghoooo/sam-ui.git";

/** The agents the plugin installs in, each with its mark. */
const AGENTS = [
  { icon: <ClaudeIcon />, label: "Claude", value: "claude" },
  { icon: <CodexIcon />, label: "Codex", value: "codex" },
  { icon: <GeminiIcon />, label: "Gemini", value: "gemini" },
] as const;
type Agent = (typeof AGENTS)[number]["value"];

/** The Claude app's screens, in order. */
const SHOTS: Slide[] = [
  {
    image: addPlugins,
    alt: "입력창 옆 + 메뉴에서 Add plugins를 고른 화면",
    caption: (
      <>
        입력창 옆 <Key>+</Key> → <Key>Add plugins</Key>
      </>
    ),
  },
  {
    image: search,
    alt: "설정의 Plugins에서 sam-ui를 검색해 SAM UI가 보이는 화면",
    caption: (
      <>
        Plugins에서 <Key>sam-ui</Key> 검색
      </>
    ),
  },
  {
    image: add,
    alt: "SAM UI를 연 화면, 오른쪽에 Add 버튼",
    caption: (
      <>
        <Key>SAM UI</Key>를 열어 <Key>Add</Key>
      </>
    ),
  },
  {
    image: added,
    alt: "SAM UI가 추가되어 오른쪽 스위치가 켜지고 설치 완료 알림이 뜬 화면",
    caption: "스위치가 켜지면 설치 완료",
  },
];

/**
 * How to install the plugin, any one way being enough, under a Claude / Codex / Gemini choice. Claude has two ways:
 * Claude Code (its slash commands, in a terminal) and the Claude app (its screens). The app adds plugins from its
 * menu but has no screen for adding a marketplace, so when sam-plugins isn't listed that one step runs in a terminal.
 * Codex takes two shell commands, which serve its CLI and the ChatGPT desktop app alike (the app has no /plugins).
 * Gemini CLI installs the skill directly from this repository with `gemini skills install --path`.
 */
export function InstallGuide() {
  const [agent, setAgent] = useState<Agent>("claude");
  return (
    <div className="space-y-5">
      <SegmentedControl
        label="설치할 곳"
        onValueChange={setAgent}
        options={AGENTS}
        value={agent}
      />
      {agent === "claude" ? (
        <div className="space-y-6">
          <Way title="Claude Code에서">
            <p className="mb-3 break-keep text-[13px] text-muted-foreground">
              입력창에 두 명령을 차례로 입력합니다.
            </p>
            <Terminal
              lines={[
                `/plugin marketplace add ${MARKETPLACE}`,
                "/plugin install sam-ui@sam-plugins",
              ]}
            />
          </Way>
          <Or />
          <Way title="Claude 앱에서">
            <ScreenSwiper label="Claude 앱 설치 화면" slides={SHOTS} />
            <p className="mt-5 break-keep text-[12px] text-muted-foreground">
              목록에 SAM UI가 없으면 터미널에서 마켓플레이스를 먼저 등록합니다.
            </p>
            <div className="mt-1.5">
              <CopyCommand
                lines={[`claude plugin marketplace add ${MARKETPLACE}`]}
              />
            </div>
          </Way>
        </div>
      ) : agent === "codex" ? (
        <div>
          <p className="mb-3 break-keep text-[13px] text-muted-foreground">
            터미널에서 두 명령을 차례로 실행한 뒤 Codex 새 세션을 시작합니다.
          </p>
          <Terminal
            lines={[
              `codex plugin marketplace add ${CODEX_MARKETPLACE}`,
              "codex plugin add sam-ui@sam-plugins",
            ]}
            title="terminal"
          />
          <p className="mt-2 break-keep text-[12px] text-muted-foreground">
            Codex CLI와 ChatGPT 데스크톱 앱 모두 이 명령으로 설치되고, IDE
            확장은 플러그인을 지원하지 않습니다. 둘째 명령을 다시 실행하면 최신
            버전으로 바뀝니다.
          </p>
        </div>
      ) : (
        <div>
          <p className="mb-3 break-keep text-[13px] text-muted-foreground">
            터미널에서 명령을 실행한 뒤 Gemini CLI 새 세션을 시작합니다(열려
            있는 세션에서는 <Key>/skills reload</Key>).
          </p>
          <Terminal
            lines={[
              `gemini skills install ${REPO} --path plugins/sam-ui/skills/sam-ui-kit`,
            ]}
            title="terminal"
          />
          <p className="mt-2 break-keep text-[12px] text-muted-foreground">
            같은 명령을 다시 실행하면 최신 버전으로 바뀝니다.
          </p>
        </div>
      )}
    </div>
  );
}

/** The line between the two ways, saying either one is enough. */
function Or() {
  return (
    <div className="flex items-center gap-3">
      <span className="h-px flex-1 bg-border" />
      <span className="text-[12px] font-semibold text-muted-foreground">
        또는
      </span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

/** One place to install from: its name, then how. */
function Way({
  title,
  className,
  children,
}: {
  title: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <h4 className="mb-2 text-[13px] font-semibold">{title}</h4>
      {children}
    </div>
  );
}

/** A button or name in the app, as it reads on screen. */
function Key({ children }: { children: string }) {
  return <strong className="font-semibold text-foreground">{children}</strong>;
}
