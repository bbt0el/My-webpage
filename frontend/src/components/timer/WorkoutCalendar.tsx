"use client";

import { useEffect, useRef, useState } from "react";
import { DAY_KEYS, DEFAULT_PLAN } from "./defaultPlan";
import type { DayKey, PlanMap } from "./types";

interface Props {
  plan: PlanMap;
  onChangePlan: (next: PlanMap) => void;
}

function TextCell({
  initial,
  placeholder,
  onCommit,
}: {
  initial: string;
  placeholder: string;
  onCommit: (value: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(initial);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) ref.current?.focus();
  }, [editing]);

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => {
          setValue(initial);
          setEditing(true);
        }}
        className="block w-full min-w-24 rounded-md px-2 py-1.5 text-left text-sm hover:bg-black/[.04] dark:hover:bg-white/10"
        title="点击编辑"
      >
        {initial.trim() ? (
          <span className="font-medium text-zinc-800 dark:text-zinc-100">
            {initial}
          </span>
        ) : (
          <span className="text-zinc-400">{placeholder}</span>
        )}
      </button>
    );
  }

  return (
    <input
      ref={ref}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => {
        setEditing(false);
        onCommit(value.trim());
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          setEditing(false);
          onCommit(value.trim());
        } else if (e.key === "Escape") {
          setEditing(false);
        }
      }}
      className="w-full min-w-24 rounded-md border border-black/20 bg-white px-2 py-1.5 text-sm dark:border-white/25 dark:bg-black"
    />
  );
}

function SetsCell({
  initial,
  onCommit,
}: {
  initial: number;
  onCommit: (sets: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(initial));
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) ref.current?.focus();
  }, [editing]);

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => {
          setValue(String(initial));
          setEditing(true);
        }}
        className="whitespace-nowrap rounded-md px-2 py-1.5 text-sm text-zinc-500 hover:bg-black/[.04] dark:hover:bg-white/10"
        title="点击修改组数"
      >
        ×{initial}
      </button>
    );
  }

  return (
    <input
      ref={ref}
      type="number"
      min={1}
      max={99}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => {
        setEditing(false);
        const n = parseInt(value, 10);
        onCommit(Number.isFinite(n) && n > 0 ? Math.min(99, n) : 1);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          setEditing(false);
          const n = parseInt(value, 10);
          onCommit(Number.isFinite(n) && n > 0 ? Math.min(99, n) : 1);
        } else if (e.key === "Escape") {
          setEditing(false);
        }
      }}
      className="w-16 rounded-md border border-black/20 bg-white px-2 py-1.5 text-center text-sm dark:border-white/25 dark:bg-black"
    />
  );
}

export default function WorkoutCalendar({ plan, onChangePlan }: Props) {
  function updateExercise(
    day: DayKey,
    index: number,
    patch: { name?: string; sets?: number },
  ) {
    const next: PlanMap = {
      ...plan,
      [day]: {
        ...plan[day],
        exercises: plan[day].exercises.map((ex, i) =>
          i === index ? { ...ex, ...patch } : ex,
        ),
      },
    };
    onChangePlan(next);
  }

  function updateFocus(day: DayKey, focus: string) {
    onChangePlan({ ...plan, [day]: { ...plan[day], focus } });
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">训练日历</h2>
        <button
          type="button"
          onClick={() => onChangePlan(structuredClone(DEFAULT_PLAN))}
          className="rounded-full border border-black/10 px-3 py-1.5 text-xs text-zinc-600 transition-colors hover:border-black/25 hover:text-black dark:border-white/15 dark:text-zinc-300 dark:hover:border-white/30 dark:hover:text-white"
        >
          重置为默认计划
        </button>
      </div>
      <p className="mb-3 text-xs text-zinc-500">
        点击部位、动作名或组数即可修改，按回车或点击空白处保存，清空动作名表示未安排。
      </p>
      <div className="overflow-x-auto rounded-2xl border border-black/[.08] dark:border-white/10">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-black/[.08] bg-black/[.02] text-xs text-zinc-500 dark:border-white/10 dark:bg-white/[.03]">
              <th className="px-3 py-2 font-medium">星期</th>
              <th className="px-3 py-2 font-medium">部位</th>
              {[1, 2, 3, 4, 5].map((n) => (
                <th key={n} className="px-3 py-2 font-medium">
                  动作{n}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DAY_KEYS.map((day) => (
              <tr
                key={day}
                className="border-b border-black/[.06] last:border-b-0 dark:border-white/[.07]"
              >
                <td className="whitespace-nowrap px-3 py-2 text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                  {plan[day].label}
                </td>
                <td className="px-1 py-2">
                  <TextCell
                    initial={plan[day].focus}
                    placeholder="部位"
                    onCommit={(v) => updateFocus(day, v || "训练")}
                  />
                </td>
                {[0, 1, 2, 3, 4].map((i) => {
                  const ex = plan[day].exercises[i];
                  return (
                    <td key={i} className="px-1 py-2">
                      <div className="flex items-center gap-1">
                        <TextCell
                          initial={ex?.name ?? ""}
                          placeholder="未安排"
                          onCommit={(v) => updateExercise(day, i, { name: v })}
                        />
                        <SetsCell
                          initial={ex?.sets ?? 1}
                          onCommit={(v) => updateExercise(day, i, { sets: v })}
                        />
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}