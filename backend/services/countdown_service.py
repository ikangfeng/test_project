import asyncio
from typing import Optional
from schemas.countdown import CountdownStatus


class CountdownService:
    """倒计时单例服务，管理全局唯一倒计时状态"""

    def __init__(self):
        self._remaining: int = 60
        self._is_running: bool = False
        self._total_seconds: int = 60
        self._task: Optional[asyncio.Task] = None
        self._lock: asyncio.Lock = asyncio.Lock()

    def get_status(self) -> CountdownStatus:
        """返回当前剩余秒数 + 运行状态（同步读取，无需锁，asyncio 单线程）"""
        return CountdownStatus(
            remaining=self._remaining,
            is_running=self._is_running,
        )

    async def start(self) -> CountdownStatus:
        """启动倒计时（从当前剩余值开始递减）"""
        async with self._lock:
            # 如果已经在运行，幂等忽略
            if self._is_running:
                return CountdownStatus(
                    remaining=self._remaining,
                    is_running=self._is_running,
                )

            # 如果剩余秒数 <= 0，自动复位后再启动
            if self._remaining <= 0:
                self._do_reset()

            self._is_running = True
            self._task = asyncio.create_task(self._run_timer())

            return CountdownStatus(
                remaining=self._remaining,
                is_running=self._is_running,
            )

    async def reset(self) -> CountdownStatus:
        """停止倒计时并将剩余秒数复位为 60"""
        async with self._lock:
            self._do_reset()
            return CountdownStatus(
                remaining=self._remaining,
                is_running=self._is_running,
            )

    def _do_reset(self):
        """内部复位逻辑（需在锁内调用）"""
        if self._task is not None and not self._task.done():
            self._task.cancel()
        self._task = None
        self._remaining = self._total_seconds
        self._is_running = False

    async def _run_timer(self) -> None:
        """内部异步方法，每秒递减 _remaining，到 0 自动停止"""
        try:
            while self._remaining > 0:
                await asyncio.sleep(1)
                async with self._lock:
                    self._remaining -= 1
                    if self._remaining <= 0:
                        self._remaining = 0
                        self._is_running = False
                        self._task = None
                        break
        except asyncio.CancelledError:
            # 任务被取消（如 reset 调用），正常退出
            pass


# 全局单例（模块加载时创建，彻底消除惰性初始化的竞态条件）
_countdown_service: CountdownService = CountdownService()


def get_countdown_service() -> CountdownService:
    """返回全局单例 CountdownService 实例"""
    return _countdown_service
