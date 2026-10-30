"use client";

import BarListSection, { SECTION as BAR_LIST } from "./sections/bar-list";
import ColumnSection, { SECTION as COLUMN } from "./sections/column";
import ComboSection, { SECTION as COMBO } from "./sections/combo";
import CommonSection, { SECTION as COMMON } from "./sections/common";
import LanesSection, { SECTION as LANES } from "./sections/lanes";
import PathwaySection, { SECTION as PATHWAY } from "./sections/pathway";
import ScatterSection, { SECTION as SCATTER } from "./sections/scatter";
import ShareSection, { SECTION as SHARE } from "./sections/share";
import SparklineSection, { SECTION as SPARKLINE } from "./sections/sparkline";
import StackedSection, { SECTION as STACKED } from "./sections/stacked";
import StagedPathwaySection, {
  SECTION as STAGED_PATHWAY,
} from "./sections/staged-pathway";
import TrendSection, { SECTION as TREND } from "./sections/trend";

/**
 * Every chart kind in components/charts, one section file each, in the order the kit's reference documents them.
 * The jump pills at the top come from the same list, so a section and its pill can never drift apart.
 */
const SECTIONS = [
  { meta: TREND, Section: TrendSection },
  { meta: COLUMN, Section: ColumnSection },
  { meta: STACKED, Section: StackedSection },
  { meta: COMBO, Section: ComboSection },
  { meta: SHARE, Section: ShareSection },
  { meta: BAR_LIST, Section: BarListSection },
  { meta: SPARKLINE, Section: SparklineSection },
  { meta: SCATTER, Section: ScatterSection },
  { meta: PATHWAY, Section: PathwaySection },
  { meta: STAGED_PATHWAY, Section: StagedPathwaySection },
  { meta: LANES, Section: LanesSection },
  { meta: COMMON, Section: CommonSection },
];

/** Every chart kind with its variants, for checking both themes; built like the palette. */
export function ChartsDemo() {
  return (
    <div className="space-y-4">
      <nav aria-label="차트 목차" className="flex flex-wrap gap-1.5">
        {SECTIONS.map(({ meta }) => (
          <a
            className="rounded-full border border-border bg-card px-3 py-1 text-[12px] text-muted-foreground transition-colors hover:text-foreground"
            href={`#${meta.id}`}
            key={meta.id}
          >
            {meta.short}
          </a>
        ))}
      </nav>
      {SECTIONS.map(({ meta, Section }) => (
        <Section key={meta.id} />
      ))}
    </div>
  );
}
