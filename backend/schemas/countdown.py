from pydantic import BaseModel


class CountdownStatus(BaseModel):
    """倒计时状态模型（服务层 + API 共用基类）"""
    remaining: int       # 剩余秒数 (0-60)
    is_running: bool     # 是否正在倒计时


class CountdownResponse(CountdownStatus):
    """API 响应模型（继承自 CountdownStatus，未来可扩展额外字段）"""
    pass
