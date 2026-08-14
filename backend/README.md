# iQIYI Logo API

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements-dev.txt
Copy-Item .env.example .env
uvicorn app.main:app --reload --port 8000
```

Load the `.env` values into the process before starting Uvicorn. Session identifiers stay backend-only.

Endpoints: `/api/health`, `/api/categories`, `/api/categories/{id}`, `/api/search?q=...`, `/api/suggest?q=...`.
