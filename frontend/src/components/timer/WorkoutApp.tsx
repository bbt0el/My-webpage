"use client";

import { useCallback, useEffect, useState } from "react";
import { DAY_KEYS, DEFAULT_PLAN } from "./defaultPlan";
import { fmtDate, loadLogs, loadPlan, saveLogs, savePlan } from "./storage";
import RestTimer from "./RestTimer";
import WeekLog from "./WeekLog";
import WorkoutCalendar from "./WorkoutCalendar";
import WorkoutLog from "./WorkoutLog";
import type { DayKey, DayLog, PlanMap } from "./types";

function todayKey(): DayKey | null {
  const d = new Date().getDay(); // 0 = 周日
  if (d === 0 || d === 6) return null;
  return DAY_KEYS[d - 1];
}

export default function WorkoutApp() {
  const [plan, setPlan] = useState<PlanMap>(DEFAULT_PLAN);
  const [logs, setLogs] = useState<DayLog[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setPlan(loadPlan());
    setLogs(loadLogs());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) savePlan(plan);
  }, [plan, hydrated]);

  useEffect(() => {
    if (hydrated) saveLogs(logs);
  }, [logs, hydrated]);

  const handlePlanChange = useCallback((next: PlanMap) => {
    setPlan(next);
  }, []);

  const handleSetDone = useCallback(
    (exercise: string, setIndex: number) => {
      const now = new Date();
      const time = `${String(now.getHours()).padStart(2, "0")}:${String(
        now.getMinutes(),
      ).padStart(2, "0")}`;
      const date = fmtDate(now);
      setLogs((prev) => {
        const entry = { exercise, setIndex, time };
        const idx = prev.findIndex((l) => l.date === date);
        if (idx < 0) return [...prev, { date, entries: [entry] }];
        return prev.map((l, i) =>
          i === idx ? { ...l, entries: [...l.entries, entry] } : l,
        );
      });
    },
    [],
  );

  // 签到打卡（周三骑行 / 日历补签）：默认今天，可指定日期
  const handleCheckin = useCallback((date?: string) => {
    const target = date ?? fmtDate(new Date());
    setLogs((prev) => {
      const idx = prev.findIndex((l) => l.date === target);
      if (idx < 0) return [...prev, { date: target, entries: [], checkedIn: true }];
      return prev.map((l, i) =>
        i === idx ? { ...l, checkedIn: true } : l,
      );
    });
  }, []);

  const today = todayKey();
  const todayPlan = today ? plan[today] : null;
  const todayStr = fmtDate(new Date());
  const todayLog = logs.find((l) => l.date === todayStr);
  const checkedInToday = todayLog?.checkedIn === true;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">健身计时</h1>
      <p className="mt-2 text-sm text-zinc-500">
        训练日历 · 间歇计时 · 训练日志。所有数据保存在浏览器本地。
      </p>

      <section className="mt-8">
        <WorkoutCalendar plan={plan} onChangePlan={handlePlanChange} />
      </section>

      <section className="mt-10">
        <RestTimer
          plan={todayPlan}
          checkedInToday={checkedInToday}
          onSetDone={handleSetDone}
          onCheckin={() => handleCheckin()}
        />
      </section>

      <section className="mt-10">
        <WorkoutLog logs={logs} onCheckin={handleCheckin} />
      </section>

      <section className="mt-10">
        <WeekLog logs={logs} />
      </section>
    </div>
  );
}