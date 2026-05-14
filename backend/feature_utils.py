from __future__ import annotations

import uuid


def new_fid(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:10]}"


def ensure_feature_ids(collection: dict, prefix: str) -> bool:
    changed = False
    for feature in collection.get("features", []):
        if not isinstance(feature, dict):
            continue
        properties = feature.get("properties")
        if not isinstance(properties, dict):
            properties = {}
            feature["properties"] = properties
            changed = True
        if not properties.get("_fid"):
            properties["_fid"] = new_fid(prefix)
            changed = True
    return changed


def validate_feature_collection(data: dict) -> tuple[bool, str]:
    if not isinstance(data, dict):
        return False, "Payload must be a JSON object"
    if data.get("type") != "FeatureCollection":
        return False, "GeoJSON type must be FeatureCollection"
    features = data.get("features")
    if not isinstance(features, list):
        return False, "GeoJSON must contain a features array"

    for index, feature in enumerate(features):
        if not isinstance(feature, dict):
            return False, f"Feature at index {index} must be an object"
        if feature.get("type") != "Feature":
            return False, f"Feature at index {index} must have type Feature"
        if "geometry" not in feature:
            return False, f"Feature at index {index} is missing geometry"

    return True, "ok"
