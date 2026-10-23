export interface Exercise {
  name: string;
  sets: number;
}

export type DayMode = "timer" | "checkin";

export interface DayPlan {
  label: string;
  focus: string;
  /** timer=间歇计时模式；checkin=签到模式（无需计时，签到即完成） */
  mode?: DayMode;
  exercises: Exercise[];
}

export type DayKey =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday";

export type PlanMap = Record<DayKey, DayPlan>;

export interface WorkoutEntry {
  exercise: string;
  setIndex: number;
  time: string; // HH:mm
}

export interface DayLog {
  date: string; // YYYY-MM-DD
  entries: WorkoutEntry[];
  /** 手动签到打卡标记（周三骑行签到 / 日历补签） */
  checkedIn?: boolean;
}

export interface TimerSession {
  exerciseIndex: number;
  doneSets: number;
  allDone: boolean;
  targetSeconds: number;
}