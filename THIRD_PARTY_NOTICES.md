# Third-Party Notices

Linketry includes generated world-map geometry in `apps/admin/src/assets/worldMapRegions.ts`.

## react-svg-worldmap 2.0.2

- Project: https://github.com/yanivam/react-svg-worldmap
- License: MIT
- Use: the bundled country topology was converted into static SVG path data at build time. Linketry does not include or load the React component at runtime.

The upstream map documents Natural Earth Admin 0 Countries as its geometry source and ISO 3166-1 alpha-2 as its country-code contract. Natural Earth data is public domain. The generated map is a small-scale traffic visualization and is not intended as an authoritative statement of political boundaries.
