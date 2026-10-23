import type { PlanMap, DayKey } from "./types";

export const DAY_KEYS: DayKey[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
];

// 默认周计划：动作名和组数都可以在日历里修改
export const DEFAULT_PLAN: PlanMap = {
  monday: {
    label: "周一",
    focus: "胸+三头",
    exercises: [
      { name: "杠铃卧推", sets: 4 },
      { name: "上斜哑铃卧推", sets: 4 },
      { name: "双杠臂屈伸", sets: 3 },
      { name: "绳索下压", sets: 3 },
      { name: "坐姿夹胸", sets: 3 },
    ],
  },
  tuesday: {
    label: "周二",
    focus: "背+二头",
    exercises: [
      { name: "引体向上", sets: 4 },
      { name: "杠铃划船", sets: 4 },
      { name: "坐姿划船", sets: 3 },
      { name: "哑铃弯举", sets: 3 },
      { name: "锤式弯举", sets: 3 },
    ],
  },
  wednesday: {
    label: "周三",
    focus: "有氧骑行",
    mode: "checkin",
    exercises: [{ name: "骑行（有氧）", sets: 1 }],
  },
  thursday: {
    label: "周四",
    focus: "臀腿下肢",
    exercises: [
      { name: "杠铃深蹲", sets: 4 },
      { name: "腿举", sets: 4 },
      { name: "弓步蹲", sets: 3 },
      { name: "腿弯举", sets: 3 },
      { name: "站姿提踵", sets: 4 },
    ],
  },
  friday: {
    label: "周五",
    focus: "肩+核心",
    exercises: [
      { name: "哑铃推举", sets: 4 },
      { name: "哑铃侧平举", sets: 4 },
      { name: "卷腹", sets: 3 },
      { name: "平板支撑", sets: 3 },
      { name: "反向飞鸟", sets: 3 },
    ],
  },
};