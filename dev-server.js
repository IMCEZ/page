require("dotenv").config();
const path = require("path");
const fs = require("fs");
const express = require("express");

const app = express();
const port = process.env.PORT || 3000;

const rootDir = __dirname;
const apiDir = path.join(rootDir, "api");
const staticRoot = rootDir;

app.use(express.json());

// 模拟 Vercel 的 /api 路由：动态 require 对应文件并调用导出的 handler(req, res)
app.all("/api/:name", async (req, res, next) => {
  try {
    const filePath = path.join(apiDir, `${req.params.name}.js`);
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

// 静态文件：优先从项目根目录提供（包括 index.html、js、assets、public 等）
app.use(express.static(staticRoot));
app.use("/public", express.static(path.join(rootDir, "public")));

// 对于未匹配到静态文件的路径，统一返回根目录的 index.html（游戏 + 登录一体化入口）
app.use((req, res) => {
  res.sendFile(path.join(rootDir, "index.html"));
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Dev server running at http://localhost:${port}`);
});

