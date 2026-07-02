from fastapi import APIRouter

from schemas.countdown import CountdownResponse
from services.countdown_service import get_countdown_service

router = APIRouter()


@router.get("/status", response_model=CountdownResponse)
async def get_status():
    """GET /api/countdown/status — 返回当前剩余秒数和运行状态"""
    service = get_countdown_service()
    return service.get_status()


@router.post("/start", response_model=CountdownResponse)
async def start_countdown():
    """POST /api/countdown/start — 启动倒计时"""
    service = get_countdown_service()
    return await service.start()


@router.post("/reset", response_model=CountdownResponse)
async def reset_countdown():
    """POST /api/countdown/reset — 复位倒计时到60秒"""
    service = get_countdown_service()
    return await service.reset()
