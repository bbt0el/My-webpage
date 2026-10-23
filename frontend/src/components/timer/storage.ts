import { DEFAULT_PLAN, DAY_KEYS } from "./defaultPlan";
import type { DayKey, DayLog, PlanMap, TimerSession } from "./types";

const PLAN_KEY = "czx.workout.plan.v1";
const LOGS_KEY = "czx.workout.logs.v1";
const SESSION_KEY = "czx.workout.session.v1";

/** 本地日期 YYYY-MM-DD（避免时区偏移） */
export function fmtDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function loadPlan(): PlanMap {
  try {
    const raw = localStorage.getItem(PLAN_KEY);
    if (!raw) return structuredClone(DEFAULT_PLAN);
    const parsed = JSON.parse(raw) as Partial<PlanMap>;
    const result: PlanMap = structuredClone(DEFAULT_PLAN);
    for (const key of DAY_KEYS) {
      const src = parsed[key];
      if (
        src &&
        typeof src.label === "string" &&
        typeof src.focus === "string" &&
        Array.isArray(src.exercises)
      ) {
        result[key] = {
          label: src.label,
          focus: src.focus,
          exercises: src.exercises.slice(0, 5).map((e: unknown) => {
            const ex = e as { name?: unknown; sets?: unknown };
            return {
              name: typeof ex?.name === "string" ? ex.name : "",
              sets:
                typeof ex?.sets === "number" && ex.sets > 0
                  ? Math.round(ex.sets)
                  : 1,
            };
          }),
        };
      }
    }
    return result;
  } catch {
    return structuredClone(DEFAULT_PLAN);
  }
}

export function savePlan(plan: PlanMap): void {
  try {
    localStorage.setItem(PLAN_KEY, JSON.stringify(plan));
  } catch {
    // 存储不可用时静默失败，不影响训练计时
  }
}

export function loadLogs(): DayLog[] {
  try {
    const raw = localStorage.getItem(LOGS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (l): l is DayLog =>
        !!l &&
        typeof (l as DayLog).date === "string" &&
        Array.isArray((l as DayLog).entries),
    );
  } catch {
    return [];
  }
}

export function saveLogs(logs: DayLog[]): void {
  try {
    localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
  } catch {
    // 忽略
  }
}

export function loadSession(): TimerSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Partial<TimerSession>;
    if (typeof s.exerciseIndex !== "number") return null;
    return {
      exerciseIndex: Math.max(0, Math.floor(s.exerciseIndex)),
      doneSets: typeof s.doneSets === "number" ? Math.max(0, Math.floor(s.doneSets)) : 0,
      allDone: s.allDone === true,
      targetSeconds: typeof s.targetSeconds === "number" ? s.targetSeconds : 60,
    };
  } catch {
    return null;
  }
}

export function saveSession(session: TimerSession): void {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    // 忽略
  }
}