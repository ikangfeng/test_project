/**
 * timer.js — 倒计时核心逻辑（客户端）
 * 管理前端本地倒计时状态，使用 setInterval 驱动每秒递减，
 * 通过回调机制驱动 UI 更新。
 */

class CountdownTimer {
    /**
     * @param {number} totalSeconds - 倒计时总秒数（默认 60）
     * @param {function(number): void} onTick - 每秒回调，参数为当前剩余秒数
     * @param {function(): void} onComplete - 倒计时结束回调
     */
    constructor(totalSeconds, onTick, onComplete) {
        this.totalSeconds = totalSeconds;
        this.remaining = totalSeconds;
        this.intervalId = null;
        this.onTick = onTick;
        this.onComplete = onComplete;
    }

    /**
     * 启动倒计时
     * - 如果 remaining <= 0，不启动
     * - 如果已经在运行，忽略（幂等）
     */
    start() {
        if (this.remaining <= 0) {
            return;
        }
        if (this.intervalId !== null) {
            return; // 已在运行，幂等
        }

        this.intervalId = setInterval(() => {
            this.remaining--;
            this.onTick(this.remaining);

            if (this.remaining <= 0) {
                this._stop();
                this.onComplete();
            }
        }, 1000);
    }

    /**
     * 复位倒计时
     * - 清除定时器
     * - 剩余秒数恢复为 totalSeconds
     * - 通知 UI 复位
     */
    reset() {
        this._stop();
        this.remaining = this.totalSeconds;
        this.onTick(this.remaining);
    }

    /**
     * 获取当前剩余秒数
     * @returns {number}
     */
    getRemaining() {
        return this.remaining;
    }

    /**
     * 是否正在运行
     * @returns {boolean}
     */
    isRunning() {
        return this.intervalId !== null;
    }

    /**
     * 内部：停止定时器
     */
    _stop() {
        if (this.intervalId !== null) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }
}
