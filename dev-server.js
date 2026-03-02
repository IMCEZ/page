require("dotenv").config();
const path = require("path");
const fs = require("fs");
const express = require("express");

// Discord OAuth 环境变量检查（仅在本地 dev-server 启动时提示）
(() => {
  const required = [
    "DISCORD_CLIENT_ID",
    "DISCORD_CLIENT_SECRET",
    "DISCORD_REDIRECT_URI",
  ];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    // eslint-disable-next-line no-console
    console.warn(
      "[Discord OAuth] 缺少环境变量:",
      missing.join(" / ")
    );
  }
})();

const app = express();
const port = process.env.PORT || 3000;

const rootDir = __dirname;
const apiDir = path.join(rootDir, "api");
const staticRoot = path.join(rootDir, "public");

app.use(express.json());

// 模拟 Vercel 的 /api 路由：动态 require 对应文件并调用导出的 handler(req, res)
app.all("/api/*", async (req, res, next) => {
  try {
    const relativePath = (req.path || "")
      .replace(/^\/api\/?/, "")
      .replace(/\/+$/, "");

    const filePath = path.join(apiDir, `${relativePath}.js`);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "API route not found" });
    }

    // 每次请求前删除缓存，方便本地热更新
    delete require.cache[require.resolve(filePath)];
    const handler = require(filePath);

    if (typeof handler !== "function") {
      return res.status(500).json({ error: "API handler is not a function" });
    }

    return handler(req, res);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    return res
      .status(500)
      .json({ error: "Internal server error", detail: err.message || String(err) });
  }
});

// 静态文件：从 public/ 提供（与 Vercel 行为一致）
app.use(express.static(staticRoot));

// 对于未匹配到静态文件的路径，统一返回 public/index.html（SPA 入口）
app.use((req, res) => {
  res.sendFile(path.join(staticRoot, "index.html"));
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Dev server running at http://localhost:${port}`);
});

