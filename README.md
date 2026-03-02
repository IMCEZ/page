# AI 聊天助手 · Vercel + Supabase 全栈示例

一个基于 **Vercel 无服务器函数** + **Supabase** + **前端静态页面** 的全栈聊天应用示例，实现：

- 邮箱注册 / 登录（Supabase Auth）
- 多对话管理（`conversations` 表）
- 对话消息记录（`messages` 表）
- 调用 LLM 接口（兼容 OpenAI 风格 `/chat/completions`）

前端是移动端优先的单页聊天界面，通过 `public/index.html + style.css + app.js` 实现；后端通过 `api/*.js` 作为 Vercel Serverless Functions 提供 REST API。

---

## 本地运行方法

### 1. 准备环境

- Node.js ≥ 18（推荐）
- npm
- 一个已经创建好的 Supabase 项目（获取 URL 和 service_role / anon key）
- 一个兼容 OpenAI Chat Completions 的 LLM 服务（如 OpenAI）

### 2. 安装依赖

```bash
cd d:\00000
npm install
```

### 3. 配置环境变量

在项目根目录创建 `.env`（或复制 `.env.example` 为 `.env`）并填写实际值：

```bash
SUPABASE_URL=你的_supabase_url
SUPABASE_SERVICE_KEY=你的_service_role_key
SUPABASE_ANON_KEY=你的_anon_key
LLM_API_KEY=你的_llm_api_key
LLM_BASE_URL=https://api.openai.com/v1
LLM_MODEL=gpt-3.5-turbo
```

> 注意：`.env` 已在 `.gitignore` 中忽略，请不要把真实密钥提交到 Git 仓库。

## Discord 登录配置

### 1. 前置条件

- 在 [Discord Developer Portal](https://discord.com/developers/applications) 创建应用
- 获取 Client ID 和 Client Secret
- 在 OAuth2 > Redirects 中添加回调地址

### 2. 环境变量（.env）

```env
DISCORD_CLIENT_ID=你的ClientID
DISCORD_CLIENT_SECRET=你的ClientSecret
DISCORD_REDIRECT_URI=http://localhost:3000/api/auth/discord/callback
JWT_SECRET=自定义密钥
```

### 3. 登录流程

1. 用户点击「使用 Discord 登录」
2. 前端跳转 → `GET /api/auth/discord`
3. 后端 302 → Discord 授权页
4. 用户授权 → Discord 302 → `GET /api/auth/discord/callback?code=xxx`
5. 后端用 code 换 token → 获取用户信息 → 签发 JWT
6. 后端 302 → `/?auth=discord#token=xxx&user=base64`
7. 前端解析 hash → 存储 token → 隐藏登录层 → 进入游戏

### 4. 初始化数据库（Supabase）

1. 打开 Supabase 控制台 → 左侧 **SQL Editor**
2. 将项目根目录中的 `supabase-setup.sql` 完整复制到 SQL Editor
3. 执行该 SQL，以创建：
   - `conversations` 表
   - `messages` 表
   - 对应的 RLS 策略

### 5. 启动本地开发服务器（方案一：vercel dev，推荐）

```bash
npm run dev
```

默认访问地址：

- 前端页面：`http://localhost:3000/`
- 后端 API：`http://localhost:3000/api/...`

### 6. 备用本地方案：自定义 Express dev-server

如果 `vercel dev` 有问题，可以用 `dev-server.js`：

```bash
node dev-server.js
```

访问地址同样为：

- 页面：`http://localhost:3000/`
- API：`http://localhost:3000/api/...`

`dev-server.js` 会：

- 把 `/api/<name>` 路由到 `api/<name>.js` 中导出的 handler
- 其他路由从 `public/` 提供静态文件（`index.html` 为默认入口）

---

## 部署到 Vercel 的准备情况

1. **`vercel.json` 路由配置**

当前配置如下，已满足：

- `/api/*` 路由到 `api` 文件夹（`.js` 函数）
- 其它路由都从 `public/` 提供静态文件

\`\`\`json
{
  "version": 2,
  "routes": [
    { "src": "/api/(.*)", "dest": "/api/$1.js" },
    { "src": "/(.*)", "dest": "/public/$1" }
  ]
}
\`\`\`

2. **环境变量读取方式**

- Supabase：
  - 在 `lib/supabase.js` 中使用：
    - `process.env.SUPABASE_URL`
    - `process.env.SUPABASE_SERVICE_KEY`
- LLM：
  - 在 `api/chat.js` 中使用：
    - `process.env.LLM_BASE_URL`
    - `process.env.LLM_API_KEY`
    - `process.env.LLM_MODEL`

代码中 **没有任何地方直接读取 `.env` 文件**，在 Vercel 上只需在环境变量面板中配置上述变量即可。

3. **依赖配置**

`package.json` 中的关键依赖：

\`\`\`json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.45.0"
  },
  "devDependencies": {
    "vercel": "^39.0.0",
    "express": "^4.19.2"
  }
}
\`\`\`

- 生产环境（Vercel）主要使用：
  - `@supabase/supabase-js`
  - Node 18+ 自带的 `fetch`
  - `api/*.js` 无需额外依赖
- `vercel`、`express` 仅用于本地开发。

---

## 部署步骤（GitHub + Vercel）

### 1. 推送代码到 GitHub

在项目根目录执行（如果还没有 Git 仓库）：

```bash
cd d:\00000
git init
git add .
git commit -m "Initial commit: Vercel + Supabase chat app"
```

在 GitHub 上：

1. 新建一个空仓库（不勾选 “Add README / .gitignore / License”）
2. 按 GitHub 给出的命令，将本地仓库关联并推送，例如：

```bash
git remote add origin https://github.com/<your-username>/<your-repo>.git
git branch -M main
git push -u origin main
```

### 2. 在 Vercel 网站导入项目

1. 打开 `https://vercel.com`，登录（GitHub 账号即可）
2. 点击 **“Add New…” → “Project”**
3. 选择你刚才推送的 GitHub 仓库
4. 在导入向导中：
   - Framework 选择：`Other`（或自动检测为 Node.js / Static）
   - Root Directory：选择项目根目录（包含 `public/` 与 `api/`）
   - 确认 `vercel.json` 会被识别

### 3. 在 Vercel 面板添加环境变量

在 Vercel 项目的 **Settings → Environment Variables** 中添加：

- `SUPABASE_URL`：你的 Supabase 项目 URL
- `SUPABASE_SERVICE_KEY`：Supabase service_role key（注意保密）
- `SUPABASE_ANON_KEY`：Supabase anon key（如前端将来需要可用）
- `LLM_API_KEY`：你的 LLM API Key（如 OpenAI）
- `LLM_BASE_URL`：一般为 `https://api.openai.com/v1`
- `LLM_MODEL`：如 `gpt-3.5-turbo`

# ASTRAL CHRONICLES · Azure Legend

跨平台角色创建 + AI 西幻 RPG 一体页。角色创建完成后可将设定发送给 AI 生成专属开场白，再进入游戏与守秘人(AI)对话冒险。

## 功能

- **角色创建**：8 步完整设定（现实侧写 + 虚拟具现），支持响应式与移动端。
- **API 设置**：在角色创建页与游戏内均可配置 API 地址、Key、模型（含 Claude Opus 4）、温度、最大令牌数；配置保存在本地。
- **AI 开场白**：在「角色创建完成」页点击「生成开场白」，将当前角色信息发送给 AI，生成 2～4 段初始场景叙述。
- **进入游戏**：点击「进入游戏」后进入 Azure Legend 聊天界面，左侧为角色档案，中间为对话区（开场白 + 后续与 AI 对话），右侧为配置与日志；支持返回角色创建页。

## 使用步骤

1. 用浏览器打开 `index.html`（建议使用本地服务器或直接打开）。
2. 在角色创建页右上角点击 **⚙ API 设置**，填写：
   - **API 来源**：选 **OpenAI 官方**（固定 `api.openai.com/v1`）或 **第三方（OpenAI 协议兼容）**。选第三方时需填写 **第三方 API 地址（Base URL）**，仅此一个输入框，如 `http://localhost:3000/v1`（OneAPI、Ollama、vLLM、LM Studio 等）。
   - **API Key**：你的密钥（部分本地服务可留空）。
   - **模型**：下拉选择，或点击 **「获取模型列表（GET /v1/models）」** 从当前配置的接口拉取模型列表并识别填充。
   - 温度、最大令牌数按需调整，保存。
3. 完成 8 步角色创建，在结果页可复制「完整角色设定书」。
4. 点击 **🔮 生成开场白**，等待 AI 生成初始场景；生成后可再点重新生成。
5. 点击 **🎮 进入游戏**，在游戏界面查看开场白并与守秘人(AI)对话；可在右侧再次修改 API 配置。

## 文件说明

| 文件 | 说明 |
|------|------|
| `index.html` | 单页应用：角色创建 + API 设置 + 开场白生成 + 游戏界面 |
| `js/config.js` | 可选；与 index 内使用的本地存储键一致，便于扩展 |
| `docs/OPENAI_API.md` | **OpenAI 协议参考**：常用路径、Python/JS/cURL 示例、第三方服务端口表、返回结构 |
| `code (1).html` | 原 Azure Legend 单独游戏页，可作备份参考 |

### OpenAI 协议 · 本应用使用的接口

- **对话补全**：`POST /v1/chat/completions`（生成开场白、游戏内对话均用此接口）
- 其他路径（文本补全、嵌入、模型列表、图像、音频等）见 `docs/OPENAI_API.md`。

## 技术说明

- 纯前端：无后端，API 从浏览器直连你配置的接口（需支持 CORS）。
- 存储：API 配置与角色草稿使用 `localStorage`；当前角色与开场白使用 `sessionStorage`，关闭标签页后清空。
- 模型：默认使用 `claude-sonnet-4-20250514` 作为 Claude Opus 4 选项；若使用其他提供商，请在 API 设置中选择对应模型 ID。

## 注意事项

- API Key 仅保存在本机，请勿在公共设备上使用。
- 若无法生成开场白或游戏内无回复，请检查 API 地址、Key 及网络/CORS。
