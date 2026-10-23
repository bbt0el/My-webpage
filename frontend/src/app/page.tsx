import Link from "next/link";

const modules = [
  {
    href: "/music",
    title: "背景音乐",
    description: "页面背景音乐播放器：播放 / 暂停、音量调节、曲目切换，音乐常伴左右。",
  },
  {
    href: "/timer",
    title: "健身计时",
    description: "健身训练计时器：组间休息倒计时、训练时长统计，练得科学更有劲。",
  },
  {
    href: "/ideas",
    title: "灵感仓库",
    description: "收集随时冒出的灵感点子：支持添加、标签与时间归档，让好想法不丢失。",
  },
];

export default function Home() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-16">
      <section className="mb-14">
        <h1 className="text-4xl font-semibold tracking-tight">
          你好，欢迎来到我的个人主页
        </h1>
        <p className="mt-4 text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          这是我的个人主页，目前正在建设中。这里会陆续放上背景音乐、健身计时、灵感仓库等小工具，敬请期待。
        </p>
      </section>

      <section>
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-zinc-500">
          功能模块
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {modules.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className="group flex flex-col rounded-2xl border border-black/[.08] p-5 transition-colors hover:border-black/20 hover:bg-black/[.02] dark:border-white/10 dark:hover:border-white/25 dark:hover:bg-white/[.03]"
            >
              <h3 className="text-lg font-medium">{m.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                {m.description}
              </p>
              <span className="mt-4 text-sm font-medium text-zinc-500 transition-transform group-hover:translate-x-0.5 dark:text-zinc-400">
                前往 →
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}