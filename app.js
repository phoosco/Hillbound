const DATA_URL = "https://raw.githubusercontent.com/rfordatascience/tidytuesday/main/data/2025/2025-08-19/scottish_munros.csv";
const BNG = "+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy +datum=OSGB36 +units=m +no_defs";
const WGS84 = "+proj=longlat +datum=WGS84 +no_defs";

const map = L.map("map", { scrollWheelZoom: false }).setView([56.75, -4.1], 7);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 18,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

let munros = [];
let markers = new Map();
let originMarker = null;
let origin = null;
let selectedMunro = null;
let transportLayer = L.layerGroup();
let transportEnabled = false;
let lastTransportBounds = "";
let transportRequest = null;

const list = document.getElementById("mountain-list");
const filterInput = document.getElementById("mountain-filter");
const statusBox = document.getElementById("search-status");
const modal = document.getElementById("mountain-modal");

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
function toNumber(v) {
  const n = Number(String(v ?? "").replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}
function distanceKm(a, b) {
  const R = 6371, rad = x => x * Math.PI / 180;
  const dLat = rad(b.lat-a.lat), dLon = rad(b.lon-a.lon);
  const q = Math.sin(dLat/2)**2 + Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(dLon/2)**2;
  return 2*R*Math.asin(Math.sqrt(q));
}
function munroIcon() {
  return L.divIcon({className:"",html:'<span class="munro-pin" style="display:block;width:11px;height:11px"></span>',iconSize:[11,11],iconAnchor:[5.5,5.5]});
}
function originIcon() {
  return L.divIcon({className:"",html:'<span class="origin-pin" style="display:block;width:15px;height:15px"></span>',iconSize:[15,15],iconAnchor:[7.5,7.5]});
}
function showMunro(m) {
  selectedMunro = m;
  document.getElementById("modal-name").textContent = m.name;
  document.getElementById("modal-height").textContent = `${Math.round(m.height)} m`;
  document.getElementById("modal-region").textContent = m.gridref || "Not supplied";
  modal.hidden = false;
  const row = document.querySelector(`[data-id="${m.id}"]`);
  document.querySelectorAll(".mountain-row").forEach(el => el.classList.remove("selected"));
  if (row) { row.classList.add("selected"); row.scrollIntoView({block:"nearest"}); }
}
function renderList(query="") {
  const q = query.trim().toLowerCase();
  let rows = munros.filter(m => m.name.toLowerCase().includes(q));
  if (origin) rows.sort((a,b) => distanceKm(origin,a)-distanceKm(origin,b));
  document.getElementById("result-count").textContent = `${rows.length} FOUND`;
  document.getElementById("list-title").textContent = origin ? "NEAREST BY STRAIGHT-LINE DISTANCE" : "ALL MUNROS";
  list.innerHTML = rows.slice(0,282).map(m => {
    const dist = origin ? `<span class="height">${distanceKm(origin,m).toFixed(0)} km</span>` : `<span class="height">${Math.round(m.height)} m</span>`;
    return `<div class="mountain-row" data-id="${escapeHtml(m.id)}" tabindex="0" role="button" aria-label="Explore ${escapeHtml(m.name)}"><div><strong>${escapeHtml(m.name)}</strong><small>${Math.round(m.height)} M · ${escapeHtml(m.gridref || "SCOTLAND")}</small></div>${dist}</div>`;
  }).join("") || '<div class="loading-state">No mountains match that search.</div>';
  list.querySelectorAll(".mountain-row").forEach(row => {
    const m = munros.find(x => x.id === row.dataset.id);
    row.addEventListener("click", () => { map.setView([m.lat,m.lon], 11); showMunro(m); });
    row.addEventListener("keydown", e => { if(e.key==="Enter"||e.key===" "){e.preventDefault();map.setView([m.lat,m.lon],11);showMunro(m);} });
  });
}
function addMunros(data) {
  munros = data;
  const group = L.featureGroup();
  data.forEach(m => {
    const marker = L.marker([m.lat,m.lon], {icon:munroIcon(), title:m.name});
    marker.bindTooltip(`${m.name} · ${Math.round(m.height)} m`);
    marker.on("click", () => showMunro(m));
    marker.addTo(map);
    markers.set(m.id, marker);
    group.addLayer(marker);
  });
  if (group.getLayers().length) map.fitBounds(group.getBounds().pad(0.07));
  document.getElementById("munro-count").textContent = data.length;
  renderList();
}
async function loadMunros() {
  list.innerHTML = '<div class="loading-state">Loading the Munros…</div>';
  try {
    const response = await fetch(DATA_URL);
    if (!response.ok) throw new Error(`Dataset request failed (${response.status})`);
    const csv = await response.text();
    const parsed = Papa.parse(csv, {header:true,skipEmptyLines:true});
    const data = parsed.data.filter(r => String(r["2021"] || "").trim().toLowerCase() === "munro")
      .map(r => {
        const x = toNumber(r.xcoord), y = toNumber(r.ycoord);
        if (x === null || y === null) return null;
        const ll = proj4(BNG,WGS84,[x,y]);
        return {id:String(r.DoBIH_number || r["DoBIH Number"] || r.Name),name:String(r.Name || "Unnamed summit"),height:toNumber(r.Height_m || r["Height (m)"]) || 0,lat:ll[1],lon:ll[0],gridref:""};
      }).filter(m => m && Number.isFinite(m.lat) && Number.isFinite(m.lon));
    if (data.length < 270) throw new Error(`Only ${data.length} Munros were loaded; expected approximately 282.`);
    addMunros(data);
  } catch (err) {
    console.error(err);
    list.innerHTML = `<div class="loading-state">The Munro dataset could not be loaded. Check your connection and refresh the page.<br><br><small>${escapeHtml(err.message)}</small></div>`;
    document.getElementById("munro-count").textContent = "—";
  }
}
async function geocode(query) {
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`;
  const response = await fetch(url, {headers:{"Accept-Language":"en"}});
  if (!response.ok) throw new Error("Location search is temporarily unavailable.");
  const results = await response.json();
  if (!results.length) throw new Error("We couldn't find that starting location. Try a town, postcode or station name.");
  return {lat:Number(results[0].lat),lon:Number(results[0].lon),label:results[0].display_name};
}
document.getElementById("search-form").addEventListener("submit", async e => {
  e.preventDefault();
  const input = document.getElementById("origin-input");
  const query = input.value.trim();
  if (!query) return;
  statusBox.textContent = "Finding your starting point…";
  try {
    origin = await geocode(query);
    if (originMarker) map.removeLayer(originMarker);
    originMarker = L.marker([origin.lat,origin.lon],{icon:originIcon(),zIndexOffset:1000})
      .bindPopup(`<strong>Your starting point</strong><br>${escapeHtml(query)}`).addTo(map).openPopup();
    map.setView([origin.lat,origin.lon],8);
    renderList(filterInput.value);
    document.getElementById("map-hint").textContent = "Mountains ranked by straight-line distance";
    statusBox.textContent = "Starting point found. The list is ranked by straight-line distance only — public transport journey planning is coming next.";
  } catch(err) { statusBox.textContent = err.message; }
});
document.getElementById("clear-origin").addEventListener("click", () => {
  document.getElementById("origin-input").value = "";
  origin = null;
  statusBox.textContent = "";
  if(originMarker){map.removeLayer(originMarker);originMarker=null;}
  renderList(filterInput.value);
  map.setView([56.75,-4.1],7);
  document.getElementById("map-hint").textContent = "Select a marker to explore";
});
filterInput.addEventListener("input", () => renderList(filterInput.value));
document.getElementById("close-modal").addEventListener("click", () => modal.hidden = true);
modal.addEventListener("click", e => { if(e.target===modal) modal.hidden=true; });
document.getElementById("modal-map").addEventListener("click", () => {
  if(selectedMunro) map.setView([selectedMunro.lat,selectedMunro.lon],12);
  modal.hidden=true;
});

// V2 preview: load nearby public-transport access points from OpenStreetMap.
// This is an exploratory map layer, not a timetable or service-availability feed.
const transportToggle = document.getElementById("transport-toggle");
function transportIcon(tags) {
  if (tags.railway === "station" || tags.railway === "halt") return "🚆";
  if (tags.amenity === "ferry_terminal") return "⛴";
  return "🚌";
}
function transportType(tags) {
  if (tags.railway === "station") return "Railway station";
  if (tags.railway === "halt") return "Rail halt";
  if (tags.amenity === "ferry_terminal") return "Ferry terminal";
  if (tags.highway === "bus_stop") return "Bus stop";
  return "Public transport stop";
}
async function loadTransportStops() {
  if (!transportEnabled || map.getZoom() < 9) return;
  const b = map.getBounds();
  const boundsKey = [b.getSouth().toFixed(3),b.getWest().toFixed(3),b.getNorth().toFixed(3),b.getEast().toFixed(3)].join(",");
  if (boundsKey === lastTransportBounds) return;
  lastTransportBounds = boundsKey;
  if (transportRequest) transportRequest.abort();
  transportRequest = new AbortController();
  statusBox.textContent = "Loading transport stops for this map area…";
  const box = `${b.getSouth()},${b.getWest()},${b.getNorth()},${b.getEast()}`;
  const query = `[out:json][timeout:25];(node[highway=bus_stop](${box});node[public_transport=platform](${box});node[railway=station](${box});node[railway=halt](${box});node[amenity=ferry_terminal](${box}););out body;`;
  try {
    const response = await fetch("https://overpass-api.de/api/interpreter?data=" + encodeURIComponent(query), {signal:transportRequest.signal});
    if (!response.ok) throw new Error("Transport map data is temporarily unavailable.");
    const result = await response.json();
    transportLayer.clearLayers();
    result.elements.forEach(el => {
      if (typeof el.lat !== "number" || typeof el.lon !== "number") return;
      const tags = el.tags || {};
      const name = tags.name || tags.ref || transportType(tags);
      L.circleMarker([el.lat,el.lon],{radius:5,color:"#fff",weight:1.5,fillColor:"#287e91",fillOpacity:.95})
        .bindPopup(`<strong>${escapeHtml(name)}</strong><br>${escapeHtml(transportType(tags))}<br><small>OpenStreetMap data</small>`)
        .addTo(transportLayer);
    });
    if (transportEnabled) transportLayer.addTo(map);
    statusBox.textContent = `${result.elements.length} mapped transport access points in this area. These do not confirm that a service operates on your travel date.`;
  } catch (err) {
    if (err.name !== "AbortError") {
      lastTransportBounds = "";
      statusBox.textContent = "Couldn't load transport stops. Try again in a moment or zoom in further.";
    }
  }
}
transportToggle.addEventListener("click", () => {
  transportEnabled = !transportEnabled;
  transportToggle.setAttribute("aria-pressed", String(transportEnabled));
  transportToggle.textContent = transportEnabled ? "− HIDE TRANSPORT" : "＋ TRANSPORT STOPS";
  if (transportEnabled) loadTransportStops();
  else { map.removeLayer(transportLayer); statusBox.textContent = "Transport stop layer hidden."; }
});
map.on("moveend", () => { if (transportEnabled) loadTransportStops(); });
map.on("zoomend", () => { if (transportEnabled) loadTransportStops(); });

document.getElementById("travel-date").value = new Date().toISOString().slice(0,10);
loadMunros();
