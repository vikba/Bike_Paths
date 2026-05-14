from __future__ import annotations

import json
from pathlib import Path


class ConfigStore:
    def __init__(self, config_path: Path):
        self.config_path = config_path
        self.base_dir = config_path.parent

    def load(self) -> dict:
        if not self.config_path.exists():
            raise FileNotFoundError(f"Config not found: {self.config_path}")
        with self.config_path.open("r", encoding="utf-8") as file:
            config = json.load(file)
        if not isinstance(config, dict):
            raise ValueError("config.json must contain a JSON object")
        return config

    def resolve_path(self, relative_or_absolute: str) -> Path:
        candidate = Path(relative_or_absolute)
        if candidate.is_absolute():
            return candidate
        return self.base_dir / candidate
