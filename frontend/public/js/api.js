/**
 * api.js — 后端 API 调用封装
 * 封装对后端 FastAPI 的 fetch 调用，统一错误处理。
 */

// 优先使用注入配置，回退到同协议同主机的 8000 端口
const API_BASE_URL = window.COUNTDOWN_API_URL
    || `${window.location.protocol}//${window.location.hostname}:8000/api/countdown`;

/**
 * 调用 GET /api/countdown/status
 * @returns {{remaining: number, is_running: boolean}}
 */
async function getStatus() {
    try {
        const response = await fetch(`${API_BASE_URL}/status`, {
            method: 'GET',
        });
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error('[api.js] getStatus() 失败:', error.message);
        return { remaining: 60, is_running: false };
    }
}

/**
 * 调用 POST /api/countdown/start
 * @returns {{remaining: number, is_running: boolean}}
 */
async function startCountdown() {
    try {
        const response = await fetch(`${API_BASE_URL}/start`, {
            method: 'POST',
        });
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error('[api.js] startCountdown() 失败:', error.message);
        return { remaining: 60, is_running: false };
    }
}

/**
 * 调用 POST /api/countdown/reset
 * @returns {{remaining: number, is_running: boolean}}
 */
async function resetCountdown() {
    try {
        const response = await fetch(`${API_BASE_URL}/reset`, {
            method: 'POST',
        });
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error('[api.js] resetCountdown() 失败:', error.message);
        return { remaining: 60, is_running: false };
    }
}
