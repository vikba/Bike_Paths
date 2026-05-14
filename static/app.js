const SEGMENT_FIELDS = [
  "ID",
  "TRATTO",
  "TIPOLOGIA",
  "STATO",
  "ORDINANAZA",
  "ANNO_ISTIT",
  "DISTANZA__",
  "OD_ZA_PGTU",
  "IST_OD_PGT",
  "Attiva",
  "_fid",
];

const ISSUE_FIELDS = [
  "ID",
  "segment_fid",
  "issue_type",
  "severity",
  "status",
  "description",
  "reported_by",
  "reported_at",
  "photo_url",
  "_fid",
];

const state = {
  config: null,
  map: null,
  segmentsLayer: null,
  issuesLayer: null,
  selected: null,
  segments: null,
  issues: null,
};

const statusColors = {
  EXCELLENT: "#0b6623",
  GOOD: "#2e8b57",
  SATISFACTORY: "#ff8c00",
  BAD: "#d62828",
};

const severityColors = {
  low: "#f5b041",
  medium: "#e67e22",
  high: "#c0392b",
};

function uid(prefix) {
  const n = Math.random().toString(16).slice(2, 12);
  return `${prefix}_${n}`;
}

async function getJSON(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`${url} failed (${res.status})`);
  }
  return res.json();
}

function segmentStyle(feature) {
  const stato = String(feature?.properties?.STATO || "").toUpperCase();
  return {
    color: statusColors[stato] || "#3f3f3f",
    weight: 5,
    opacity: 0.9,
  };
}

function issueStyle(feature) {
  const sev = String(feature?.properties?.severity || "medium").toLowerCase();
  return severityColors[sev] || severityColors.medium;
}

function issueIcon(feature) {
  const color = issueStyle(feature);
  return L.divIcon({
    className: "issue-marker-wrapper",
    html: `<span class="issue-pin" style="background:${color}"></span>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

function ensureFid(feature, prefix) {
  feature.properties = feature.properties || {};
  if (!feature.properties._fid) {
    feature.properties._fid = uid(prefix);
  }
}

function knownFields(type) {
  return type === "segments" ? SEGMENT_FIELDS : ISSUE_FIELDS;
}

function bindFeatureHandlers(layer, type) {
  layer.on("click", () => selectFeature(layer, type));
}

function findFeatureInCollection(fid, type) {
  const collection = type === "segments" ? state.segments : state.issues;
  return collection.features.find((f) => f.properties?._fid === fid);
}

function removeFeatureFromCollection(fid, type) {
  const collection = type === "segments" ? state.segments : state.issues;
  const index = collection.features.findIndex((f) => f.properties?._fid === fid);
  if (index !== -1) {
    collection.features.splice(index, 1);
  }
}

function openSidebar() {
  document.getElementById("sidebar").classList.remove("collapsed");
}

function closeSidebar() {
  document.getElementById("sidebar").classList.add("collapsed");
  state.selected = null;
}

function renderPropertyForm(layer, type) {
  const container = document.getElementById("sidebarBody");
  const props = layer.feature.properties || {};
  const known = knownFields(type);

  const extra = {};
  Object.entries(props).forEach(([k, v]) => {
    if (!known.includes(k)) {
      extra[k] = v;
    }
  });

  container.innerHTML = "";

  const typeLine = document.createElement("p");
  typeLine.className = "muted";
  typeLine.textContent = `Layer: ${type}`;
  container.appendChild(typeLine);

  known.forEach((field) => {
    const wrap = document.createElement("div");
    wrap.className = "field";

    const label = document.createElement("label");
    label.textContent = field;

    let input;
    if (field === "STATO") {
      input = document.createElement("select");
      ["", "EXCELLENT", "GOOD", "SATISFACTORY", "BAD"].forEach((optionValue) => {
        const option = document.createElement("option");
        option.value = optionValue;
        option.textContent = optionValue || "(empty)";
        if (String(props[field] || "") === optionValue) option.selected = true;
        input.appendChild(option);
      });
    } else if (field === "severity") {
      input = document.createElement("select");
      ["low", "medium", "high"].forEach((optionValue) => {
        const option = document.createElement("option");
        option.value = optionValue;
        option.textContent = optionValue;
        if (String(props[field] || "") === optionValue) option.selected = true;
        input.appendChild(option);
      });
    } else if (field === "description") {
      input = document.createElement("textarea");
      input.value = props[field] ?? "";
    } else {
      input = document.createElement("input");
      input.value = props[field] ?? "";
    }

    input.dataset.field = field;
    input.addEventListener("input", onPropertiesChanged);

    wrap.appendChild(label);
    wrap.appendChild(input);
    container.appendChild(wrap);
  });

  const extraWrap = document.createElement("div");
  extraWrap.className = "field";

  const extraLabel = document.createElement("label");
  extraLabel.textContent = "Extra properties (JSON object)";

  const extraInput = document.createElement("textarea");
  extraInput.id = "extraProps";
  extraInput.value = JSON.stringify(extra, null, 2);
  extraInput.addEventListener("input", onPropertiesChanged);

  extraWrap.appendChild(extraLabel);
  extraWrap.appendChild(extraInput);
  container.appendChild(extraWrap);
}

function onPropertiesChanged() {
  if (!state.selected) return;

  const { layer, type } = state.selected;
  const known = knownFields(type);
  const nextProps = {};

  known.forEach((field) => {
    const input = document.querySelector(`[data-field="${field}"]`);
    if (input) nextProps[field] = input.value;
  });

  const extraInput = document.getElementById("extraProps");
  if (extraInput && extraInput.value.trim()) {
    try {
      const parsed = JSON.parse(extraInput.value);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        Object.assign(nextProps, parsed);
        extraInput.style.borderColor = "";
      } else {
        extraInput.style.borderColor = "#c0392b";
      }
    } catch {
      extraInput.style.borderColor = "#c0392b";
      return;
    }
  }

  layer.feature.properties = nextProps;

  const fid = layer.feature.properties._fid;
  const collectionFeature = findFeatureInCollection(fid, type);
  if (collectionFeature) {
    collectionFeature.properties = nextProps;
  }

  if (type === "segments" && layer.setStyle) {
    layer.setStyle(segmentStyle(layer.feature));
  }
  if (type === "issues" && layer.setIcon) {
    layer.setIcon(issueIcon(layer.feature));
  }
}

function selectFeature(layer, type) {
  state.selected = { layer, type };
  renderPropertyForm(layer, type);
  openSidebar();
}

function buildSegmentLayer(data) {
  return L.geoJSON(data, {
    style: segmentStyle,
    onEachFeature: (feature, row) => {
      ensureFid(feature, "seg");
      bindFeatureHandlers(row, "segments");
    },
  });
}

function buildIssuesLayer(data) {
  return L.geoJSON(data, {
    pointToLayer: (feature, latlng) => {
      ensureFid(feature, "iss");
      return L.marker(latlng, { icon: issueIcon(feature) });
    },
    onEachFeature: (feature, row) => {
      ensureFid(feature, "iss");
      bindFeatureHandlers(row, "issues");
    },
  });
}

function applyMapBounds(config, map) {
  if (Array.isArray(config.bounding_box) && config.bounding_box.length === 4) {
    const [minLng, minLat, maxLng, maxLat] = config.bounding_box;
    map.fitBounds([
      [minLat, minLng],
      [maxLat, maxLng],
    ]);
    return;
  }

  map.setView(config.default_center, config.default_zoom || 12);
}

function currentCollections() {
  return { segments: state.segments, issues: state.issues };
}

async function saveAll() {
  const { segments, issues } = currentCollections();

  const [segRes, issRes] = await Promise.all([
    fetch("/api/segments/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(segments),
    }),
    fetch("/api/issues/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(issues),
    }),
  ]);

  if (!segRes.ok || !issRes.ok) {
    throw new Error("Save failed");
  }
}

function triggerDownload() {
  const type = document.getElementById("downloadType").value;
  const url = type === "segments" ? "/api/export/segments" : "/api/export/issues";
  window.location.href = url;
}

function setupDrawTools() {
  if (L.drawLocal?.draw?.toolbar?.buttons) {
    L.drawLocal.draw.toolbar.buttons.polyline = "Draw Bike Path";
    L.drawLocal.draw.toolbar.buttons.marker = "Add Issue";
  }

  const editable = new L.FeatureGroup();
  state.map.addLayer(editable);

  state.segmentsLayer.eachLayer((layer) => editable.addLayer(layer));
  state.issuesLayer.eachLayer((layer) => editable.addLayer(layer));

  const drawControl = new L.Control.Draw({
    position: "topleft",
    draw: {
      polygon: false,
      rectangle: false,
      circle: false,
      circlemarker: false,
      marker: true,
      polyline: true,
    },
    edit: {
      featureGroup: editable,
      remove: true,
    },
  });

  state.map.addControl(drawControl);

  const polylineButton = document.querySelector(".leaflet-draw-draw-polyline");
  if (polylineButton) {
    polylineButton.title = "Draw Bike Path";
    polylineButton.setAttribute("aria-label", "Draw Bike Path");
  }

  const markerButton = document.querySelector(".leaflet-draw-draw-marker");
  if (markerButton) {
    markerButton.title = "Add Issue";
    markerButton.setAttribute("aria-label", "Add Issue");
  }

  state.map.on(L.Draw.Event.CREATED, (event) => {
    const { layerType, layer } = event;

    if (layerType === "polyline") {
      layer.feature = {
        type: "Feature",
        properties: { _fid: uid("seg"), STATO: "GOOD" },
        geometry: layer.toGeoJSON().geometry,
      };
      state.segments.features.push(layer.feature);
      layer.setStyle(segmentStyle(layer.feature));
      bindFeatureHandlers(layer, "segments");
      state.segmentsLayer.addLayer(layer);
      editable.addLayer(layer);
      selectFeature(layer, "segments");
      return;
    }

    if (layerType === "marker") {
      layer.feature = {
        type: "Feature",
        properties: { _fid: uid("iss"), severity: "medium", status: "open" },
        geometry: layer.toGeoJSON().geometry,
      };
      state.issues.features.push(layer.feature);
      layer.setIcon(issueIcon(layer.feature));
      bindFeatureHandlers(layer, "issues");
      state.issuesLayer.addLayer(layer);
      editable.addLayer(layer);
      selectFeature(layer, "issues");
    }
  });

  state.map.on(L.Draw.Event.EDITED, (event) => {
    event.layers.eachLayer((layer) => {
      layer.feature = layer.feature || { type: "Feature", properties: {} };
      layer.feature.geometry = layer.toGeoJSON().geometry;
      const fid = layer.feature.properties._fid;
      const type = state.segmentsLayer.hasLayer(layer) ? "segments" : "issues";
      const collectionFeature = findFeatureInCollection(fid, type);
      if (collectionFeature) {
        collectionFeature.geometry = layer.feature.geometry;
      }
      if (state.selected && state.selected.layer === layer) {
        renderPropertyForm(layer, state.selected.type);
      }
    });
  });

  state.map.on(L.Draw.Event.DELETED, (event) => {
    event.layers.eachLayer((layer) => {
      const fid = layer.feature.properties._fid;
      const type = state.segmentsLayer.hasLayer(layer) ? "segments" : "issues";
      removeFeatureFromCollection(fid, type);
      state.segmentsLayer.removeLayer(layer);
      state.issuesLayer.removeLayer(layer);
      if (state.selected && state.selected.layer === layer) {
        closeSidebar();
      }
    });
  });
}

function setupToolbar() {
  document.getElementById("toggleSegments").addEventListener("change", (event) => {
    if (event.target.checked) {
      state.segmentsLayer.addTo(state.map);
    } else {
      state.map.removeLayer(state.segmentsLayer);
    }
  });

  document.getElementById("toggleIssues").addEventListener("change", (event) => {
    if (event.target.checked) {
      state.issuesLayer.addTo(state.map);
    } else {
      state.map.removeLayer(state.issuesLayer);
    }
  });

  document.getElementById("closeSidebar").addEventListener("click", closeSidebar);
  document.getElementById("downloadBtn").addEventListener("click", triggerDownload);

  document.getElementById("saveBtn").addEventListener("click", async () => {
    try {
      await saveAll();
      alert("GeoJSON files saved");
    } catch (err) {
      alert(`Save error: ${err.message}`);
    }
  });
}

async function init() {
  const [config, segments, issues] = await Promise.all([
    getJSON("/api/config"),
    getJSON("/api/segments"),
    getJSON("/api/issues"),
  ]);

  state.config = config;
  state.segments = segments;
  state.issues = issues;

  document.getElementById("cityName").textContent = config.city_name || "Bike Monitor";

  state.map = L.map("map");
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 20,
  }).addTo(state.map);

  applyMapBounds(config, state.map);

  state.segmentsLayer = buildSegmentLayer(segments);
  state.issuesLayer = buildIssuesLayer(issues);
  state.segmentsLayer.addTo(state.map);
  state.issuesLayer.addTo(state.map);

  setupDrawTools();
  setupToolbar();
}

init().catch((err) => {
  const map = document.getElementById("map");
  map.innerHTML = `<div style="padding:12px;color:#c0392b">Failed to load app: ${err.message}</div>`;
});
