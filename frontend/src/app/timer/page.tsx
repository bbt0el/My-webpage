import type { Metadata } from "next";
import WorkoutApp from "@/components/timer/WorkoutApp";

export const metadata: Metadata = {
  title: "健身计时",
};

export default function TimerPage() {
  return <WorkoutApp />;
}