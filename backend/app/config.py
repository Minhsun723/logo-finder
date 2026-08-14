from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    device_id: str
    uuid: str
    sid: str
    app_version: str = "10.7.5"
    lang: str = "zh_tw"
    frontend_origins: tuple[str, ...] = ("http://localhost:5173",)
    request_timeout: float = 30.0

    @classmethod
    def from_env(cls) -> "Settings":
        origins = tuple(
            origin.strip()
            for origin in os.getenv("FRONTEND_ORIGINS", "http://localhost:5173").split(",")
            if origin.strip()
        )
        return cls(
            device_id=os.getenv("IQIYI_DEVICE_ID", "").strip(),
            uuid=os.getenv("IQIYI_UUID", "").strip(),
            sid=os.getenv("IQIYI_SID", "").strip(),
            app_version=os.getenv("IQIYI_APP_VERSION", "10.7.5").strip(),
            lang=os.getenv("IQIYI_LANG", "zh_tw").strip(),
            frontend_origins=origins,
            request_timeout=float(os.getenv("IQIYI_REQUEST_TIMEOUT", "30")),
        )


settings = Settings.from_env()
