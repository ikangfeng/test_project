# 倒计时应用 — 开发任务规格书

---

## 项目概述

**项目名称**: 60秒倒计时前端页面

**项目目标**: 构建一个基于浏览器的倒计时工具，用户可通过"开始"按钮启动 60 秒倒计时，通过"复位"按钮将倒计时重置为 60 秒。整个应用使用 Node.js HTTP 服务器托管静态页面（零依赖，纯 HTML/CSS/JS 实现）。

**技术栈**:
- **运行时**: Node.js（内置 `http` 模块，无需 npm 依赖）
- **前端**: 纯 HTML5 + CSS3 + 原生 JavaScript（ES6+）
- **协议**: HTTP/1.1，监听 `localhost:3000`
- **内容类型**: `text/html`（单文件内嵌 CSS 和 JS，或拆分为独立文件由服务器路由分发）

**设计原则**: 极简、零依赖、可直接运行、所有逻辑在前端浏览器中执行。

---

## 目录结构

```
/Users/feng/countdown-app/
├── TASK_SPEC.md          # 本规格文档（PM Agent 输出）
├── server.js             # Node.js HTTP 服务器入口
├── public/               # 静态资源目录
│   ├── index.html        # 主页面结构（DOM 骨架）
│   ├── style.css         # 样式表（布局、配色、动画）
│   └── app.js            # 前端业务逻辑（状态机、定时器、事件绑定）
└── README.md             # 项目说明与启动步骤（由后续 Agent 生成）
```

**各文件职责**:

| 文件 | 职责 |
|------|------|
| `server.js` | 启动 HTTP 服务器，解析请求 URL，根据扩展名返回对应的静态文件并设置正确的 `Content-Type`，处理 404。 |
| `public/index.html` | 定义页面 DOM 结构：标题、倒计时显示区域、开始按钮、复位按钮。通过 `<link>` 引入 CSS，通过 `<script>` 引入 JS。 |
| `public/style.css` | 定义全部视觉样式：居中布局、数字字体、按钮颜色与悬停效果、倒计时归零时的视觉提示。 |
| `public/app.js` | 实现完整的倒计时业务逻辑：状态管理、定时器控制、事件绑定与 UI 更新。 |

---

## 详细功能规格

---

### 1. `server.js` — Node.js HTTP 服务器

#### 1.1 功能描述
启动一个 HTTP 服务器，监听 `localhost:3000`。根据请求 URL 的路径，读取 `public/` 目录下对应的静态文件，设置正确的 MIME 类型后返回响应体。对不存在的路径返回 404。

#### 1.2 常量与配置

```js
const PORT = 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
```

#### 1.3 MIME 类型映射

```js
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
};
```

#### 1.4 函数签名

```js
// 入口：创建服务器并开始监听
function startServer(): void

// 请求处理器：解析 URL、读取文件、写入响应
function handleRequest(req: http.IncomingMessage, res: http.ServerResponse): void

// 根据 URL 路径确定文件路径（根路径映射到 index.html）
function getFilePath(url: string): string

// 根据文件扩展名获取 Content-Type
function getContentType(filePath: string): string
```

#### 1.5 路由规则

| 请求路径 | 映射文件 | HTTP 状态码 |
|----------|----------|-------------|
| `/` | `public/index.html` | 200 |
| `/style.css` | `public/style.css` | 200 |
| `/app.js` | `public/app.js` | 200 |
| 其他任意路径 | — | 404 |

#### 1.6 服务器行为细节

- 启动后在控制台打印 `服务器已启动: http://localhost:3000`
- 对每个请求在控制台打印 `[METHOD] /path -> 状态码`
- 使用 `fs.createReadStream()` 以流的方式读取文件，通过 `pipe(res)` 写入响应，避免大文件占用内存
- 捕获 `ENOENT` 错误（文件不存在）时返回 404 纯文本 `404 Not Found`
- 响应头必须包含 `Content-Type`

#### 1.7 错误处理

- 文件不存在（`ENOENT`）→ HTTP 404
- 其他文件系统错误 → HTTP 500
- 服务器启动失败 → `process.exit(1)`

---

### 2. `public/index.html` — HTML 页面结构

#### 2.1 功能描述
定义页面的 DOM 骨架，包含：页面标题、倒计时数字显示区域、开始按钮、复位按钮。所有样式与逻辑分别由 `style.css` 和 `app.js` 提供。

#### 2.2 HTML 结构（包含 ID 命名约定）

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>60秒倒计时</title>
  <link rel="stylesheet" href="/style.css">
</head>
<body>
  <div id="app">
    <h1 id="title">60秒倒计时</h1>
    <div id="countdown-display">60</div>
    <div id="button-group">
      <button id="btn-start">开始</button>
      <button id="btn-reset">复位</button>
    </div>
  </div>
  <script src="/app.js"></script>
</body>
</html>
```

#### 2.3 HTML ID 命名约定

| ID | 元素类型 | 用途 |
|----|---------|------|
| `app` | `<div>` | 应用根容器，用于整体布局控制 |
| `title` | `<h1>` | 页面标题 "60秒倒计时" |
| `countdown-display` | `<div>` | 显示当前倒计时秒数（初始值 60） |
| `button-group` | `<div>` | 按钮组容器，用于并排布局 |
| `btn-start` | `<button>` | "开始" 按钮 |
| `btn-reset` | `<button>` | "复位" 按钮 |

#### 2.4 可访问性要求

- 按钮元素使用 `<button>` 而非 `<div>`，确保键盘可聚焦和屏幕阅读器友好
- 页面语言标记 `lang="zh-CN"`
- `viewport` meta 标签确保移动端适配

---

### 3. `public/style.css` — 样式表

#### 3.1 功能描述
定义全部视觉样式。页面采用居中布局，数字显示区域使用大号等宽字体。按钮具有明显的视觉区分和悬停/禁用交互反馈。倒计时归零时有视觉变化（颜色变红）。

#### 3.2 CSS 类名命名约定

| CSS 选择器 | 用途 |
|-----------|------|
| `*`（全局） | `box-sizing: border-box; margin: 0; padding: 0;` |
| `body` | 全屏居中 flex 布局，背景色 `#f0f2f5` |
| `#app` | 应用容器：`max-width: 420px;`、白色背景、圆角阴影卡片 |
| `#title` | 标题样式：字号、间距、颜色 |
| `#countdown-display` | 数字显示：等宽字体 `font-family: 'Courier New', monospace;`、大字号 `font-size: 96px;`、居中 |
| `#countdown-display.finished` | 倒计时归零时的附加样式：颜色变为 `#e74c3c`（红色） |
| `#button-group` | 按钮组：flex 横向排列，间距 `gap: 16px;` |
| `button` | 按钮基础样式：内边距、字号、圆角、边框、过渡动画 `transition: all 0.2s;` |
| `#btn-start` | 开始按钮：绿色背景 `#2ecc71`，白色文字 |
| `#btn-reset` | 复位按钮：灰色背景 `#95a5a6`，白色文字 |
| `button:hover` | 悬停效果：轻微放大 `transform: scale(1.05);` + 阴影 |
| `button:active` | 按下效果：`transform: scale(0.98);` |
| `button:disabled` | 禁用状态：`opacity: 0.5; cursor: not-allowed;`，无 hover 效果 |

#### 3.3 配色方案

| 用途 | 颜色值 |
|------|--------|
| 页面背景 | `#f0f2f5` |
| 卡片背景 | `#ffffff` |
| 主文字 | `#2c3e50` |
| 倒计时数字（正常） | `#2c3e50` |
| 倒计时数字（归零） | `#e74c3c` |
| 开始按钮背景 | `#2ecc71` |
| 开始按钮悬停 | `#27ae60` |
| 复位按钮背景 | `#95a5a6` |
| 复位按钮悬停 | `#7f8c8d` |

#### 3.4 响应式要求

- 在 `max-width: 480px` 以下，卡片宽度调整为 `90vw`
- 数字字号在小屏幕下调至 `font-size: 72px;`

---

### 4. `public/app.js` — 前端业务逻辑（核心）

#### 4.1 功能描述
实现完整的倒计时业务逻辑。管理倒计时状态机，控制 `setInterval` 定时器，响应按钮点击事件，实时更新 DOM 显示。这是整个应用的逻辑核心。

#### 4.2 常量定义

```js
const DEFAULT_SECONDS = 60;        // 默认倒计时秒数
const TICK_INTERVAL_MS = 1000;     // 定时器间隔（毫秒）
```

#### 4.3 DOM 元素引用（在 `DOMContentLoaded` 中初始化）

```js
let displayEl;     // document.getElementById('countdown-display')
let btnStartEl;    // document.getElementById('btn-start')
let btnResetEl;    // document.getElementById('btn-reset')
```

#### 4.4 状态管理

##### 4.4.1 状态变量

```js
let remainingSeconds = DEFAULT_SECONDS;  // 当前剩余秒数（0~60）
let timerId = null;                      // setInterval 返回的定时器 ID，null 表示无活跃定时器
let state = 'IDLE';                      // 当前状态：'IDLE' | 'RUNNING' | 'FINISHED'
```

##### 4.4.2 状态机定义

```
                ┌──────────────────────────────────┐
                │                                  │
                ▼                                  │
             ┌──────┐   点击"开始"    ┌─────────┐  │
   初始加载 → │ IDLE │ ────────────→ │ RUNNING │  │
             └──────┘                └─────────┘  │
                ▲                        │  │      │
                │      点击"复位"         │  │      │
                │                        │  │      │
                │        倒计时到 0       │  │      │
                │                        ▼  │      │
                │   点击"复位"    ┌──────────┐     │
                └─────────────── │ FINISHED │     │
                                 └──────────┘     │
                                      │            │
                                      │ 点击"开始"  │
                                      └────────────┘
```

**状态说明**:

| 状态 | 含义 | `remainingSeconds` | `timerId` | 开始按钮 | 复位按钮 |
|------|------|-------------------|-----------|---------|---------|
| `IDLE` | 初始状态或复位后 | 60 | `null` | 可用 | 可用 |
| `RUNNING` | 正在倒计时 | 1~60 | 非 null | 禁用 | 可用 |
| `FINISHED` | 倒计时到 0 | 0 | `null` | 可用 | 可用 |

#### 4.5 函数签名与方法列表

```js
/**
 * 初始化应用：绑定 DOM 引用、注册事件监听、设置初始显示。
 * 在 DOMContentLoaded 事件中调用。
 */
function init(): void

/**
 * 启动倒计时。
 * - 仅在 state === 'IDLE' 或 state === 'FINISHED' 时有效
 * - 如果 state === 'FINISHED'，先将 remainingSeconds 重置为 60
 * - 将 state 设为 'RUNNING'
 * - 禁用"开始"按钮
 * - 移除数字的 .finished 样式类（如果有）
 * - 调用 startTimer()
 */
function startCountdown(): void

/**
 * 复位倒计时。
 * - 可在任意状态下调用
 * - 清除活跃定时器（调用 stopTimer()）
 * - 将 remainingSeconds 重置为 DEFAULT_SECONDS (60)
 * - 将 state 设为 'IDLE'
 * - 启用"开始"按钮
 * - 移除数字的 .finished 样式类（如果有）
 * - 更新显示
 */
function resetCountdown(): void

/**
 * 启动定时器。
 * - 使用 setInterval 每秒调用一次 tick()
 * - 将返回的定时器 ID 存入 timerId
 * - 调用前必须确保 timerId === null（防御性检查）
 */
function startTimer(): void

/**
 * 停止并清除定时器。
 * - 调用 clearInterval(timerId)
 * - 将 timerId 置为 null
 * - 幂等操作：timerId 为 null 时直接返回
 */
function stopTimer(): void

/**
 * 每秒钟执行一次的定时器回调。
 * - remainingSeconds 减 1
 * - 更新显示
 * - 如果 remainingSeconds <= 0：
 *   - 调用 stopTimer()
 *   - 将 state 设为 'FINISHED'
 *   - 给显示元素添加 .finished 样式类
 *   - 启用"开始"按钮
 */
function tick(): void

/**
 * 更新 DOM 显示。
 * - 将 countdown-display 的 textContent 设为 remainingSeconds
 */
function updateDisplay(): void

/**
 * 根据当前状态更新按钮的启用/禁用状态。
 * - RUNNING: btnStart 禁用, btnReset 启用
 * - IDLE / FINISHED: btnStart 启用, btnReset 启用
 */
function updateButtonStates(): void
```

#### 4.6 UI 交互说明

##### 4.6.1 "开始"按钮（`#btn-start`）

| 当前状态 | 点击行为 |
|---------|---------|
| `IDLE` | 1. `state → 'RUNNING'`<br>2. 禁用自身<br>3. 启动定时器，每秒递减 |
| `RUNNING` | 按钮已禁用，点击无效 |
| `FINISHED` | 1. `remainingSeconds → 60`<br>2. 移除 `.finished` 类<br>3. `state → 'RUNNING'`<br>4. 禁用自身<br>5. 启动定时器从头开始 |

##### 4.6.2 "复位"按钮（`#btn-reset`）

| 当前状态 | 点击行为 |
|---------|---------|
| `IDLE` | 重置显示为 60（实际不变，但逻辑上无副作用） |
| `RUNNING` | 1. 停止定时器<br>2. `remainingSeconds → 60`<br>3. `state → 'IDLE'`<br>4. 启用"开始"按钮<br>5. 更新显示 |
| `FINISHED` | 1. `remainingSeconds → 60`<br>2. 移除 `.finished` 类<br>3. `state → 'IDLE'`<br>4. 启用"开始"按钮<br>5. 更新显示 |

##### 4.6.3 显示更新规则

- 每次 `tick()` 和 `resetCountdown()` 调用后，立即调用 `updateDisplay()`
- 显示内容始终等于 `remainingSeconds` 的当前值
- 当 `state === 'FINISHED'` 时，DOM 元素 `#countdown-display` 携带 CSS 类 `finished`

#### 4.7 边界条件处理

##### 4.7.1 倒计时到达 0
- `remainingSeconds` 递减到 0 时，`tick()` 中检测到 `remainingSeconds <= 0`
- 立即调用 `stopTimer()` 清除定时器
- `state` 设为 `'FINISHED'`
- 给 `#countdown-display` 添加 `.finished` CSS 类使数字变红
- 启用"开始"按钮，允许用户再次开始
- **注意**: `remainingSeconds` 不会小于 0

##### 4.7.2 重复点击"开始"按钮（防止多个定时器）
- `startCountdown()` 只在 `state !== 'RUNNING'` 时执行核心逻辑
- 进入 RUNNING 状态后，`btnStart` 立即被禁用（`disabled = true`）
- `startTimer()` 内部做防御性检查：如果 `timerId !== null`，先调用 `stopTimer()` 再启动新定时器
- **双重保险**: 状态判断 + 按钮禁用 + 定时器清理

##### 4.7.3 复位后再开始
- `resetCountdown()` 将 `remainingSeconds` 重置为 60，`state` 回到 `IDLE`
- 用户随后点击"开始"时，从 60 秒开始全新倒计时
- 不会残留之前的定时器或状态

##### 4.7.4 页面加载初始状态
- `init()` 在 `DOMContentLoaded` 中执行
- 初始 `state = 'IDLE'`, `remainingSeconds = 60`
- 显示区域显示 "60"
- 两个按钮均为可用状态

##### 4.7.5 定时器精度
- 使用 `setInterval` 每 1000ms 执行一次 `tick()`
- JavaScript 单线程特性意味着实际间隔可能有微小漂移（±几毫秒），这对本应用可接受
- 不依赖 `Date.now()` 计算精确时间差（需求未要求亚秒级精度）

##### 4.7.6 浏览器兼容性
- 使用 ES6 `const`/`let`、箭头函数、`classList` API
- 目标浏览器：Chrome 90+、Firefox 90+、Safari 14+、Edge 90+
- 不使用任何需要 polyfill 的 API

---

## 数据流

```
┌─────────────────────────────────────────────────────────────────────┐
│                          index.html (DOM)                            │
│                                                                      │
│  ┌──────────────────┐   ┌──────────────┐   ┌──────────────────┐    │
│  │ #countdown-display│   │   #btn-start  │   │   #btn-reset     │    │
│  │   textContent     │   │   disabled    │   │   disabled       │    │
│  └────────┬─────────┘   └──────┬───────┘   └────────┬─────────┘    │
│           │                    │                     │               │
│           │  updateDisplay()   │  updateButtonStates()              │
│           │                    │                     │               │
└───────────┼────────────────────┼─────────────────────┼───────────────┘
            │                    │                     │
      ┌─────▼────────────────────▼─────────────────────▼──────┐
      │                     app.js                              │
      │                                                         │
      │  ┌─────────────────────────────────────────────────┐   │
      │  │              状态变量 (闭包作用域)                │   │
      │  │  state: 'IDLE' | 'RUNNING' | 'FINISHED'          │   │
      │  │  remainingSeconds: 0~60                          │   │
      │  │  timerId: number | null                          │   │
      │  └──────────────────────┬──────────────────────────┘   │
      │                         │                               │
      │         ┌───────────────┼───────────────┐              │
      │         │               │               │              │
      │  ┌──────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐      │
      │  │ startCountdown│ │resetCountdown│ │    tick()    │     │
      │  │   (事件绑定)  │ │  (事件绑定)  │ │ (setInterval)│     │
      │  └──────────────┘ └──────────────┘ └──────────────┘      │
      │                                                         │
      └─────────────────────────────────────────────────────────┘
            ▲                                    │
            │         HTTP Response              │ HTTP Request
            │         (静态文件)                  │ (GET /)
            │                                    ▼
      ┌─────────────────────────────────────────────────────────┐
      │                      server.js                           │
      │  fs.createReadStream() → res (pipe)                     │
      │  MIME: text/html | text/css | application/javascript    │
      └─────────────────────────────────────────────────────────┘
```

**数据流向简述**:

1. **启动阶段**: 用户访问 `http://localhost:3000` → `server.js` 返回 `index.html` → 浏览器解析 HTML，加载 `style.css` 和 `app.js` → `app.js` 监听 `DOMContentLoaded`，执行 `init()`

2. **用户交互阶段**:
   - 点击"开始" → `startCountdown()` → 修改 `state` / `remainingSeconds` / `timerId` → 启动 `setInterval` → 每秒 `tick()` 修改 `remainingSeconds` → `updateDisplay()` 更新 DOM
   - 点击"复位" → `resetCountdown()` → `stopTimer()` + 重置状态 → `updateDisplay()` 更新 DOM

3. **倒计时完成**: `remainingSeconds` 降到 0 → `tick()` 检测 → `stopTimer()` → `state = 'FINISHED'` → `updateDisplay()` + 添加 `.finished` 类 → 数字变红

---

## 验收标准

以下所有验收项必须在实现完成后逐一验证：

### 服务器

- [ ] **S-01**: 执行 `node server.js` 后，控制台输出 `服务器已启动: http://localhost:3000`
- [ ] **S-02**: 访问 `http://localhost:3000` 返回 HTTP 200，`Content-Type: text/html`
- [ ] **S-03**: 访问 `http://localhost:3000/style.css` 返回 HTTP 200，`Content-Type: text/css`
- [ ] **S-04**: 访问 `http://localhost:3000/app.js` 返回 HTTP 200，`Content-Type: application/javascript`
- [ ] **S-05**: 访问不存在的路径（如 `/nonexistent`）返回 HTTP 404，响应体为纯文本 `404 Not Found`

### 页面加载

- [ ] **UI-01**: 页面加载后，倒计时显示区域显示 `60`
- [ ] **UI-02**: 页面加载后，"开始"按钮处于可用状态（非 disabled）
- [ ] **UI-03**: 页面加载后，"复位"按钮处于可用状态（非 disabled）
- [ ] **UI-04**: 页面整体居中显示，样式美观

### 核心功能 — 开始倒计时

- [ ] **F-01**: 点击"开始"按钮后，倒计时从 60 开始每秒递减（59, 58, 57...）
- [ ] **F-02**: 倒计时运行期间，"开始"按钮处于禁用状态（灰色、不可点击）
- [ ] **F-03**: 倒计时运行期间，"复位"按钮仍处于可用状态
- [ ] **F-04**: 倒计时到达 0 时自动停止，不再继续递减
- [ ] **F-05**: 倒计时到达 0 时，数字变为红色（`.finished` 样式生效）
- [ ] **F-06**: 倒计时到达 0 后，"开始"按钮恢复可用状态

### 核心功能 — 复位

- [ ] **R-01**: 在 `IDLE` 状态下点击"复位"，显示仍为 60（无副作用）
- [ ] **R-02**: 在 `RUNNING` 状态下点击"复位"，定时器立即停止，显示回到 60
- [ ] **R-03**: 在 `FINISHED` 状态下点击"复位"，红色数字恢复为正常颜色，显示回到 60
- [ ] **R-04**: 复位后状态回到 `IDLE`，"开始"按钮恢复可用

### 核心功能 — 复位后再开始

- [ ] **RA-01**: 倒计时运行到 30 秒时点击"复位"→ 显示 60 → 再点"开始"→ 从 60 开始重新倒数
- [ ] **RA-02**: 倒计时到 0 后点击"复位"→ 显示 60 → 再点"开始"→ 从 60 开始重新倒数

### 边界条件

- [ ] **E-01**: 倒计时运行期间，连续快速点击"开始"按钮不会产生多个定时器
- [ ] **E-02**: 倒计时运行期间，连续快速点击"复位"按钮不会出现异常（显示始终为 60，无定时器残留）
- [ ] **E-03**: 在 `FINISHED` 状态下点击"开始"，从 60 开始全新倒计时（不是从 0 继续）
- [ ] **E-04**: 倒计时不会出现负数（不会显示 -1、-2 等）
- [ ] **E-05**: 从 60 倒数到 0 的实际耗时约为 60 秒（允许 ±2 秒误差）

### 代码质量

- [ ] **C-01**: 不依赖任何第三方 npm 包或 CDN 资源
- [ ] **C-02**: 所有 JavaScript 使用 `'use strict';` 严格模式（或 ES6 模块自动严格模式）
- [ ] **C-03**: HTML 通过 W3C 验证（无标签未闭合、无属性错误）
- [ ] **C-04**: CSS 无语法错误，样式在所有主流浏览器中表现一致

---

## 附录

### A. 给开发者的实现提示

1. **定时器清理是最高优先级的安全问题**。在 `startTimer()` 中始终保持 `if (timerId !== null) stopTimer();` 的防御性写法。
2. **所有状态变更集中管理**。不要在事件处理函数中直接修改 DOM 样式或按钮状态，而是通过 `updateDisplay()` 和 `updateButtonStates()` 统一处理。
3. **`init()` 函数必须在 `DOMContentLoaded` 事件中调用**，确保 DOM 元素已就绪。
4. **按钮禁用使用原生 `disabled` 属性**，CSS 中通过 `:disabled` 伪类控制样式，而不是手动切换 CSS 类。

### B. 快速启动命令

```bash
cd /Users/feng/countdown-app
node server.js
# 浏览器打开 http://localhost:3000
```
