from __future__ import annotations

import unittest

from app.config import Settings
from app.services.iqiyi import IqiyiService, get_title_image, merge_items


class FakeResponse:
    status_code = 200

    def __init__(self, payload):
        self.payload = payload

    def raise_for_status(self):
        return None

    def json(self):
        return self.payload


class FakeSession:
    def __init__(self, payloads):
        self.payloads = list(payloads)
        self.calls = []

    def get(self, url, **kwargs):
        self.calls.append((url, kwargs))
        return FakeResponse(self.payloads.pop(0))


SETTINGS = Settings(device_id="device", uuid="uuid", sid="sid")


class IqiyiServiceTests(unittest.TestCase):
    def test_get_title_image_prefers_title_image(self):
        result = get_title_image({"focusImage": {"focusImagesWithLang": [
            {"type": "poster", "imageUrl": "poster"},
            {"type": "title_image", "imageUrl": "logo", "imageUrlWebp": "webp", "resolution": "100x40"},
        ]}})
        self.assertEqual(result, {"url": "logo", "webp": "webp", "resolution": "100x40"})

    def test_merge_prefers_id_and_fills_logo(self):
        first = {"id": "1", "qipuId": "1", "name": "作品", "logo": None, "poster": None, "channelId": 4, "category": "動漫", "source": ["albumList"]}
        second = {**first, "logo": {"url": "logo"}, "source": ["tv_common"]}
        result = merge_items([first], [second])
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["logo"]["url"], "logo")
        self.assertEqual(result[0]["source"], ["albumList", "tv_common"])

    def test_tv_common_overlays_next_url_on_original_params(self):
        session = FakeSession([
            {"code": 0, "base": {"has_next": True, "next_url": "https://api.iq.com/page/tv_common?opaque=1"}},
            {"code": 0, "base": {"has_next": False}},
        ])
        service = IqiyiService(SETTINGS, session)
        service._collect_tv_common({"name": "動漫", "page_st": "anime_TV", "channel_id": 4})
        self.assertIsNotNone(session.calls[0][1]["params"])
        second_params = session.calls[1][1]["params"]
        self.assertEqual(second_params["opaque"], "1")
        self.assertEqual(second_params["sid"], "sid")
        self.assertEqual(second_params["qyid"], "device")
        self.assertEqual(session.calls[1][0], "https://api.iq.com/page/tv_common")

    def test_search_uses_response_channel_category(self):
        session = FakeSession([{"code": 0, "epg": [{"qipuId": 9, "name": "電影作品", "chnId": 1, "albumPic": "poster"}]}])
        item = IqiyiService(SETTINGS, session).search("電影作品")[0]
        self.assertEqual(item["category"], "電影")
        self.assertEqual(item["channelId"], 1)


if __name__ == "__main__":
    unittest.main()
