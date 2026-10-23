import Link from "next/link";

export const metadata = {
  title: "灵感仓库",
};

export default function IdeasPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">灵感仓库</h1>
      <p className="mt-4 leading-7 text-zinc-600 dark:text-zinc-400">
        这里将放置灵感收集工具，支持添加灵感、标签分类与时间归档。
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