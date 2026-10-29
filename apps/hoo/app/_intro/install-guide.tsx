import type { ReactNode } from "react";
import { CopyCommand } from "./copy-command";
import { ScreenSwiper, type Slide } from "./screen-swiper";
import addPlugins from "./shots/claude-app-1-add-plugins.webp";
import search from "./shots/claude-app-2-search.webp";
import add from "./shots/claude-app-3-add.webp";
import added from "./shots/claude-app-4-added.webp";
import { Terminal } from "./terminal";

const MARKETPLACE = "https://github.com/sanghoooo/sam-plugins.git";

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
 * How to install the plugin, either way being enough: in Claude Code (its slash commands, in a terminal) and in the
 * Claude app (its screens). The app adds plugins from its menu but has no screen for adding a marketplace,
 * so when sam-plugins isn't listed that one step runs in a terminal.
 */
export function InstallGuide() {
  return (
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
