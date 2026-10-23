import Link from "next/link";

export const metadata = {
  title: "背景音乐",
};

export default function MusicPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">背景音乐</h1>
      <p className="mt-4 leading-7 text-zinc-600 dark:text-zinc-400">
        这里将放置页面背景音乐播放器，支持播放 / 暂停、音量调节、曲目切换。
      </p>
      <p className="mt-8 rounded-xl border border-dashed border-black/10 p-4 text-sm text-zinc-500 dark:border-white/10">
        框架占位 · 功能开发中，敬请期待。
      </p>
      <Link href="/" className="mt-8 inline-block text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white">
        ← 返回首页
      </Link>
    </div>
  );
}