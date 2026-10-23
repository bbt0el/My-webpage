"use client";

import { useState } from "react";
import { fmtDate } from "./storage";
import type { DayLog } from "./types";

function isTrainingDate(d: Date): boolean {
  const day = d.getDay(); // 0 = 周日
  return day >= 1 && day <= 5;
}

function sameMonth(d: Date, y: number, m: number): boolean {
  return d.getFullYear() === y && d.getMonth() === m;
}

export default function WorkoutLog({
  logs,
  onCheckin,
}: {
  logs: DayLog[];
  onCheckin: (date: string) => void;
}) {
  const today = new Date();
  const todayStr = fmtDate(today);
  const [view, setView] = useState({
    year: today.getFullYear(),
    month: today.getMonth(),
  });

  const logByDate = new Map(logs.map((l) => [l.date, l]));

  const firstDay = new Date(view.year, view.month, 1);
  const offset = (firstDay.getDay() + 6) % 7; // 周一起始
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
  const prevDays = new Date(view.year, view.month, 0).getDate();

  const cells: { date: Date; inMonth: boolean }[] = [];
  for (let i = 0; i < 42; i++) {
    let date: Date;
    if (i < offset) {
      date = new Date(view.year, view.month - 1, prevDays - offset + 1 + i);
    } else if (i < offset + daysInMonth) {
      date = new Date(view.year, view.month, i - offset + 1);
    } else {
      date = new Date(
        view.year,
        view.month + 1,
        i - offset - daysInMonth + 1,
      );
    }
    cells.push({ date, inMonth: sameMonth(date, view.year, view.month) });
  }

  function isDone(d: Date): boolean {
    const log = logByDate.get(fmtDate(d));
    return !!log && (log.entries.length > 0 || log.checkedIn === true);
  }

  function canCheckin(d: Date): boolean {
    return isTrainingDate(d) && fmtDate(d) <= todayStr && !isDone(d);
  }

  function handleClick(d: Date) {
    if (!canCheckin(d)) return;
    const dateStr = fmtDate(d);
    if (window.confirm(`打卡：标记 ${dateStr} 为已练？`)) {
      onCheckin(dateStr);
    }
  }

  function prevMonth() {
    setView((v) =>
      v.month === 0
        ? { year: v.year - 1, month: 11 }
        : { year: v.year, month: v.month - 1 },
    );
  }

  function nextMonth() {
    setView((v) =>
      v.month === 11
        ? { year: v.year + 1, month: 0 }
        : { year: v.year, month: v.month + 1 },
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">训练日志日历</h2>
        <div className="flex items-center gap-1 text-sm">
          <button
            type="button"
            onClick={prevMonth}
            className="rounded-md px-2 py-1 hover:bg-black/[.05] dark:hover:bg-white/10"
          >
            ‹
          </button>
          <span className="min-w-20 text-center font-medium">
            {view.year}年{view.month + 1}月
          </span>
          <button
            type="button"
            onClick={nextMonth}
            className="rounded-md px-2 py-1 hover:bg-black/[.05] dark:hover:bg-white/10"
          >
            ›
          </button>
          <button
            type="button"
            onClick={() =>
              setView({ year: today.getFullYear(), month: today.getMonth() })
            }
            className="ml-1 rounded-full border border-black/10 px-2 py-0.5 text-xs text-zinc-500 hover:border-black/25 dark:border-white/15 dark:hover:border-white/30"
          >
            回到本月
          </button>
        </div>
      </div>
      <p className="mb-3 text-xs text-zinc-500">
        训练日（周一至周五）标记签到状态；点击未练的过去训练日可补签打卡，周六日为休息日。
      </p>
      <div className="rounded-2xl border border-black/[.08] p-3 dark:border-white/10">
        <div className="grid grid-cols-7 gap-1 text-center text-xs text-zinc-500">
          {["一", "二", "三", "四", "五", "六", "日"].map((w) => (
            <div key={w} className="py-1 font-medium">
              {w}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map(({ date, inMonth }, i) => {
            const dateStr = fmtDate(date);
            const isToday = dateStr === todayStr;
            const training = isTrainingDate(date);
            const done = isDone(date);
            const clickable = canCheckin(date);
            return (
              <button
                key={i}
                type="button"
                disabled={!clickable}
                onClick={() => handleClick(date)}
                title={clickable ? `点击打卡 ${dateStr}` : undefined}
                className={`relative flex flex-col items-center rounded-lg py-1.5 text-xs transition-colors ${
                  !inMonth ? "text-zinc-300 dark:text-zinc-600" : ""
                } ${isToday ? "ring-2 ring-blue-500/70" : ""} ${
                  clickable
                    ? "cursor-pointer hover:bg-black/[.06] dark:hover:bg-white/10"
                    : "cursor-default"
                } ${
                  done
                    ? "bg-emerald-500/10"
                    : training
                      ? "bg-black/[.02] dark:bg-white/[.04]"
                      : ""
                }`}
              >
                <span className="font-medium">{date.getDate()}</span>
                <span className="mt-0.5 text-[10px] leading-none">
                  {training
                    ? done
                      ? "✓ 已练"
                      : inMonth
                        ? "未练"
                        : ""
                    : inMonth
                      ? "休"
                      : ""}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-emerald-500/30" />
          已练（有记录或已签到）
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-black/[.06] dark:bg-white/10" />
          训练日未练
        </span>
        <span>休 = 休息日</span>
        <span>点击未练格子可补签</span>
      </div>
    </div>
  );
}