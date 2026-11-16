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
