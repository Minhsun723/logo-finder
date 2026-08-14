from __future__ import annotations

from fastapi.testclient import TestClient

import app.main as main


class StubService:
    def get_category(self, category_id):
        return [{"id": "1", "name": "作品", "logo": None, "source": ["tv_common"]}]

    def search(self, keyword, page=1):
        return [{"id": "2", "name": keyword, "category": "電影", "logo": None, "source": ["search"]}]

    def suggest(self, keyword):
        return [keyword]


def test_public_routes(monkeypatch):
    monkeypatch.setattr(main, "get_service", lambda: StubService())
    client = TestClient(main.app)
    assert client.get("/api/health").json() == {"status": "ok"}
    assert len(client.get("/api/categories").json()["categories"]) == 8
    assert client.get("/api/categories/anime").json()["count"] == 1
    assert client.get("/api/search", params={"q": "作品"}).json()["items"][0]["category"] == "電影"
    assert client.get("/api/suggest", params={"q": "作品"}).json()["suggestions"] == ["作品"]


def test_route_validation(monkeypatch):
    monkeypatch.setattr(main, "get_service", lambda: StubService())
    client = TestClient(main.app)
    assert client.get("/api/categories/unknown").status_code == 404
    assert client.get("/api/search", params={"q": "   "}).status_code == 422
    assert client.get("/api/search", params={"q": "a" * 101}).status_code == 422
