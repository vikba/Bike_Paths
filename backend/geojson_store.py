from __future__ import annotations

import json
from pathlib import Path


def empty_feature_collection() -> dict:
    return {"type": "FeatureCollection", "features": []}


def read_feature_collection(path: Path) -> dict:
    if not path.exists():
        return empty_feature_collection()

    with path.open("r", encoding="utf-8") as file:
        data = json.load(file)

    if not isinstance(data, dict):
        raise ValueError(f"GeoJSON at {path} must be a JSON object")
    if data.get("type") != "FeatureCollection":
        raise ValueError(f"GeoJSON at {path} must be a FeatureCollection")
    if not isinstance(data.get("features"), list):
        raise ValueError(f"GeoJSON at {path} must contain a features list")

    return data


def write_feature_collection(path: Path, collection: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as file:
        json.dump(collection, file, indent=2, ensure_ascii=False)
        file.write("\n")
