/**
 * app.js — 主控逻辑：事件绑定、UI 更新、与 API/timer 协调
 */

const TOTAL_SECONDS = 60;
let timer = null; // CountdownTimer 实例

/**
 * 应用入口：创建 Timer 实例 + 绑定事件 + 初始渲染
 */
function initApp() {
    timer = new CountdownTimer(TOTAL_SECONDS, updateUI, onTimerComplete);
    bindEvents();
    updateUI(TOTAL_SECONDS);
}

/**
 * 为按钮绑定 click 事件
 */
function bindEvents() {
    const btnStart = document.getElementById('btn-start');
    const btnReset = document.getElementById('btn-reset');

    if (btnStart) {
        btnStart.addEventListener('click', handleStart);
    }
    if (btnReset) {
        btnReset.addEventListener('click', handleReset);
    }
}

/**
 * 更新 UI：数字、进度条、按钮状态、状态文字、CSS 类
 * @param {number} remaining - 当前剩余秒数
 */
function updateUI(remaining) {
    // 更新数字
    const timerValue = document.getElementById('timer-value');
    if (timerValue) {
        timerValue.textContent = remaining;
    }

    // 更新进度条
    const progressFill = document.getElementById('progress-fill');
    if (progressFill) {
        progressFill.style.width = (remaining / TOTAL_SECONDS) * 100 + '%';
    }

    // 更新按钮状态
    const btnStart = document.getElementById('btn-start');
    if (btnStart) {
        btnStart.disabled = timer.isRunning();
    }

    // 更新状态文字
    const statusText = document.getElementById('status-text');
    if (statusText) {
        if (timer.isRunning()) {
            statusText.textContent = '倒计时中...';
        } else if (remaining === 0) {
            statusText.textContent = '时间到！';
        } else {
            statusText.textContent = '准备就绪';
        }
    }

    // 更新容器 CSS 类
    const app = document.getElementById('app');
    if (app) {
        app.classList.remove('running', 'finished');
        if (timer.isRunning()) {
            app.classList.add('running');
        } else if (remaining === 0) {
            app.classList.add('finished');
        }
    }
}

/**
 * 处理"开始"按钮点击
 * - 调用后端 POST /start（异步，不阻塞 UI）
 * - 调用前端 timer.start()
 * - 后端失败时优雅降级：前端倒计时仍正常工作
 */
function handleStart() {
    // 异步调用后端（不阻塞 UI）
    startCountdown().catch(() => {
        // 后端调用失败，优雅降级：前端倒计时继续工作
    });

    // 如果倒计时已结束，先复位再启动
    if (timer.getRemaining() <= 0) {
        timer.reset();
    }

    timer.start();
}

/**
 * 处理"复位"按钮点击
 * - 调用后端 POST /reset（异步，不阻塞 UI）
 * - 调用前端 timer.reset()
 * - 后端失败时优雅降级：前端倒计时仍正常复位
 */
function handleReset() {
    // 异步调用后端（不阻塞 UI）
    resetCountdown().catch(() => {
        // 后端调用失败，优雅降级：前端倒计时继续工作
    });

    timer.reset();
}

/**
 * 倒计时结束回调
 * - updateUI(0) 已由 onTick 触发，此处可额外处理
 */
function onTimerComplete() {
    // 可在此处添加音效或额外动画
}
