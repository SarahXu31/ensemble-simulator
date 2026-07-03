# 安装与使用指南（新手友好版）/ SETUP

这份文档面向**没有技术背景**或**第一次使用命令行**的朋友：一步一步把「群像模拟器 / Ensemble Simulator」跑起来，并附常见问题排查。

> 你不需要懂太多原理：照着做即可。

---

## 方式一：让 AI Agent 帮你配置（推荐新手）

如果你不熟悉命令行，或者只是想尽快把项目跑起来，可以把整个项目目录交给支持代码操作的 AI Agent，让它来帮你完成环境配置与启动。

你只需要：
1) 下载项目（下载压缩包或 `git clone` 都可以）
2) 把**项目文件夹**交给 Agent
3) 按 Agent 的提示点确认/登录（例如 Convex 登录）

可选的 Agent 工具举例（任选一个你顺手的）：
- **Cursor**（AI 代码编辑器，最推荐，免费可用）：打开项目文件夹，在聊天框告诉它「帮我把这个项目跑起来」。
- **Claude / ChatGPT**（对话式 AI）：把本 SETUP/README（或下面提示词）粘贴给它，说「我是新手，请一步步指导我把这个项目跑起来」。
- **GitHub Copilot**（VS Code 插件）：在 VS Code 里打开项目，用 Copilot Chat 提问并让它带你执行命令。
- **Aime**（本项目推荐的 AI 助理）：直接告诉 Aime「帮我配置并启动群像模拟器」。

对话示例（你可以直接复制给 Agent）：

```text
我下载了群像模拟器这个项目，请帮我：
1. 安装 Node.js（如果没有）
2. 在项目目录执行 npm install
3. 配置并启动 Convex 后端（npx convex dev）
4. 启动前端（npm run dev）
让我能在浏览器里打开 http://localhost:5173/ai-town/
```

---

## 方式二：手动安装（自己来）

下面是传统的手动安装步骤（如果你愿意自己跟着命令行做）。

### 1. 系统要求

- **操作系统**：macOS / Windows 10+（推荐 Windows 11）
- **Node.js**：建议 **v18+**（越新越好，LTS 更稳）
  - 下载： https://nodejs.org/
- **Git**：用于下载项目代码
  - 下载： https://git-scm.com/downloads
- **网络**：首次安装依赖与首次初始化 Convex 时需要联网
- **浏览器**：Chrome / Edge / Firefox 任意现代浏览器

### 你需要准备的账号

- **Convex 账号（免费）**：https://convex.dev/
  - Convex 是本项目使用的「后端服务」：负责数据存储、实时同步、表结构等。

---

### 2. 安装前：先确认 Node / Git 是否可用

打开终端：
- macOS：应用程序 → 实用工具 → **终端（Terminal）**
- Windows：开始菜单 → **Windows Terminal** 或 **PowerShell**

分别输入下面命令（输入后按回车）：

```bash
node -v
npm -v
git --version
```

你应该能看到版本号输出。例如：
- Node：`v18.xx.x` 或更高
- npm：`9.x / 10.x` 等
- git：`2.xx.x`

如果提示 “command not found / 不是内部或外部命令”，说明没装好：请先安装 Node 或 Git 再继续。

---

### 3. 安装步骤（macOS）

### Step 1：下载项目代码

选择一个你喜欢的目录（比如桌面或 Documents），然后执行：

```bash
git clone https://github.com/SarahXu31/ensemble-simulator.git
cd ensemble-simulator
```

解释一下你刚做了什么：
- `git clone ...`：把项目从 GitHub 下载到你的电脑
- `cd ensemble-simulator`：进入项目文件夹（后续命令都在这里执行）

### Step 2：安装依赖

```bash
npm install
```

这一步会下载很多依赖包，首次可能需要 1~5 分钟。

如果你在国内网络环境，下载特别慢或失败，可以稍后在 FAQ 里参考“npm 安装失败/很慢”的排查。

### Step 3：启动 Convex 后端（需要保持运行）

```bash
npx convex dev
```

首次运行会发生两件事：
1. **要求登录 Convex**（按终端提示打开网页并登录）
2. **初始化/绑定一个 Convex 项目**（按提示确认即可）

> 建议：让这个终端窗口一直开着，不要关掉。它相当于“后端在运行中”。

### Step 4：启动前端页面（另开一个终端窗口）

打开**第二个终端窗口**，进入同一个项目目录：

```bash
cd ensemble-simulator
npm run dev
```

终端会显示一个本地地址（通常是）：

- http://localhost:5173/ai-town/

把它复制到浏览器打开即可。

---

### 4. 安装步骤（Windows）

整体步骤与 macOS 一样，区别主要在“打开终端”和“端口占用排查命令”。

### Step 1：下载项目代码

打开 PowerShell / Windows Terminal，执行：

```bash
git clone https://github.com/SarahXu31/ensemble-simulator.git
cd ensemble-simulator
```

### Step 2：安装依赖

```bash
npm install
```

### Step 3：启动 Convex 后端（需要保持运行）

```bash
npx convex dev
```

首次运行会引导你登录 Convex 并初始化项目（按提示操作）。

### Step 4：启动前端页面（另开一个终端窗口）

再打开一个 PowerShell / Terminal 窗口：

```bash
cd ensemble-simulator
npm run dev
```

在浏览器打开终端里显示的本地地址（通常是 http://localhost:5173/ai-town/）。

---

### 5. 首次使用：怎么玩

推荐你第一次按这个流程体验：

1. 打开页面后选择「**风莫村**」世界观
2. 先用 **6 位预设角色**跑一遍，熟悉节奏
3. 点击「**开始模拟**」
4. 观察角色自由互动（你可以切换时间流速，适配“慢慢看戏/快速推进”）

---

### 6. 如何自定义/导入你的 OC（详细说明）

项目支持把你自己的 OC 放进同一个世界里。一般而言，你会在应用的「角色/Characters」相关页面看到：
- 新建角色（手动填写）
- 导入角色（粘贴或上传 JSON）
- 编辑/替换预设角色

### 6.1 推荐的写法（角色卡要包含什么）

一个好用的角色卡通常至少包含：
- **人设 Persona**：性格、边界、说话方式
- **背景 Background**：经历与动机来源
- **目标 Goals**：想要什么（推动剧情的发动机）
- **秘密/隐痛 Secrets**：冲突与张力来源
- **关系 Relationships（可选）**：你希望开局就带着什么“旧识/误会/偏见”

### 6.2 角色 JSON 示例

你可以参考 README 里的示例结构（以下是一个更完整的写法）：

```json
{
  "name": "林照",
  "title": "游方铸剑师",
  "age": "23",
  "personality": "寡言、敏锐、慢热，但一旦信任就极重承诺",
  "speakingStyle": "短句，偶尔冷幽默，不爱解释",
  "background": "因一把断裂的旧剑来到风莫村，似乎在寻找它曾经的主人。",
  "goals": ["找到断剑的主人", "避开旧日仇家"],
  "secrets": ["他知道当年村中大火的部分真相"],
  "likes": ["雨夜", "旧兵器", "守信的人"],
  "dislikes": ["官府", "空话", "试探"],
  "relationships": {
    "沈惊鸿": -10,
    "顾晚舟": 15
  }
}
```

### 6.3 让你的 OC 更“容易长出剧情”的小技巧

- 不只写性格，也写 **欲望/目标**（角色想要什么，剧情就会往哪长）
- 给一两个 **秘密/禁忌/底线**，互动会更有张力
- 明确 **说话风格**（短句/长句、是否爱用典、是否毒舌等）
- 开局别让所有关系都从 0 开始：
  - 预设一点误会、旧识、偏见或欠债，会更容易起戏

---

### 7. LLM 配置（可选，但很好玩）

不配置也能正常运行与模拟。

配置 LLM 后，通常可以获得更强的：
- 总结能力
- 关系分析
- 更有“作者感”的旁白/归纳

在应用「设置页」里，通常需要填两项：
- **API Key**
- **Base URL**（也叫 Base 地址、Endpoint）

> 只要服务是 **OpenAI-compatible**，一般都能用。

### 7.1 OpenAI（示例）

- Base URL：
  - `https://api.openai.com/v1`
- API Key：
  - 你的 OpenAI Key（形如 `sk-...`）

### 7.2 DeepSeek（示例）

- Base URL：
  - `https://api.deepseek.com/v1`
- API Key：
  - 你的 DeepSeek Key

### 7.3 Ollama（本地模型，示例）

适合：不想把 OC/私设发到云端，或者希望离线/本地跑。

1) 安装 Ollama： https://ollama.com/

2) 拉一个模型（示例）：

```bash
ollama pull qwen2.5
```

3) Base URL（常见写法）：
- `http://localhost:11434/v1`

4) API Key：
- 很多 Ollama 兼容服务不强制校验 Key，你可以填一个占位符（例如 `ollama`）或留空（取决于设置页是否允许）。

---

### 8. 常见问题 FAQ（最常见卡点）

### Q1：`npm install` 很慢/失败，怎么办？

可能原因：网络波动、公司/校园网络限制、npm 源不稳定。

你可以尝试：
- 重新执行一次：
  ```bash
  npm install
  ```
- 如果报错里出现大量 `timeout` / `ECONNRESET`，通常就是网络问题：换个网络或稍后重试。

### Q2：启动时报“端口被占用（port already in use）”

表现：
- `npm run dev` 或 `npx convex dev` 提示某个端口被占用

解决思路：
1) **先关掉你之前开过的终端窗口**（可能有旧服务还在跑）
2) 如果还是不行，找到占用端口的进程并结束它：

macOS（以 5173 为例）：
```bash
lsof -i :5173
kill -9 <PID>
```

Windows（以 5173 为例，PowerShell）：
```bash
netstat -ano | findstr :5173
# 找到最后一列 PID
taskkill /PID <PID> /F
```

> 如果你不想手动杀进程，也可以“换端口”。很多前端工具会在 5173 被占用时自动换到 5174/5175，按终端提示访问新的地址即可。

### Q3：`npx convex dev` 报错/无法登录/提示未认证

最常见原因：第一次没完成登录，或登录过期。

你可以尝试：
- 重新跑一遍：
  ```bash
  npx convex dev
  ```
- 如果提示未登录，按终端提示打开网页并登录。

> 关键点：Convex 需要你在首次运行时把本地项目和你的 Convex 项目“绑定”起来，这是正常步骤，不是你做错了。

### Q4：Node 版本不对，导致启动失败

表现：报错里出现 Node 版本要求（例如需要 >=18）。

解决：
- 直接安装新版 Node（推荐 LTS）： https://nodejs.org/
- 或者使用版本管理工具：
  - macOS：nvm
  - Windows：nvm-windows

升级后记得重新打开终端，再执行：
```bash
node -v
```

### Q5：我只想“先玩起来”，需要理解 Convex 吗？

不需要。

你只要记住：
- **一个终端跑 `npx convex dev`（一直开着）**
- **另一个终端跑 `npm run dev`**
- 浏览器打开终端提示的地址

就能开始体验。

---

### 9. 我已经跑起来了，下一步推荐做什么？

- 用预设角色跑 10~20 分钟，感受关系变化
- 只替换 1~2 个角色为你的 OC，先小规模观察
- 给 OC 增加 “目标 + 秘密 + 与某人的初始关系”，剧情更容易起飞

祝你看戏愉快：把角色放进世界里，让他们自己活起来。
