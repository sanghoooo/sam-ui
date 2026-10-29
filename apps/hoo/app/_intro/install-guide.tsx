import type { StaticImageData } from "next/image";
import type { ReactNode } from "react";
import { CopyCommand } from "./copy-command";
import addPlugins from "./shots/claude-app-1-add-plugins.webp";
import add from "./shots/claude-app-2-add.webp";
import added from "./shots/claude-app-3-added.webp";
import uiKit from "./shots/claude-app-4-ui-kit.webp";
import { Terminal } from "./terminal";

const MARKETPLACE = "https://github.com/sanghoooo/sam-plugins.git";

/** The Claude app's screens, in order. */
const SHOTS: { image: StaticImageData; alt: string; caption: ReactNode }[] = [
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
    image: add,
    alt: "설정의 Plugins에서 SAM UI를 연 화면, 오른쪽에 Add 버튼",
    caption: (
      <>
        <Key>SAM UI</Key>를 찾아 <Key>Add</Key>
      </>
    ),
  },
  {
    image: added,
    alt: "SAM UI가 추가되어 오른쪽 스위치가 켜진 화면",
    caption: "스위치가 켜지면 설치 완료",
  },
  {
    image: uiKit,
    alt: "입력창에 /ui-kit을 입력한 화면",
    caption: (
      <>
        입력창에 <Key>/ui-kit</Key>을 입력하거나 바로 요청
      </>
    ),
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
        <ol className="grid grid-cols-2 gap-x-3 gap-y-4 lg:grid-cols-4">
          {SHOTS.map(({ image, alt, caption }, i) => (
            <li key={image.src}>
              <a
                className="block overflow-hidden rounded-lg border border-border bg-muted transition-opacity hover:opacity-90"
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
              <p className="mt-2 flex gap-1.5 break-keep text-[12px] leading-snug text-muted-foreground">
                <span className="font-semibold text-foreground">{i + 1}</span>
                <span>{caption}</span>
              </p>
            </li>
          ))}
        </ol>
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
