from __future__ import annotations

import logging
import time

from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.services.iqiyi import CATEGORIES, IqiyiError, IqiyiService

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")

app = FastAPI(title="Ascooo Logo API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.frontend_origins),
    allow_credentials=False,
    allow_methods=["GET"],
    allow_headers=["*"],
)


def get_service() -> IqiyiService:
    return IqiyiService()


@app.middleware("http")
async def log_request(request: Request, call_next):
    started = time.perf_counter()
    response = await call_next(request)
    logging.getLogger("api").info("route=%s status=%d duration_ms=%d", request.url.path, response.status_code, (time.perf_counter() - started) * 1000)
    return response


@app.exception_handler(IqiyiError)
async def iqiyi_error_handler(_request: Request, exc: IqiyiError):
    status_code = 503 if exc.code in {"UPSTREAM_ERROR", "CONFIGURATION_ERROR"} else 500
    return JSONResponse(status_code=status_code, content={"error": {"code": exc.code, "message": str(exc)}})


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/categories")
def categories():
    return {"categories": [{"id": category_id, "name": config["name"]} for category_id, config in CATEGORIES.items()]}


@app.get("/api/categories/{category_id}")
def category(category_id: str):
    if category_id not in CATEGORIES:
        raise HTTPException(status_code=404, detail={"code": "CATEGORY_NOT_FOUND", "message": "找不到指定分類"})
    items = get_service().get_category(category_id)
    return {"category": {"id": category_id, "name": CATEGORIES[category_id]["name"]}, "count": len(items), "items": items}


@app.get("/api/search")
def search(q: str = Query(min_length=1, max_length=100), page: int = Query(1, ge=1, le=20)):
    keyword = q.strip()
    if not keyword:
        raise HTTPException(status_code=422, detail={"code": "INVALID_QUERY", "message": "請輸入搜尋關鍵字"})
    items = get_service().search(keyword, page=page)
    return {"query": keyword, "count": len(items), "items": items}


@app.get("/api/suggest")
def suggest(q: str = Query(min_length=1, max_length=100)):
    keyword = q.strip()
    if not keyword:
        raise HTTPException(status_code=422, detail={"code": "INVALID_QUERY", "message": "請輸入搜尋關鍵字"})
    suggestions = get_service().suggest(keyword)
    return {"query": keyword, "suggestions": suggestions}
