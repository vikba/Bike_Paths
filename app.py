from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import Body, FastAPI, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from backend.config_store import ConfigStore
from backend.feature_utils import ensure_feature_ids, validate_feature_collection
from backend.geojson_store import (
    read_feature_collection,
    write_feature_collection,
)

BASE_DIR = Path(__file__).resolve().parent


@asynccontextmanager
async def lifespan(app: FastAPI):
    config_store = ConfigStore(BASE_DIR / "config.json")
    app.state.config_store = config_store
    app.state.config = config_store.load()
    yield


app = FastAPI(title="Bike Infrastructure Monitor", version="1.0", lifespan=lifespan)
app.mount("/static", StaticFiles(directory=BASE_DIR / "static"), name="static")


def get_config() -> dict:
    config = getattr(app.state, "config", None)
    if not config:
        raise HTTPException(status_code=500, detail="Application config is not loaded")
    return config


def layer_path(config_key: str) -> Path:
    config = get_config()
    if config_key not in config:
        raise HTTPException(status_code=500, detail=f"Missing config key: {config_key}")
    return app.state.config_store.resolve_path(config[config_key])


def export_as_download(path: Path, filename: str) -> JSONResponse:
    collection = read_feature_collection(path)
    return JSONResponse(
        content=collection,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@app.get("/")
def index() -> FileResponse:
    return FileResponse(BASE_DIR / "static" / "index.html")


@app.get("/api/config")
def api_config() -> dict:
    return get_config()


@app.get("/api/segments")
def api_segments() -> dict:
    collection = read_feature_collection(layer_path("cycle_segments_file"))
    ensure_feature_ids(collection, prefix="seg")
    return collection


@app.post("/api/segments/save")
def api_segments_save(payload: dict = Body(...)) -> dict:
    valid, message = validate_feature_collection(payload)
    if not valid:
        raise HTTPException(status_code=400, detail=message)
    ensure_feature_ids(payload, prefix="seg")
    write_feature_collection(layer_path("cycle_segments_file"), payload)
    return {"status": "ok", "saved_features": len(payload["features"])}


@app.get("/api/issues")
def api_issues() -> dict:
    collection = read_feature_collection(layer_path("cycle_issues_file"))
    ensure_feature_ids(collection, prefix="iss")
    return collection


@app.post("/api/issues/save")
def api_issues_save(payload: dict = Body(...)) -> dict:
    valid, message = validate_feature_collection(payload)
    if not valid:
        raise HTTPException(status_code=400, detail=message)
    ensure_feature_ids(payload, prefix="iss")
    write_feature_collection(layer_path("cycle_issues_file"), payload)
    return {"status": "ok", "saved_features": len(payload["features"])}


@app.get("/api/export/segments")
def api_export_segments() -> JSONResponse:
    return export_as_download(layer_path("cycle_segments_file"), "cycle_segments.geojson")


@app.get("/api/export/issues")
def api_export_issues() -> JSONResponse:
    return export_as_download(layer_path("cycle_issues_file"), "cycle_issues.geojson")


@app.get("/api/health")
def api_health() -> dict:
    return {
        "status": "ok",
        "segments": layer_path("cycle_segments_file").exists(),
        "issues": layer_path("cycle_issues_file").exists(),
    }
