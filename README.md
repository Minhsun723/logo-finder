# Logo Finder migration

This folder keeps the migration additive: the original Tkinter program remains available while the reusable API logic lives in `backend/` and the web interface lives in `frontend/`.

## Local development

Backend:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements-dev.txt
# Set IQIYI_DEVICE_ID, IQIYI_UUID and IQIYI_SID in the process environment.
uvicorn app.main:app --reload --port 8000
```

Frontend:

```powershell
cd frontend
npm install
npm run dev
```

Run verification with `python -m pytest -q` in `backend/`, then `npm test` and `npm run build` in `frontend/`.
