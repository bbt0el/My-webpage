"use client";

import { fmtDate } from "./storage";
import type { DayLog } from "./types";

const WEEK_LABELS = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];

function summarize(entries: { exercise: string }[]): string[] {
  const map = new Map<string, number>();
  for (const e of entries) {
    map.set(e.exercise, (map.get(e.exercise) ?? 0) + 1);
  }
  return [...map.entries()].map(([name, count]) => `${name} ×${count}组`);
}

export default function WeekLog({ logs }: { logs: DayLog[] }) {
  const now = new Date();
  const todayStr = fmtDate(now);
  const dow = now.getDay(); // 0 = 周日
  const mondayOffset = (dow + 6) % 7; // 距本周一的天数
  const monday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - mondayOffset,
  );

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(
      monday.getFullYear(),
      monday.getMonth(),
      monday.getDate() + i,
    );
    return { label: WEEK_LABELS[i], date: fmtDate(d) };
  });

  const logByDate = new Map(logs.map((l) => [l.date, l]));

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">本周训练日志</h2>
        <span className="text-xs text-zinc-500">
          {days[0].date} ~ {days[6].date}
        </span>
      </div>
      <div className="overflow-hidden rounded-2xl border border-black/[.08] dark:border-white/10">
        <ul className="divide-y divide-black/[.06] dark:divide-white/[.07]">
          {days.map((day) => {
            const log = logByDate.get(day.date);
            const isToday = day.date === todayStr;
            const isRest =
              day.label === "周六" || day.label === "周日";
            return (
              <li
                key={day.date}
                className={`flex items-start gap-3 px-4 py-3 ${
                  isToday ? "bg-black/[.03] dark:bg-white/[.05]" : ""
                }`}
              >
                <div className="w-12 shrink-0">
                  <p className="text-sm font-semibold">{day.label}</p>
                  <p className="text-xs text-zinc-500">{day.date.slice(5)}</p>
                </div>
                <div className="flex-1">
                  {isRest ? (
                    <span className="text-sm text-zinc-400">休息日</span>
                  ) : log && (log.entries.length > 0 || log.checkedIn === true) ? (
                    <div className="text-sm">
                      <span className="font-medium text-emerald-600 dark:text-emerald-400">
                        已练
                      </span>
                      <p className="mt-1 text-xs leading-5 text-zinc-600 dark:text-zinc-400">
                        {summarize(log.entries).join("、")}
                      </p>
                    </div>
                  ) : (
                    <span className="text-sm text-zinc-400">未练</span>
                  )}
                </div>
                {isToday && (
                  <span className="shrink-0 rounded-full bg-black/[.06] px-2 py-0.5 text-xs dark:bg-white/10">
                    今天
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}