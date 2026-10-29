"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useId } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Select } from "./select";

/** Moves a "YYYY-MM" month by delta months. Plain arithmetic, so server and browser agree. */
export function addMonths(month: string, delta: number) {
  const [year, monthNumber] = month.split("-").map(Number);
  const index = year * 12 + (monthNumber - 1) + delta;
  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, "0")}`;
}

/** Months from max back to min, newest first. */
function monthsBetween(min: string, max: string) {
  const months: string[] = [];
  for (let month = max; month >= min; month = addMonths(month, -1)) {
    months.push(month);
  }
  return months;
}

type MonthStepperProps = {
  label?: string;
  /** "YYYY-MM", between min and max. */
  value: string;
  min: string;
  max: string;
  onValueChange: (month: string) => void;
  className?: string;
};

/** ◀ 기준월 [YYYY-MM] ▶: a month select with previous/next buttons. */
export function MonthStepper({
  label = "기준월",
  value,
  min,
  max,
  onValueChange,
  className,
}: MonthStepperProps) {
  const id = useId();
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        aria-label="이전 달"
        className="rounded-full"
        disabled={value <= min}
        onClick={() => onValueChange(addMonths(value, -1))}
        size="icon-sm"
      >
        <ChevronLeft />
      </Button>
      <label
        className="text-[12px] font-medium text-muted-foreground"
        htmlFor={id}
      >
        {label}
      </label>
      <Select
        className="w-28"
        id={id}
        onChange={(event) => onValueChange(event.target.value)}
        value={value}
      >
        {monthsBetween(min, max).map((month) => (
          <option key={month} value={month}>
            {month}
          </option>
        ))}
      </Select>
      <Button
        aria-label="다음 달"
        className="rounded-full"
        disabled={value >= max}
        onClick={() => onValueChange(addMonths(value, 1))}
        size="icon-sm"
      >
        <ChevronRight />
      </Button>
    </div>
  );
}
