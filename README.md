# Bike Infrastructure Monitor (v1)

A lightweight civic web app to monitor bicycle infrastructure using plain GeoJSON files.

This version is intentionally simple:
- FastAPI backend
- Leaflet + Leaflet.draw frontend
- No database
- No authentication
- QGIS-friendly file workflow

The app starts with Palermo data, but switching city only requires editing `config.json` and replacing the two GeoJSON files.

## What It Does

- Shows one map view with two editable layers:
  - bicycle lanes (`cycle_segments.geojson`)
  - issues (`cycle_issues.geojson`)
- Allows create/edit/delete geometry on map
- Allows property editing in a collapsible sidebar
- Preserves unknown properties
- Saves back to GeoJSON files
- Exports GeoJSON files for download

## Project Layout

```text
app.py
config.json
requirements.txt
README.md
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

## Simple Deployment

### Generic host (single container or VM)

- Install dependencies with `pip install -r requirements.txt`
- Start with:
  ```bash
  uvicorn app:app --host 0.0.0.0 --port 8000
  ```
- Persist the `data/` directory, because edits are written back to files.

### Hugging Face Spaces (Docker or Python Space)

- Put this repository content at the Space root (or set it as the app directory).
- Install `requirements.txt`.
- Launch command:
  ```bash
  uvicorn app:app --host 0.0.0.0 --port 7860
  ```
- Ensure the Space has write access to `data/` so save actions work.

## Replace Palermo With Another City

1. Edit `config.json`:
   - `city_name`
   - `default_center` and `default_zoom`
   - optional `bounding_box`
   - file names for `cycle_segments_file` and `cycle_issues_file`
2. Replace the two GeoJSON files with your city data.
3. Keep GeoJSON as `FeatureCollection` for QGIS compatibility.

## Notes

- This tool is a simple web layer around GeoJSON and QGIS workflows.
- It is not a full GIS platform.
- It is not a replacement for QGIS.
