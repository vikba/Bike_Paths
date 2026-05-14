# Bike Infrastructure Monitor

Lightweight FastAPI + Leaflet web app for editing and monitoring bicycle infrastructure using plain GeoJSON files.

## Description (GitHub)

Simple civic mapping app to manage bike-lane and cycling-issue layers with a QGIS-friendly, file-based workflow.

## Overview

This project is intentionally simple:
- FastAPI backend
- Leaflet + Leaflet.draw frontend
- No database
- No authentication
- GeoJSON files as the source of truth

The app starts with Palermo data, but switching to another city only requires updating `config.json` and replacing the two GeoJSON files.

## Features

- Single map view with two editable layers:
  - bicycle lanes (`cycle_segments.geojson`)
  - issues (`cycle_issues.geojson`)
- Create, edit, and delete geometries on the map
- Edit feature properties from a collapsible sidebar
- Preserve unknown properties when updating features
- Save edits back to GeoJSON files
- Export GeoJSON files for download

## Project Layout

```text
app.py
config.json
requirements.txt
README.md
LICENSE
data/
  cycle_segments.geojson
  cycle_issues.geojson
backend/
  config_store.py
  geojson_store.py
  feature_utils.py
static/
  index.html
  styles.css
  app.js
```

## Run Locally

1. Create and activate a virtual environment.
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Start the app:
   ```bash
   uvicorn app:app --reload
   ```
4. Open `http://127.0.0.1:8000`.

## Deployment

### Generic host (single container or VM)

- Install dependencies with `pip install -r requirements.txt`.
- Start the server:
  ```bash
  uvicorn app:app --host 0.0.0.0 --port 8000
  ```
- Persist the `data/` directory, because edits are written back to files.

### Hugging Face Spaces (Docker or Python Space)

- Put this repository content at the Space root (or set it as the app directory).
- Install dependencies from `requirements.txt`.
- Launch command:
  ```bash
  uvicorn app:app --host 0.0.0.0 --port 7860
  ```
- Ensure the Space has write access to `data/` so save actions work.

## Switching To Another City

1. Edit `config.json`:
   - `city_name`
   - `default_center` and `default_zoom`
   - optional `bounding_box`
   - file names for `cycle_segments_file` and `cycle_issues_file`
2. Replace the two GeoJSON files with your city data.
3. Keep GeoJSON as `FeatureCollection` for QGIS compatibility.

## Author

Viktor Balashov

## License

Licensed under the Apache License, Version 2.0. See [LICENSE](LICENSE).
