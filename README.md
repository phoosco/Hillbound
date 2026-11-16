# Hillbound — V1 preview

Hillbound is a car-free mountain discovery and journey-planning project.

## What this first version does
- Displays Scottish Munro summits on an interactive OpenStreetMap map.
- Loads summit names, heights and British National Grid coordinates from the TidyTuesday Scottish Munros dataset, based on the Database of British and Irish Hills.
- Converts British National Grid coordinates to map coordinates in the browser.
- Lets users search for a starting location (town, city, postcode, address or station) using OpenStreetMap Nominatim.
- Ranks the Munro list by straight-line distance from that starting point.
- Shows a detail panel for each summit.

## Important limitation
This is a geographical discovery prototype, **not yet a public-transport journey planner**. Straight-line distance is not a measure of transport accessibility. No bus, train, ferry, timetable, walking-route or return-journey claims are made in this version. These integrations are planned for later versions.

## Deploy on GitHub Pages
1. Open the `phoosco/Hillbound` repository.
2. Upload the contents of this folder to the repository root (not the containing folder).
3. Commit the files to the `main` branch.
4. In GitHub, open **Settings → Pages**.
5. Under Build and deployment, choose **Deploy from a branch**, branch `main`, folder `/ (root)`, then Save.
6. Open `https://phoosco.github.io/Hillbound/`.

## Data and map attribution
- Munro data: Scottish Munros dataset curated for TidyTuesday (2025-08-19), derived from the Database of British and Irish Hills. Source: https://github.com/rfordatascience/tidytuesday/tree/main/data/2025/2025-08-19
- Map tiles and geocoding: © OpenStreetMap contributors. https://www.openstreetmap.org/copyright
- Map library: Leaflet. Coordinate conversion: proj4js. CSV parsing: Papa Parse.

The public Nominatim service has a usage policy and is intended for low-volume use. A production version should use a geocoding provider or a properly configured service with caching and rate limits.


## V2 preview: transport stops layer

The map now has an optional **Transport Stops** layer. It queries nearby OpenStreetMap nodes in the visible map area (bus stops, public-transport platforms, rail stations/halts and ferry terminals) when the map is zoomed in to level 9 or closer. This is an exploratory infrastructure layer only: it does not contain departure times, operating days, route connections or proof that a stop has a usable service on the selected date.

The layer uses the public Overpass API and is subject to its availability and fair-use limits. For a robust Scotland-wide product, the next data integration should use the Department for Transport's NaPTAN API/downloads for authoritative access-node records, then add actual timetable feeds (including Scottish bus and rail coverage) separately.

Data source: OpenStreetMap contributors, https://www.openstreetmap.org/copyright.
