/**
 * 60秒倒计时 — 前端业务逻辑
 * 三态状态机：IDLE | RUNNING | FINISHED
 * 三重防多定时器保护：状态判断 + 按钮禁用 + 防御性清理
 */
'use strict';

/* ============================================
   常量
   ============================================ */
const DEFAULT_SECONDS = 60;
const TICK_INTERVAL_MS = 1000;

/* ============================================
   状态变量
   ============================================ */
let remainingSeconds = DEFAULT_SECONDS;
let timerId = null;
let state = 'IDLE';   // 'IDLE' | 'RUNNING' | 'FINISHED'

/* ============================================
   DOM 元素引用 (在 DOMContentLoaded 中初始化)
   ============================================ */
let displayEl;
let btnStartEl;
let btnResetEl;

/* ============================================
   核心函数
   ============================================ */

/**
 * 更新 DOM 显示。
 * 将 #countdown-display 的 textContent 设为 remainingSeconds。
 */
function updateDisplay() {
  displayEl.textContent = remainingSeconds;
}

/**
 * 根据当前状态更新按钮的启用/禁用状态。
 * RUNNING: 开始按钮禁用, 复位按钮启用
 * IDLE / FINISHED: 两个按钮均启用
 */
function updateButtonStates() {
  if (state === 'RUNNING') {
    btnStartEl.disabled = true;
  } else {
    btnStartEl.disabled = false;
  }
  // 复位按钮始终保持启用
  btnResetEl.disabled = false;
}

/**
 * 停止并清除定时器。
 * - 调用 clearInterval(timerId)
 * - 将 timerId 置为 null
 * - 幂等操作：timerId 为 null 时直接返回
 */
function stopTimer() {
  if (timerId !== null) {
    clearInterval(timerId);
    timerId = null;
  }
}

/**
 * 启动定时器。
 * - 使用 setInterval 每秒调用一次 tick()
 * - 将返回的定时器 ID 存入 timerId
 * - 调用前做防御性检查：如果 timerId !== null，先 stopTimer()
 */
function startTimer() {
  // 防御性清理：确保没有残留定时器
  if (timerId !== null) {
    stopTimer();
  }
  timerId = setInterval(tick, TICK_INTERVAL_MS);
}

/**
 * 每秒钟执行一次的定时器回调。
 * - remainingSeconds 减 1
 * - 更新显示
 * - 如果 remainingSeconds <= 0：停止定时器，进入 FINISHED 状态，添加样式
 */
function tick() {
  remainingSeconds -= 1;
  updateDisplay();

  if (remainingSeconds <= 0) {
    remainingSeconds = 0;  // 防止出现负数
    stopTimer();
    state = 'FINISHED';
    displayEl.classList.add('finished');
    updateButtonStates();
  }
}

/**
 * 启动倒计时。
 * - 仅在 state === 'IDLE' 或 state === 'FINISHED' 时有效
 * - 如果 state === 'FINISHED'，先将 remainingSeconds 重置为 60
 * - 将 state 设为 'RUNNING'
 * - 禁用"开始"按钮
 * - 移除数字的 .finished 样式类（如果有）
 * - 调用 startTimer()
 */
function startCountdown() {
  // 状态守卫：只有 IDLE 或 FINISHED 状态才能启动
  if (state === 'RUNNING') {
    return;
  }

  if (state === 'FINISHED') {
    remainingSeconds = DEFAULT_SECONDS;
  }

  state = 'RUNNING';
  displayEl.classList.remove('finished');
  updateButtonStates();
  updateDisplay();
  startTimer();
}

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
function resetCountdown() {
  stopTimer();
  remainingSeconds = DEFAULT_SECONDS;
  state = 'IDLE';
  displayEl.classList.remove('finished');
  updateButtonStates();
  updateDisplay();
}

/* ============================================
   初始化
   ============================================ */

/**
 * 初始化应用：绑定 DOM 引用、注册事件监听、设置初始显示。
 * 在 DOMContentLoaded 事件中调用。
 */
function init() {
  displayEl = document.getElementById('countdown-display');
  btnStartEl = document.getElementById('btn-start');
  btnResetEl = document.getElementById('btn-reset');

  // 初始显示
  updateDisplay();
  updateButtonStates();

  // 事件绑定
  btnStartEl.addEventListener('click', startCountdown);
  btnResetEl.addEventListener('click', resetCountdown);
}

// DOM 就绪后初始化
document.addEventListener('DOMContentLoaded', init);
