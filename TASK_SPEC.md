# 倒计时前端页面 — 开发任务清单

> **项目名称**：Countdown Timer Web App  
> **项目经理**：荒北大人  
> **创建日期**：2026-07-03  
> **技术栈**：前端 Node.js（HTTP 服务 + 静态页面），后端 Python（FastAPI）

---

## 一、项目结构说明

```
countdown-project/
├── README.md                     # 项目说明、启动方式
├── TASK_SPEC.md                  # 本文件：开发任务清单
├── frontend/                     # 前端工程（Node.js）
│   ├── package.json              # Node 项目配置、依赖
│   ├── server.js                 # Node HTTP 服务器入口
│   └── public/                   # 静态资源目录
│       ├── index.html            # 主页面
│       ├── css/
│       │   └── style.css         # 样式表
│       └── js/
│           ├── app.js            # 主逻辑：DOM 操作、事件绑定
│           ├── timer.js          # 倒计时核心逻辑（客户端）
│           └── api.js            # 后端 API 调用封装
├── backend/                      # 后端工程（Python）
│   ├── requirements.txt          # Python 依赖
│   ├── main.py                   # FastAPI 应用入口
│   ├── routers/
│   │   └── countdown.py          # 倒计时 API 路由
│   ├── services/
│   │   └── countdown_service.py  # 倒计时业务逻辑（状态管理、定时器）
│   └── schemas/
│       └── countdown.py          # Pydantic 数据模型
└── tests/                        # 测试（可选/后续）
    ├── test_backend.py           # 后端接口测试
    └── test_frontend.js          # 前端逻辑测试
```

### 文件清单（核心交付物）

| 序号 | 文件路径 | 职责 |
|------|----------|------|
| 1 | `frontend/package.json` | Node 项目配置 |
| 2 | `frontend/server.js` | HTTP 服务，托管静态文件 |
| 3 | `frontend/public/index.html` | 页面结构 |
| 4 | `frontend/public/css/style.css` | 页面样式 |
| 5 | `frontend/public/js/api.js` | 后端 API 调用封装 |
| 6 | `frontend/public/js/timer.js` | 前端倒计时核心逻辑 |
| 7 | `frontend/public/js/app.js` | 主控逻辑：事件绑定、UI 更新 |
| 8 | `backend/requirements.txt` | Python 依赖声明 |
| 9 | `backend/main.py` | FastAPI 入口 + CORS 配置 |
| 10 | `backend/routers/countdown.py` | API 路由定义 |
| 11 | `backend/services/countdown_service.py` | 倒计时服务层 |
| 12 | `backend/schemas/countdown.py` | 数据模型定义 |

---

## 二、任务拆分总览

```
┌──────────────────────────────────────────────────────┐
│  任务1：后端 — 倒计时状态管理服务                       │
│  任务2：后端 — REST API 路由定义                        │
│  任务3：后端 — FastAPI 应用入口                         │
│  任务4：前端 — Node.js HTTP 服务器                      │
│  任务5：前端 — HTML 页面结构                            │
│  任务6：前端 — CSS 样式                                 │
│  任务7：前端 — API 调用封装                             │
│  任务8：前端 — 倒计时核心逻辑                           │
│  任务9：前端 — 主控逻辑 & 事件绑定                      │
│  任务10：前后端联调 & 验证                              │
└──────────────────────────────────────────────────────┘
```

---

## 三、后端任务（Python / FastAPI）

### 任务 1：倒计时状态管理服务

**文件**：`backend/services/countdown_service.py`  
**职责**：管理倒计时的核心状态与定时逻辑，对上层路由提供统一接口。

#### 类设计

```python
class CountdownService:
    """倒计时单例服务，管理全局唯一倒计时状态"""
```

#### 属性（状态）

| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `_remaining` | `int` | `60` | 当前剩余秒数 |
| `_is_running` | `bool` | `False` | 是否正在倒计时 |
| `_total_seconds` | `int` | `60` | 倒计时总时长 |
| `_task` | `asyncio.Task \| None` | `None` | 异步计时任务句柄 |

#### 方法（函数）

| 方法签名 | 返回值 | 说明 |
|----------|--------|------|
| `get_status()` | `CountdownStatus` | 返回当前剩余秒数 + 运行状态 |
| `start()` | `CountdownStatus` | 启动倒计时（从当前剩余值开始递减） |
| `reset()` | `CountdownStatus` | 停止倒计时并将剩余秒数复位为 60 |
| `_run_timer()` | `None` | 内部异步方法，每秒递减 `_remaining`，到 0 自动停止 |

#### 实现要点

1. **`start()`**：
   - 如果 `_is_running` 已为 `True`，忽略重复启动（幂等）。
   - 如果 `_remaining <= 0`，自动调用 `reset()` 后再启动。
   - 将 `_is_running` 设为 `True`，创建 `asyncio.Task` 运行 `_run_timer()`。

2. **`_run_timer()`**：
   - 使用 `asyncio.sleep(1)` 实现每秒递减。
   - 每次递减后检查 `_remaining <= 0`，若成立则设 `_is_running = False` 并退出。
   - 需处理任务被取消的 `asyncio.CancelledError`。

3. **`reset()`**：
   - 取消当前 `_task`（如果存在）。
   - 将 `_remaining` 重置为 60，`_is_running` 设为 `False`。

4. **线程安全**：使用 `asyncio.Lock` 保护对 `_remaining` / `_is_running` 的读写，防止并发请求导致状态不一致。

---

### 任务 2：REST API 路由定义

**文件**：`backend/routers/countdown.py`  
**职责**：定义倒计时的 HTTP 接口，对接 CountdownService。

#### 路由设计

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/countdown/status` | 获取当前倒计时状态 |
| `POST` | `/api/countdown/start` | 启动倒计时 |
| `POST` | `/api/countdown/reset` | 复位倒计时至 60 秒 |

#### 函数定义

```python
@router.get("/status", response_model=CountdownResponse)
async def get_status():
    """GET /api/countdown/status — 返回当前剩余秒数和运行状态"""
    service = get_countdown_service()
    status = service.get_status()
    return CountdownResponse(remaining=status.remaining, is_running=status.is_running)

@router.post("/start", response_model=CountdownResponse)
async def start_countdown():
    """POST /api/countdown/start — 启动倒计时"""
    service = get_countdown_service()
    status = service.start()
    return CountdownResponse(remaining=status.remaining, is_running=status.is_running)

@router.post("/reset", response_model=CountdownResponse)
async def reset_countdown():
    """POST /api/countdown/reset — 复位倒计时到60秒"""
    service = get_countdown_service()
    status = service.reset()
    return CountdownResponse(remaining=status.remaining, is_running=status.is_running)
```

#### 依赖注入

- `get_countdown_service()` 通过 FastAPI `Depends` 返回全局单例 `CountdownService` 实例。

---

### 任务 3：FastAPI 应用入口

**文件**：`backend/main.py`  
**职责**：创建 FastAPI 应用实例，注册路由，配置 CORS。

#### 核心逻辑

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.countdown import router as countdown_router

app = FastAPI(title="Countdown API", version="1.0.0")

# CORS 配置：允许前端跨域调用
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # 开发环境允许所有来源
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

app.include_router(countdown_router, prefix="/api/countdown")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

#### 启动命令

```bash
cd backend
pip install -r requirements.txt
python main.py
# 或：uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

---

### 任务 3 附：数据模型定义

**文件**：`backend/schemas/countdown.py`

```python
from pydantic import BaseModel

class CountdownResponse(BaseModel):
    """API 统一响应模型"""
    remaining: int       # 剩余秒数 (0-60)
    is_running: bool     # 是否正在倒计时

class CountdownStatus(BaseModel):
    """服务层内部状态模型"""
    remaining: int
    is_running: bool
```

**文件**：`backend/requirements.txt`

```
fastapi==0.115.6
uvicorn[standard]==0.34.0
pydantic==2.10.4
```

---

## 四、前端任务（Node.js / HTML / CSS / JavaScript）

### 任务 4：Node.js HTTP 服务器

**文件**：`frontend/server.js`  
**职责**：创建 HTTP 服务器，托管 `public/` 目录下的静态文件，设置正确的 MIME 类型。

#### 核心函数

```javascript
// 主入口：创建并启动 HTTP 服务器
function startServer(port = 3000)

// MIME 类型映射（基于文件扩展名）
function getContentType(filePath)

// 请求处理：读取文件并返回
async function handleRequest(req, res)
```

#### 实现要点

1. 使用 Node.js 内置 `http` 和 `fs` 模块，**不引入额外依赖**。
2. `startServer(port)`：`http.createServer(handleRequest).listen(port)`，打印服务地址。
3. `handleRequest(req, res)`：
   - 解析 `req.url`，映射到 `public/` 目录下的文件。
   - 根路径 `/` 重定向到 `/index.html`。
   - 文件不存在时返回 `404 Not Found`。
   - 根据扩展名设置 `Content-Type`（`.html` → `text/html`，`.css` → `text/css`，`.js` → `application/javascript`）。
4. `getContentType(filePath)`：使用 `Map` 维护扩展名到 MIME 的映射。

#### 启动命令

```bash
cd frontend
node server.js
# 输出：Server running at http://localhost:3000
```

**文件**：`frontend/package.json`

```json
{
  "name": "countdown-frontend",
  "version": "1.0.0",
  "description": "60秒倒计时前端页面",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "node server.js"
  },
  "license": "MIT"
}
```

---

### 任务 5：HTML 页面结构

**文件**：`frontend/public/index.html`  
**职责**：定义倒计时页面的 DOM 结构。

#### 页面结构

```html
<div id="app" class="container">
  <!-- 标题 -->
  <h1 class="title">倒计时</h1>

  <!-- 倒计时显示区 -->
  <div id="countdown-display" class="display">
    <span id="timer-value">60</span>
    <span class="unit">秒</span>
  </div>

  <!-- 进度条（可选增强） -->
  <div id="progress-bar" class="progress">
    <div id="progress-fill" class="progress-fill"></div>
  </div>

  <!-- 按钮区 -->
  <div class="buttons">
    <button id="btn-start" class="btn btn-start">开始</button>
    <button id="btn-reset" class="btn btn-reset">复位</button>
  </div>

  <!-- 状态文字 -->
  <p id="status-text" class="status">准备就绪</p>
</div>
```

#### DOM 元素清单与用途

| ID | 标签 | 用途 |
|----|------|------|
| `#app` | `div` | 应用容器 |
| `#countdown-display` | `div` | 倒计时数字展示区 |
| `#timer-value` | `span` | 当前剩余秒数（动态更新） |
| `#progress-bar` | `div` | 进度条容器 |
| `#progress-fill` | `div` | 进度条填充（宽度动态变化） |
| `#btn-start` | `button` | "开始"按钮 |
| `#btn-reset` | `button` | "复位"按钮 |
| `#status-text` | `p` | 状态提示文字 |

---

### 任务 6：CSS 样式

**文件**：`frontend/public/css/style.css`  
**职责**：页面视觉样式。

#### 样式要点

| 区域 | 样式要求 |
|------|----------|
| 整体布局 | 居中（flexbox），全屏背景，深色主题 |
| `.display` | 大字号（96px+），醒目字体，居中 |
| `#timer-value` | 等宽字体，色彩突出（如亮绿/亮蓝） |
| `.progress` | 宽度与显示区一致，圆角，灰色背景 |
| `.progress-fill` | 渐变填充色，宽度 = `(remaining / 60) * 100%` |
| `.btn-start` | 绿色主题，悬停加深 |
| `.btn-reset` | 橙色/红色主题，悬停加深 |
| `.btn:disabled` | 灰色，cursor: not-allowed |
| `#status-text` | 小字，灰色，显示当前状态 |

#### 状态类

| CSS 类 | 触发条件 | 样式变化 |
|--------|----------|----------|
| `.running` | 倒计时进行中 | 数字呼吸动画，开始按钮禁用 |
| `.finished` | 倒计时为 0 | 数字变红，显示"时间到！" |
| `.paused` | 倒计时暂停/就绪 | 默认状态 |

---

### 任务 7：API 调用封装

**文件**：`frontend/public/js/api.js`  
**职责**：封装对后端 API 的 fetch 调用，统一错误处理。

#### 常量

```javascript
const API_BASE_URL = 'http://localhost:8000/api/countdown';
```

#### 函数

| 函数签名 | 返回值 | 说明 |
|----------|--------|------|
| `async getStatus()` | `{remaining: number, is_running: boolean}` | 调用 GET /status |
| `async startCountdown()` | `{remaining: number, is_running: boolean}` | 调用 POST /start |
| `async resetCountdown()` | `{remaining: number, is_running: boolean}` | 调用 POST /reset |

#### 实现要点

1. 三个函数内部均使用 `fetch()` 发起请求，返回解析后的 JSON。
2. 统一在 `try/catch` 中处理网络异常，失败时返回默认值 `{remaining: 60, is_running: false}` 并在 console 输出错误。
3. `startCountdown()` 和 `resetCountdown()` 使用 `method: 'POST'`，`getStatus()` 使用 `method: 'GET'`。

---

### 任务 8：倒计时核心逻辑（客户端）

**文件**：`frontend/public/js/timer.js`  
**职责**：管理前端本地倒计时状态，提供回调机制驱动 UI 更新。

#### 类设计

```javascript
class CountdownTimer {
    constructor(totalSeconds, onTick, onComplete)
    start()
    reset()
    getRemaining()
    isRunning()
}
```

#### 属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `totalSeconds` | `number` | `60` | 倒计时总秒数 |
| `remaining` | `number` | `60` | 当前剩余秒数 |
| `intervalId` | `number\|null` | `null` | `setInterval` 句柄 |
| `onTick` | `function` | — | 每秒回调，参数 `remaining` |
| `onComplete` | `function` | — | 倒计时结束回调 |

#### 方法实现

1. **`constructor(totalSeconds, onTick, onComplete)`**：
   - 初始化 `totalSeconds` 和 `remaining`。
   - 存储 `onTick`、`onComplete` 回调。

2. **`start()`**：
   - 如果 `remaining <= 0`，不启动。
   - 如果已有 `intervalId`（已在运行），忽略。
   - 使用 `setInterval` 每 1000ms 执行：`remaining--` → 调用 `onTick(remaining)` → 如果 `remaining <= 0`，调 `clearInterval` + `onComplete()`。

3. **`reset()`**：
   - 调用 `clearInterval(intervalId)`。
   - `remaining = totalSeconds`，`intervalId = null`。
   - 调用 `onTick(remaining)` 通知 UI 复位。

4. **`getRemaining()`**：返回 `remaining`。

5. **`isRunning()`**：返回 `intervalId !== null`。

#### 设计说明

- 倒计时的"时间流逝"由前端 JavaScript 的 `setInterval` 驱动，保证界面流畅无延迟。
- 后端 API 仅用于状态同步和命令下发（启动/复位），不负责驱动前端显示。
- 这避免了网络轮询带来的延迟和闪烁问题。

---

### 任务 9：主控逻辑 & 事件绑定

**文件**：`frontend/public/js/app.js`  
**职责**：作为应用入口，绑定 DOM 元素事件，协调 API 调用和 Timer/UI 更新。

#### 全局状态

```javascript
const TOTAL_SECONDS = 60;
let timer = null;          // CountdownTimer 实例
```

#### 函数清单

| 函数 | 说明 |
|------|------|
| `initApp()` | 应用入口，创建 Timer 实例 + 绑定事件 |
| `bindEvents()` | 为按钮绑定 click 事件 |
| `updateUI(remaining)` | 更新数字、进度条、按钮状态、状态文字 |
| `handleStart()` | 处理"开始"按钮点击 |
| `handleReset()` | 处理"复位"按钮点击 |
| `onTimerComplete()` | 倒计时结束回调 |

#### 实现细节

1. **`initApp()`**：
   - 创建 `CountdownTimer(TOTAL_SECONDS, updateUI, onTimerComplete)`。
   - 调用 `bindEvents()`。
   - 调用 `updateUI(TOTAL_SECONDS)` 初始渲染。

2. **`bindEvents()`**：
   - `document.getElementById('btn-start').addEventListener('click', handleStart)`
   - `document.getElementById('btn-reset').addEventListener('click', handleReset)`

3. **`handleStart()`**：
   - 调用后端 `POST /api/countdown/start`（异步，不阻塞 UI）。
   - 调用前端 `timer.start()` 启动本地倒计时。
   - 后端调用失败时，仍然正常启动前端倒计时（优雅降级）。

4. **`handleReset()`**：
   - 调用后端 `POST /api/countdown/reset`（异步，不阻塞 UI）。
   - 调用前端 `timer.reset()`。
   - 后端调用失败时，仍然正常复位前端倒计时（优雅降级）。

5. **`updateUI(remaining)`**：
   - `#timer-value.textContent = remaining`
   - `#progress-fill.style.width = (remaining / TOTAL_SECONDS) * 100 + '%'`
   - 更新按钮禁用状态：
     - `#btn-start.disabled = timer.isRunning()`
   - 更新状态文字：
     - `timer.isRunning()` → `"倒计时中..."`
     - `remaining === 0` → `"时间到！"`
     - 其他 → `"准备就绪"`
   - 更新 `#app` 的 CSS 类（`.running` / `.finished`）。

6. **`onTimerComplete()`**：
   - `updateUI(0)` 已由 `onTick` 触发。
   - 可额外触发音效或动画（可选）。

#### 脚本加载顺序

在 `index.html` 中按依赖顺序引入：

```html
<script src="js/api.js"></script>
<script src="js/timer.js"></script>
<script src="js/app.js"></script>
<script>
  document.addEventListener('DOMContentLoaded', initApp);
</script>
```

---

## 五、API 接口定义（前后端契约）

### 5.1 接口总览

| 方法 | 端点 | 请求体 | 响应体 |
|------|------|--------|--------|
| `GET` | `/api/countdown/status` | 无 | `CountdownResponse` |
| `POST` | `/api/countdown/start` | 无 | `CountdownResponse` |
| `POST` | `/api/countdown/reset` | 无 | `CountdownResponse` |

### 5.2 数据格式

**`CountdownResponse`**（JSON）：

```json
{
    "remaining": 45,
    "is_running": true
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `remaining` | `integer` | 剩余秒数，范围 0–60 |
| `is_running` | `boolean` | 倒计时是否正在运行 |

### 5.3 状态码

| 状态码 | 场景 |
|--------|------|
| `200 OK` | 所有正常响应 |
| `500 Internal Server Error` | 服务端异常 |

### 5.4 调用时序（典型流程）

```
用户点击 [开始]
  → 前端 POST /api/countdown/start → 后端启动 asyncio 定时器
  → 前端 timer.start() → setInterval 每秒递减

用户点击 [复位]
  → 前端 POST /api/countdown/reset → 后端取消定时器，重置为 60
  → 前端 timer.reset() → clearInterval，恢复显示 60
```

---

## 六、UI 交互说明

### 6.1 页面状态流转

```
      ┌──────────────────────────────────────┐
      │           初始状态（准备就绪）          │
      │  显示: 60  按钮: [开始]可用 [复位]可用   │
      └──────────────┬───────────────────────┘
                     │ 点击 [开始]
                     ▼
      ┌──────────────────────────────────────┐
      │           运行状态（倒计时中）          │
      │  显示: 59→58→...→1  按钮: [开始]禁用   │
      │  进度条递减  状态文字: "倒计时中..."     │
      └──────────────┬───────────────────────┘
                     │
          ┌──────────┼──────────┐
          │ 点击[复位]            │ 倒计时到 0
          ▼                      ▼
      ┌──────────────┐   ┌──────────────────┐
      │  复位到 60   │   │   结束状态         │
      │ (回到初始)    │   │ 显示: 0 "时间到！" │
      └──────────────┘   │ 进度条清空         │
                         │ 按钮: [开始]可用   │
                         └──────────────────┘
```

### 6.2 按钮行为

| 按钮 | 就绪状态 | 运行状态 | 结束状态 |
|------|----------|----------|----------|
| **开始** | 可点击 → 启动倒计时 | 禁用（灰色不可点） | 可点击 → 自动先复位再启动 |
| **复位** | 可点击 → 保持 60 | 可点击 → 中断并复位到 60 | 可点击 → 复位到 60 |

### 6.3 视觉效果

| 状态 | 数字颜色 | 进度条颜色 | 附加效果 |
|------|----------|------------|----------|
| 就绪 | 白色/亮色 | 满条（100%） | 无 |
| 运行中 | 亮绿色 | 从右向左收缩 | 呼吸动画 |
| 结束 | 红色 | 空条（0%） | 闪烁提示 |

### 6.4 边界情况

| 场景 | 处理方式 |
|------|----------|
| 倒计时到 0 | 自动停止，显示"时间到！"，开始按钮恢复可用 |
| 运行中点击复位 | 立即停止，重置为 60，回到就绪状态 |
| 结束时点击开始 | 自动复位到 60 后启动（等同于复位 + 开始） |
| 后端不可用 | 前端优雅降级，本地倒计时正常工作 |
| 页面刷新 | 重新加载，显示 60 就绪状态 |

---

## 七、前后端通信架构图

```
┌─────────────────────────────┐      HTTP/REST       ┌─────────────────────────────┐
│   浏览器 (Browser)           │ ◄──────────────────► │   后端 (Python FastAPI)      │
│                             │                      │                             │
│  ┌───────────────────────┐  │  GET  /api/countdown │  ┌───────────────────────┐  │
│  │  app.js               │  │      /status         │  │  routers/countdown.py │  │
│  │  ├─ handleStart() ────┼──┼──► POST /api/countdown│  │  ├─ get_status()      │  │
│  │  ├─ handleReset() ────┼──┼──►     /start         │  │  ├─ start_countdown() │  │
│  │  └─ updateUI()        │  │  POST /api/countdown │  │  └─ reset_countdown() │  │
│  └───────┬───────────────┘  │      /reset           │  └───────────┬───────────┘  │
│          │                  │                      │              │               │
│  ┌───────▼───────────────┐  │                      │  ┌───────────▼───────────┐  │
│  │  timer.js             │  │  本地 setInterval     │  │  countdown_service.py │  │
│  │  CountdownTimer       │  │  驱动 UI 更新          │  │  CountdownService     │  │
│  │  - start() / reset()  │  │                      │  │  - start() / reset() │  │
│  └───────────────────────┘  │                      │  │  - _run_timer()       │  │
│                             │                      │  └───────────────────────┘  │
│  ┌───────────────────────┐  │                      │                             │
│  │  api.js               │  │                      │  FastAPI @ 0.0.0.0:8000     │
│  │  getStatus()          │  │                      │                             │
│  │  startCountdown()     │  │  Node.js @ 0.0.0.0   │                             │
│  │  resetCountdown()     │  │       :3000           │                             │
│  └───────────────────────┘  │                      │                             │
└─────────────────────────────┘                      └─────────────────────────────┘
```

---

## 八、开发顺序建议

```
         后端先行                         前端跟进                        联调
  ┌─────────────────────┐    ┌─────────────────────────┐    ┌──────────────────┐
  │ 任务3: FastAPI 入口  │    │ 任务4: Node.js 服务器    │    │                  │
  │ 任务1: 服务层       │ →  │ 任务5: HTML 页面         │ →  │ 任务10: 联调验证  │
  │ 任务2: API 路由      │    │ 任务6: CSS 样式          │    │                  │
  └─────────────────────┘    │ 任务7: API 封装          │    └──────────────────┘
                              │ 任务8: 倒计时核心逻辑    │
                              │ 任务9: 主控 & 事件绑定   │
                              └─────────────────────────┘
```

### 里程碑检查点

| 里程碑 | 完成条件 | 验证方式 |
|--------|----------|----------|
| **M1: 后端可用** | 任务 1-3 完成 | `curl http://localhost:8000/api/countdown/status` 返回 `{"remaining":60,"is_running":false}` |
| **M2: 前端可访问** | 任务 4-5 完成 | 浏览器访问 `http://localhost:3000` 看到静态页面 |
| **M3: 功能完成** | 任务 6-9 完成 | 点击开始按钮 → 倒计时递减；点击复位 → 回到 60 |
| **M4: 联调通过** | 任务 10 完成 | 后端运行中，前端全部功能正常，按钮与 API 联动正确 |

---

## 九、验收标准

| 编号 | 验收项 | 预期结果 |
|------|--------|----------|
| AC-1 | 页面加载 | 显示 "60" + 开始按钮(可用) + 复位按钮(可用) |
| AC-2 | 点击"开始" | 从 60 开始每秒递减，开始按钮变灰禁用 |
| AC-3 | 倒计时到 0 | 显示 "0" + "时间到！"，进度条清空，开始按钮恢复 |
| AC-4 | 运行中点击"复位" | 立即停止倒计时，恢复显示 "60"，按钮恢复就绪状态 |
| AC-5 | 点击"复位"（就绪状态） | 保持显示 "60"，无变化 |
| AC-6 | 后端 API 可访问 | `curl` 三个端点均返回正确 JSON |
| AC-7 | 前端优雅降级 | 后端不可用时，前端倒计时仍可正常工作 |
| AC-8 | CORS 配置 | 前端无跨域错误 |
| AC-9 | 多次点击"开始" | 不会启动多个倒计时（幂等） |

---

> **文档版本**：v1.0  
> **下次更新时机**：需求变更或技术方案调整时
