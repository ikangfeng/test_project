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
