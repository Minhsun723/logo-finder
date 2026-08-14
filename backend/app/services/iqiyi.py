from __future__ import annotations

import logging
import re
import time
from collections.abc import Callable, Iterable, Iterator
from typing import Any
from urllib.parse import parse_qsl, urljoin, urlparse

import requests
from rapidfuzz import fuzz

from app.config import Settings, settings

logger = logging.getLogger(__name__)

ALBUM_LIST_URL = "https://tv-api2.iq.com/api/albumList"
TV_COMMON_URL = "https://api.iq.com/page/tv_common"
SEARCH_URL = "https://tv-api2.iq.com/api/search"
SUGGEST_URL = "https://tv-api2.iq.com/api/suggest"
PLATFORM = "PLAY_PLATFORM_ANDROID_TV_INTERNATIONAL_IQIYI"

CATEGORIES: dict[str, dict[str, Any]] = {
    "recommend": {"name": "推薦", "page_st": "tv_recommend_new", "channel_id": 0, "use_album": False},
    "drama": {"name": "戲劇", "page_st": "drama_TV", "channel_id": 2, "use_album": True},
    "movie": {"name": "電影", "page_st": "movie_TV", "channel_id": 1, "use_album": True},
    "free": {"name": "免費", "page_st": "TW_free_TV", "channel_id": 0, "use_album": False},
    "anime": {"name": "動漫", "page_st": "anime_TV", "channel_id": 4, "use_album": True},
    "kids": {"name": "兒童", "page_st": "child_TV", "channel_id": 15, "use_album": True},
    "entertainment": {"name": "娛樂", "page_st": "entertainment_TV", "channel_id": 7, "use_album": True},
    "variety": {"name": "綜藝", "page_st": "variety_TV", "channel_id": 6, "use_album": True},
}

CHANNEL_LABELS = {1: "電影", 2: "戲劇", 4: "動漫", 6: "綜藝", 7: "娛樂", 15: "兒童"}


class IqiyiError(RuntimeError):
    code = "IQIYI_ERROR"


class IqiyiConfigurationError(IqiyiError):
    code = "CONFIGURATION_ERROR"


class IqiyiUpstreamError(IqiyiError):
    code = "UPSTREAM_ERROR"


def normalize_text(value: Any) -> str:
    if not isinstance(value, str):
        return ""
    return re.sub(r"[\s\-_:：·・,.，。!！?？【】\[\]()（）~～]+", "", value.lower().strip())


def walk_json(value: Any) -> Iterator[dict[str, Any]]:
    if isinstance(value, dict):
        yield value
        for child in value.values():
            yield from walk_json(child)
    elif isinstance(value, list):
        for child in value:
            yield from walk_json(child)


def get_title_image(epg: dict[str, Any]) -> dict[str, Any] | None:
    focus = epg.get("focusImage")
    if not isinstance(focus, dict):
        return None
    images = focus.get("focusImagesWithLang")
    if not isinstance(images, list):
        return None
    for image in images:
        if isinstance(image, dict) and image.get("type") == "title_image":
            url = image.get("imageUrl") or image.get("imageUrlWebp")
            if not url:
                return None
            return {"url": url, "webp": image.get("imageUrlWebp"), "resolution": image.get("resolution")}
    return None


def _as_string(value: Any) -> str | None:
    return str(value) if value not in (None, "") else None


def _category_from_object(obj: dict[str, Any]) -> tuple[str, int | None]:
    for key in ("chnId", "channelId", "channel_id"):
        try:
            channel_id = int(obj[key])
        except (KeyError, TypeError, ValueError):
            continue
        if channel_id in CHANNEL_LABELS:
            return CHANNEL_LABELS[channel_id], channel_id
    for key in ("channelName", "categoryName", "category", "channel"):
        label = obj.get(key)
        if isinstance(label, str) and label.strip():
            return label.strip(), None
    return "線上搜尋", None


def normalize_item(
    obj: dict[str, Any], *, category: str, channel_id: int | None, source: str,
    name: str | None = None, logo: dict[str, Any] | None = None, poster: str | None = None,
) -> dict[str, Any] | None:
    title = name or obj.get("name") or obj.get("shortName") or obj.get("albumName")
    if not isinstance(title, str) or not title.strip():
        return None
    title = title.strip()
    qipu_id = obj.get("qipuId") or obj.get("albumId") or obj.get("album_id")
    alternatives = obj.get("alternativeTitles")
    if not isinstance(alternatives, list):
        alternatives = []
    alternatives = [item for item in alternatives if isinstance(item, str) and item.strip()]
    logo_data = logo if logo is not None else get_title_image(obj)
    stable_id = _as_string(qipu_id) or f"title:{normalize_text(title)}"
    return {
        "id": stable_id,
        "qipuId": _as_string(qipu_id),
        "name": title,
        "shortName": obj.get("shortName") if isinstance(obj.get("shortName"), str) else title,
        "alternativeTitles": alternatives,
        "category": category,
        "channelId": channel_id,
        "logo": logo_data,
        "poster": poster or obj.get("albumPic") or obj.get("posterPic"),
        "source": [source],
    }


def calculate_score(keyword: str, item: dict[str, Any]) -> float:
    keyword_norm = normalize_text(keyword)
    if not keyword_norm:
        return 0
    texts = [item.get("name"), item.get("shortName"), *(item.get("alternativeTitles") or [])]
    best = 0.0
    for text in texts:
        text_norm = normalize_text(text)
        if not text_norm:
            continue
        if keyword_norm == text_norm:
            score = 100
        elif keyword_norm in text_norm:
            score = 99
        elif text_norm in keyword_norm:
            score = 95
        else:
            score = max(fuzz.partial_ratio(keyword_norm, text_norm), fuzz.ratio(keyword_norm, text_norm), fuzz.token_set_ratio(keyword_norm, text_norm))
        best = max(best, score)
    return best


def merge_items(*groups: Iterable[dict[str, Any]]) -> list[dict[str, Any]]:
    merged: dict[str, dict[str, Any]] = {}
    name_keys: dict[str, str] = {}
    for group in groups:
        for incoming in group:
            item = dict(incoming)
            id_key = f"id:{item['qipuId']}" if item.get("qipuId") else ""
            title_key = f"name:{normalize_text(item.get('name'))}"
            key = id_key or name_keys.get(title_key) or title_key
            if key not in merged:
                merged[key] = item
                name_keys[title_key] = key
                continue
            current = merged[key]
            for field in ("qipuId", "logo", "poster", "channelId"):
                if not current.get(field) and item.get(field):
                    current[field] = item[field]
            if current.get("category") == "線上搜尋" and item.get("category") != "線上搜尋":
                current["category"] = item["category"]
            current["source"] = sorted(set(current.get("source", [])) | set(item.get("source", [])))
    return list(merged.values())


class IqiyiService:
    def __init__(self, config: Settings = settings, session: requests.Session | None = None):
        self.config = config
        self.session = session or requests.Session()
        self.headers = {"User-Agent": "Dalvik/2.1.0 (Linux; U; Android 12; G4QUR)", "Accept": "*/*"}

    def _require_credentials(self) -> None:
        missing = [name for name, value in (("DEVICE_ID", self.config.device_id), ("UUID", self.config.uuid), ("SID", self.config.sid)) if not value]
        if missing:
            raise IqiyiConfigurationError(f"缺少 backend 環境設定：{', '.join(missing)}")

    def _get_json(self, url: str, *, params: dict[str, Any] | None = None, endpoint: str) -> dict[str, Any]:
        started = time.perf_counter()
        try:
            response = self.session.get(url, params=params, headers=self.headers, timeout=self.config.request_timeout)
            response.raise_for_status()
            data = response.json()
        except (requests.RequestException, ValueError) as exc:
            logger.warning("upstream=%s duration_ms=%d error=%s", endpoint, (time.perf_counter() - started) * 1000, type(exc).__name__)
            raise IqiyiUpstreamError(f"上游服務 {endpoint} 目前無法使用") from exc
        logger.info("upstream=%s duration_ms=%d status=%s", endpoint, (time.perf_counter() - started) * 1000, response.status_code)
        if str(data.get("code")) != "0":
            raise IqiyiUpstreamError(f"上游服務 {endpoint} 回傳錯誤")
        return data

    def _tv_params(self, category: dict[str, Any]) -> dict[str, Any]:
        return {
            "psp_cki": "", "p_dolby": "0", "psp_status": "-1", "app_k": "2000400640732025191c59412825e350",
            "net_sts": "1", "timezone": "GMT+8", "pg_num": "1", "page_st": category["page_st"], "platform": PLATFORM,
            "sid": self.config.sid, "psp_uid": "", "req_sn": str(int(time.time() * 1000)), "uid": "", "p_4k": "1",
            "app_v": self.config.app_version, "lang": self.config.lang, "dev_ua": "G4QUR", "dev_os": "12", "pg_size": "10",
            "qyid": self.config.device_id, "platform_id": "49", "secure_p": "GPhone", "app_lm": "ntw", "card_v": "v1",
            "secure_v": "1", "channel_id": str(category["channel_id"]),
        }

    def _extract_tv_items(self, data: dict[str, Any], category: dict[str, Any]) -> list[dict[str, Any]]:
        items = []
        for obj in walk_json(data):
            kv = obj.get("kv_pair")
            if isinstance(kv, dict) and isinstance(kv.get("display_name"), str):
                qipu_id = None
                actions = obj.get("actions") if isinstance(obj.get("actions"), dict) else {}
                click_event = actions.get("click_event") if isinstance(actions.get("click_event"), dict) else {}
                action_data = click_event.get("data") if isinstance(click_event.get("data"), dict) else {}
                if isinstance(action_data, dict):
                    qipu_id = action_data.get("album_id") or action_data.get("tv_id")
                shaped = dict(obj, qipuId=qipu_id)
                logo_url = kv.get("image_title")
                logo = {"url": logo_url, "webp": logo_url, "resolution": None} if logo_url else None
                image = obj.get("image") if isinstance(obj.get("image"), dict) else {}
                item = normalize_item(shaped, category=category["name"], channel_id=category["channel_id"], source="tv_common", name=kv["display_name"], logo=logo, poster=image.get("url"))
                if item:
                    items.append(item)
            if isinstance(obj.get("focusImage"), dict):
                item = normalize_item(obj, category=category["name"], channel_id=category["channel_id"], source="tv_common")
                if item and item["logo"]:
                    items.append(item)
        return merge_items(items)

    def _collect_tv_common(self, category: dict[str, Any]) -> list[dict[str, Any]]:
        params = self._tv_params(category)
        url = TV_COMMON_URL
        items: list[dict[str, Any]] = []
        for _request_count in range(50):
            data = self._get_json(url, params=params, endpoint="tv_common")
            items.extend(self._extract_tv_items(data, category))
            base = data.get("base") if isinstance(data.get("base"), dict) else {}
            next_url = base.get("next_url") if base.get("has_next") else None
            if not isinstance(next_url, str) or not next_url:
                break

            # tv_common currently returns only the fields that change for the
            # next page. Keep the device/session parameters from page one and
            # overlay the pagination fields supplied by upstream.
            parsed_next = urlparse(urljoin(TV_COMMON_URL, next_url))
            if parsed_next.hostname != "api.iq.com":
                raise IqiyiUpstreamError("上游服務回傳了不安全的分頁網址")

            next_params = dict(parse_qsl(parsed_next.query, keep_blank_values=True))
            if not next_params:
                break

            params.update(next_params)
            params["req_sn"] = str(int(time.time() * 1000))
            url = f"{parsed_next.scheme}://{parsed_next.netloc}{parsed_next.path}"
        return merge_items(items)

    def _album_params(self, channel_id: int, page: int, page_size: int = 60) -> dict[str, Any]:
        return {
            "chnId": str(channel_id), "p_dolby": "0", "ps": str(page_size), "apkVer": self.config.app_version,
            "langCode": self.config.lang, "gps": "1", "ua": "G4QUR", "deviceId": self.config.device_id,
            "uuid": self.config.uuid, "platform": PLATFORM, "sid": self.config.sid, "network": "1", "uid": "",
            "sdkintVer": "32", "p_4k": "1", "modeCode": "ntw", "pspStatus": "-1", "tagValues": "",
            "pn": str(page), "macAddr": self.config.device_id,
        }

    def _collect_album_list(self, category: dict[str, Any]) -> list[dict[str, Any]]:
        items: list[dict[str, Any]] = []
        page_size = 60
        for page in range(1, 101):
            data = self._get_json(ALBUM_LIST_URL, params=self._album_params(category["channel_id"], page, page_size), endpoint="albumList")
            epgs = data.get("epg") if isinstance(data.get("epg"), list) else []
            if not epgs:
                break
            for epg in epgs:
                if isinstance(epg, dict):
                    item = normalize_item(epg, category=category["name"], channel_id=category["channel_id"], source="albumList")
                    if item:
                        items.append(item)
            try:
                total = int(data.get("total", 0))
            except (TypeError, ValueError):
                total = 0
            if total and page * page_size >= total:
                break
        return merge_items(items)

    def get_category(self, category_id: str) -> list[dict[str, Any]]:
        self._require_credentials()
        category = CATEGORIES[category_id]
        album_items = self._collect_album_list(category) if category["use_album"] else []
        tv_items = self._collect_tv_common(category)
        result = merge_items(album_items, tv_items)
        result.sort(key=lambda item: normalize_text(item["name"]))
        logger.info("category=%s normalized_count=%d", category_id, len(result))
        return result

    def search(self, keyword: str, page: int = 1, page_size: int = 24) -> list[dict[str, Any]]:
        self._require_credentials()
        params = self._album_params(0, page, page_size)
        params.update({"key": keyword, "pn": str(page)})
        data = self._get_json(SEARCH_URL, params=params, endpoint="search")
        items = []
        for obj in walk_json(data):
            qipu_id = obj.get("qipuId") or obj.get("albumId") or obj.get("album_id")
            if not (qipu_id or "focusImage" in obj or "albumPic" in obj or "posterPic" in obj):
                continue
            category, channel_id = _category_from_object(obj)
            item = normalize_item(obj, category=category, channel_id=channel_id, source="search")
            if item:
                items.append(item)
        result = merge_items(items)
        result.sort(key=lambda item: (calculate_score(keyword, item), bool(item.get("logo"))), reverse=True)
        logger.info("upstream=search normalized_count=%d", len(result))
        return result

    def suggest(self, keyword: str) -> list[str]:
        self._require_credentials()
        params = self._album_params(0, 1, 12)
        params["key"] = keyword
        data = self._get_json(SUGGEST_URL, params=params, endpoint="suggest")
        suggestions: list[str] = []
        for obj in walk_json(data):
            for key in ("name", "word", "keyword", "query", "text"):
                value = obj.get(key)
                if isinstance(value, str) and value.strip() and value.strip() not in suggestions:
                    suggestions.append(value.strip())
        return suggestions[:12]
