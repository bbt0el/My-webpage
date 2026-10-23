"use client";

import { useEffect, useRef, useState } from "react";
import { loadSession, saveSession } from "./storage";
import type { DayPlan } from "./types";

const REST_OPTIONS = [30, 45, 60, 90, 120];
const DEFAULT_TARGET = 60;
const COMMIT_SECONDS = 15;
const LONG_PRESS_MS = 500;
const TRIPLE_TAP_WINDOW = 800;

function fmtClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

function beep() {
  try {
    const ctx = new AudioContext();
    for (let i = 0; i < 3; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = 880;
      const t0 = ctx.currentTime + i * 0.35;
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(0.25, t0 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.3);
      osc.start(t0);
      osc.stop(t0 + 0.31);
    }
  } catch {
    // 浏览器限制播放时忽略
  }
}

function Clock({ target, elapsed }: { target: number; elapsed: number }) {
  const remaining = Math.max(0, target - elapsed);
  const overdue = Math.max(0, elapsed - target);
  const progress = target > 0 ? Math.min(1, remaining / target) : 0;

  const cx = 100;
  const cy = 100;
  const rad = (deg: number) => ((deg - 90) * Math.PI) / 180;
  const secAngle = (elapsed % 60) * 6;
  const minAngle = (remaining / 60) * 6;

  const ticks = [];
  for (let i = 0; i < 60; i++) {
    const major = i % 5 === 0;
    const a = rad(i * 6);
    const r1 = major ? 76 : 83;
    ticks.push(
      <line
        key={i}
        x1={cx + r1 * Math.cos(a)}
        y1={cy + r1 * Math.sin(a)}
        x2={cx + 90 * Math.cos(a)}
        y2={cy + 90 * Math.sin(a)}
        stroke="currentColor"
        strokeWidth={major ? 2.2 : 0.9}
        strokeLinecap="round"
        opacity={major ? 0.85 : 0.45}
      />,
    );
  }

  const numbers = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((n, i) => {
    const a = rad(i * 30);
    return (
      <text
        key={n}
        x={cx + 66 * Math.cos(a)}
        y={cy + 66 * Math.sin(a)}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={12}
        fill="currentColor"
        opacity={0.7}
      >
        {n}
      </text>
    );
  });

  const circumference = 2 * Math.PI * 70;
  const ringColor =
    overdue > 0 ? "#ef4444" : progress < 0.3 ? "#f59e0b" : "#22c55e";

  return (
    <div className="relative inline-block">
      <svg
        viewBox="0 0 200 200"
        className={`h-64 w-64 ${overdue > 0 ? "text-red-500" : "text-zinc-800 dark:text-zinc-100"}`}
      >
        <circle
          cx={cx}
          cy={cy}
          r={93}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          opacity={0.25}
        />
        <circle
          cx={cx}
          cy={cy}
          r={70}
          fill="none"
          stroke={ringColor}
          strokeWidth={6}
          opacity={0.15}
        />
        <circle
          cx={cx}
          cy={cy}
          r={70}
          fill="none"
          stroke={ringColor}
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={circumference * (1 - progress)}
          transform="rotate(-90 100 100)"
          opacity={0.95}
        />
        {ticks}
        {numbers}
        <line
          x1={cx}
          y1={cy}
          x2={cx + 42 * Math.cos(rad(minAngle))}
          y2={cy + 42 * Math.sin(rad(minAngle))}
          stroke="currentColor"
          strokeWidth={3.5}
          strokeLinecap="round"
          opacity={0.85}
        />
        <line
          x1={cx}
          y1={cy}
          x2={cx + 62 * Math.cos(rad(secAngle))}
          y2={cy + 62 * Math.sin(rad(secAngle))}
          stroke="#ef4444"
          strokeWidth={1.8}
          strokeLinecap="round"
        />
        <circle cx={cx} cy={cy} r={4.2} fill="currentColor" />
        <circle cx={cx} cy={cy} r={1.8} fill="#ef4444" />
      </svg>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center pb-7">
        <span
          className={`font-mono text-3xl font-bold tabular-nums ${
            overdue > 0 ? "text-red-500" : "text-zinc-900 dark:text-zinc-50"
          }`}
        >
          {overdue > 0 ? `+${fmtClock(overdue)}` : fmtClock(remaining)}
        </span>
      </div>
    </div>
  );
}

interface Props {
  plan: DayPlan | null;
  checkedInToday: boolean;
  onSetDone: (exercise: string, setIndex: number) => void;
  onCheckin: () => void;
}

export default function RestTimer({
  plan,
  checkedInToday,
  onSetDone,
  onCheckin,
}: Props) {
  const isCheckin = plan?.mode === "checkin";
  const exercises = (plan?.exercises ?? []).filter(
    (e) => e.name.trim() !== "",
  );

  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [doneSets, setDoneSets] = useState(0);
  const [allDone, setAllDone] = useState(false);
  const [target, setTarget] = useState(DEFAULT_TARGET);
  const [phase, setPhase] = useState<"idle" | "resting" | "paused">("idle");
  const [elapsed, setElapsed] = useState(0);
  const [fired, setFired] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [committed, setCommitted] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const pendingRef = useRef<{ exercise: string; setIndex: number } | null>(
    null,
  );
  const snapRef = useRef<{ exerciseIndex: number; doneSets: number } | null>(
    null,
  );

  useEffect(() => {
    const s = loadSession();
    if (s) {
      setExerciseIndex(s.exerciseIndex);
      setDoneSets(s.doneSets);
      setAllDone(s.allDone);
      setTarget(s.targetSeconds);
    }
  }, []);

  useEffect(() => {
    saveSession({ exerciseIndex, doneSets, allDone, targetSeconds: target });
  }, [exerciseIndex, doneSets, allDone, target]);

  const safeIndex =
    exercises.length > 0
      ? Math.min(exerciseIndex, exercises.length - 1)
      : 0;
  const current = exercises[safeIndex];

  useEffect(() => {
    if (phase !== "resting") return;
    const id = window.setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => window.clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (phase !== "resting") return;
    if (!fired && elapsed >= target) {
      setFired(true);
      setShowAlert(true);
      beep();
    }
    if (!committed && elapsed >= COMMIT_SECONDS && pendingRef.current) {
      setCommitted(true);
      onSetDone(pendingRef.current.exercise, pendingRef.current.setIndex);
      pendingRef.current = null;
    }
  }, [elapsed, fired, committed, phase, target, onSetDone]);

  useEffect(() => {
    if (phase === "resting" && fired && elapsed < target) {
      setFired(false);
    }
  }, [elapsed, target, fired, phase]);

  function startRest() {
    if (phase !== "idle" || !current) return;
    const newDone = doneSets + 1;
    snapRef.current = { exerciseIndex: safeIndex, doneSets };
    pendingRef.current = { exercise: current.name, setIndex: newDone };
    setDoneSets(newDone);
    if (newDone >= current.sets) {
      const nextIndex = safeIndex + 1;
      if (nextIndex >= exercises.length) {
        setAllDone(true);
        setNotice("今日训练完成！");
      } else {
        setExerciseIndex(nextIndex);
        setDoneSets(0);
        setNotice(`已切换下一动作：${exercises[nextIndex].name}`);
      }
    }
    setPhase("resting");
    setElapsed(0);
    setFired(false);
    setCommitted(false);
    setShowAlert(false);
  }

  function cancelSet() {
    const snap = snapRef.current;
    if (snap) {
      setExerciseIndex(snap.exerciseIndex);
      setDoneSets(snap.doneSets);
    }
    setAllDone(false);
    setPhase("idle");
    setElapsed(0);
    setFired(false);
    setCommitted(false);
    setShowAlert(false);
    setNotice("本组未计入（间歇不足15秒）");
    pendingRef.current = null;
    snapRef.current = null;
  }

  function finishRest() {
    setPhase("idle");
    setElapsed(0);
    setFired(false);
    setCommitted(false);
    setShowAlert(false);
    snapRef.current = null;
  }

  function togglePause() {
    setPhase((p) =>
      p === "resting" ? "paused" : p === "paused" ? "resting" : p,
    );
  }

  function addTime(sec: number) {
    setTarget((t) => t + sec);
  }

  function decreaseSet() {
    if (phase !== "idle" || allDone) return;
    setDoneSets((d) => Math.max(0, d - 1));
    setNotice("已扣除一组");
  }

  function resetAll() {
    setExerciseIndex(0);
    setDoneSets(0);
    setAllDone(false);
    setPhase("idle");
    setElapsed(0);
    setFired(false);
    setCommitted(false);
    setShowAlert(false);
    setNotice(null);
    pendingRef.current = null;
    snapRef.current = null;
  }

  // ---- 空格键控制 ----
  const phaseRef = useRef(phase);
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const actionsRef = useRef({
    startRest,
    finishRest,
    togglePause,
    addTime,
  });
  actionsRef.current = { startRest, finishRest, togglePause, addTime };

  const spaceDownRef = useRef(false);
  const pressStartRef = useRef(0);
  const longPressTimerRef = useRef<number | null>(null);
  const tapsRef = useRef<number[]>([]);

  useEffect(() => {
    if (plan?.mode === "checkin") return;
    const isTypingTarget = (t: EventTarget | null) => {
      const el = t as HTMLElement | null;
      return (
        !!el &&
        (el.tagName === "INPUT" ||
          el.tagName === "TEXTAREA" ||
          el.isContentEditable)
      );
    };

    function onKeyDown(e: KeyboardEvent) {
      if (e.code !== "Space") return;
      if (isTypingTarget(e.target)) return;
      e.preventDefault();
      if (spaceDownRef.current) return; // 忽略按住重复触发
      spaceDownRef.current = true;
      pressStartRef.current = Date.now();
      longPressTimerRef.current = window.setTimeout(() => {
        // 长按：提前结束间歇
        if (
          phaseRef.current === "resting" ||
          phaseRef.current === "paused"
        ) {
          actionsRef.current.finishRest();
        }
        spaceDownRef.current = false;
        longPressTimerRef.current = null;
      }, LONG_PRESS_MS);
    }

    function onKeyUp(e: KeyboardEvent) {
      if (e.code !== "Space") return;
      if (longPressTimerRef.current !== null) {
        window.clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      if (!spaceDownRef.current) return; // 长按已处理
      spaceDownRef.current = false;
      const held = Date.now() - pressStartRef.current;
      if (held >= LONG_PRESS_MS) return;

      if (phaseRef.current === "idle") {
        actionsRef.current.startRest();
      } else {
        // resting / paused：三连击延时 15s，否则暂停/继续
        const now = Date.now();
        tapsRef.current.push(now);
        while (
          tapsRef.current.length &&
          now - tapsRef.current[0] > TRIPLE_TAP_WINDOW
        ) {
          tapsRef.current.shift();
        }
        if (tapsRef.current.length >= 3) {
          tapsRef.current = [];
          actionsRef.current.addTime(15);
          setNotice("空格三连击：已延时 15 秒");
        } else {
          actionsRef.current.togglePause();
        }
      }
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      if (longPressTimerRef.current !== null) {
        window.clearTimeout(longPressTimerRef.current);
      }
    };
  }, [plan?.mode]);

  if (!plan) {
    return (
      <div>
        <h2 className="mb-3 text-lg font-semibold">今日训练</h2>
        <p className="rounded-2xl border border-dashed border-black/10 p-6 text-center text-sm text-zinc-500 dark:border-white/10">
          今天是休息日（训练计划仅覆盖周一至周五），周六日没有安排。
        </p>
      </div>
    );
  }

  const title = (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-lg font-semibold">
        {isCheckin ? "今日训练（签到）" : "间歇计时器"}
      </h2>
      <span className="rounded-full bg-black/[.06] px-3 py-1 text-xs font-medium dark:bg-white/10">
        {plan.label} · {plan.focus}
      </span>
    </div>
  );

  if (isCheckin) {
    return (
      <div>
        {title}
        <div className="flex flex-col items-center rounded-2xl border border-black/[.08] px-4 py-10 dark:border-white/10">
          {checkedInToday ? (
            <>
              <p className="text-2xl font-semibold">今日已签到</p>
              <p className="mt-2 text-sm text-zinc-500">
                {plan.focus}完成，练得不错。
              </p>
              <span className="mt-5 rounded-full bg-emerald-500/15 px-4 py-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                ✓ 已打卡
              </span>
            </>
          ) : (
            <>
              <p className="text-lg font-medium">{plan.focus}</p>
              <p className="mt-2 text-sm text-zinc-500">
                有氧骑行无需间歇计时，练完签到即算完成。
              </p>
              <button
                type="button"
                onClick={onCheckin}
                className="mt-6 rounded-full bg-black px-8 py-3 text-base font-medium text-white transition-opacity hover:opacity-85 dark:bg-white dark:text-black"
              >
                完成骑行 · 签到打卡
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      {title}
      <div className="flex flex-col items-center rounded-2xl border border-black/[.08] px-4 py-8 dark:border-white/10">
        {allDone ? (
          <div className="flex flex-col items-center gap-4 py-6">
            <p className="text-2xl font-semibold">今日训练完成！</p>
            <p className="text-sm text-zinc-500">
              所有动作的目标组数都已达成，好好休息。
            </p>
            <button
              type="button"
              onClick={resetAll}
              className="mt-2 rounded-full bg-black px-5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-80 dark:bg-white dark:text-black"
            >
              重新开始今日训练
            </button>
          </div>
        ) : exercises.length === 0 ? (
          <p className="py-6 text-sm text-zinc-500">
            今天还没有安排动作，请在上方日历中添加。
          </p>
        ) : (
          <>
            <div className="mb-2 flex items-center gap-2">
              <span className="text-lg font-medium">{current.name}</span>
              <span className="text-sm text-zinc-500">
                已完成 {doneSets}/{current.sets} 组 · 下一组 {doneSets + 1}
              </span>
            </div>

            <Clock target={target} elapsed={elapsed} />

            <div className="mt-6 flex flex-col items-center gap-4">
              {phase === "idle" ? (
                <>
                  <div className="flex items-center gap-1.5 text-sm">
                    <span className="text-zinc-500">间歇时长</span>
                    {REST_OPTIONS.map((o) => (
                      <button
                        key={o}
                        type="button"
                        onClick={() => setTarget(o)}
                        className={`rounded-full px-3 py-1 transition-colors ${
                          target === o
                            ? "bg-black text-white dark:bg-white dark:text-black"
                            : "bg-black/[.05] hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20"
                        }`}
                      >
                        {o}s
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={startRest}
                    className="rounded-full bg-black px-8 py-3 text-base font-medium text-white transition-opacity hover:opacity-85 dark:bg-white dark:text-black"
                  >
                    练完一组 · 开始间歇
                  </button>
                  <button
                    type="button"
                    onClick={decreaseSet}
                    className="text-xs text-zinc-500 underline underline-offset-2 hover:text-zinc-800 dark:hover:text-zinc-200"
                  >
                    扣除一组（误记时使用）
                  </button>
                </>
              ) : (
                <>
                  <p className="text-sm text-zinc-500">
                    {phase === "paused"
                      ? "已暂停"
                      : elapsed < target
                        ? "间歇中"
                        : `超时 ${fmtClock(elapsed - target)}，计时继续`}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => addTime(15)}
                      className="rounded-full border border-black/15 px-4 py-2 text-sm transition-colors hover:border-black/30 dark:border-white/20 dark:hover:border-white/40"
                    >
                      +15s
                    </button>
                    <button
                      type="button"
                      onClick={() => addTime(30)}
                      className="rounded-full border border-black/15 px-4 py-2 text-sm transition-colors hover:border-black/30 dark:border-white/20 dark:hover:border-white/40"
                    >
                      +30s
                    </button>
                    <button
                      type="button"
                      onClick={togglePause}
                      className="rounded-full border border-black/15 px-4 py-2 text-sm transition-colors hover:border-black/30 dark:border-white/20 dark:hover:border-white/40"
                    >
                      {phase === "paused" ? "继续" : "暂停"}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        elapsed < COMMIT_SECONDS ? cancelSet() : finishRest()
                      }
                      className={`rounded-full px-5 py-2 text-sm font-medium transition-colors ${
                        elapsed < COMMIT_SECONDS
                          ? "border border-red-500/40 text-red-500 hover:bg-red-500/10"
                          : "bg-black text-white hover:opacity-85 dark:bg-white dark:text-black"
                      }`}
                    >
                      {elapsed < COMMIT_SECONDS
                        ? "结束（不足15秒，本组不计）"
                        : "结束休息"}
                    </button>
                  </div>
                </>
              )}
            </div>

            <div className="mt-4 min-h-5 text-center text-xs text-zinc-500">
              {notice ?? ""}
            </div>
            <p className="mt-1 text-center text-[11px] text-zinc-400">
              {phase === "idle"
                ? "空格键：开始间歇"
                : "空格：单击 暂停/继续 · 三连击 +15秒 · 长按 结束间歇"}
            </p>
          </>
        )}
      </div>

      {showAlert && (
        <div
          className="fixed inset-0 z-50 flex cursor-pointer items-center justify-center animate-[flash-red_1s_ease-in-out_infinite]"
          onClick={() => setShowAlert(false)}
        >
          <div className="rounded-2xl bg-white/95 px-10 py-8 text-center shadow-2xl dark:bg-black/95">
            <p className="text-3xl font-bold text-red-600">休息结束</p>
            <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-300">
              {elapsed > target
                ? `已超时 ${fmtClock(elapsed - target)}`
                : "时间到"}
            </p>
            <p className="mt-2 text-xs text-zinc-400">
              点击任意处关闭弹窗（计时继续）
            </p>
          </div>
        </div>
      )}
    </div>
  );
}