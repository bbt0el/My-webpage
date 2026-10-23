import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 静态导出：next build 后产出 out/ 目录，可直接部署到任意静态服务器
  // 注意：静态导出模式下不能启用 PPR / 缓存组件等动态特性，故移除默认的
  // cacheComponents、partialPrefetching 配置
  output: "export",
  // 以目录形式导出路由（/music/index.html），方便 Nginx 等静态服务器
  // 直接以目录方式解析，无需额外重写规则
  trailingSlash: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;