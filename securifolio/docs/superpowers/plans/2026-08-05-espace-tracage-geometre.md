# Geometer Tracing Workspace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep the existing compact Smart Archive map while providing a full-screen workspace for RTK import, optional manual polygon drawing, vertex editing, validation, and cancellation.

**Architecture:** Smart Archive owns the committed geometry and a temporary editing draft. `MapDigitizer` renders one polygon, seeds the Leaflet feature group from the committed geometry, and exposes RTK import plus Leaflet Draw only while editing. A small framework-free geometry helper validates polygon shape and area before the draft can replace the committed GeoJSON.

**Tech Stack:** Next.js 14, React 18, TypeScript/JavaScript modules, Leaflet, react-leaflet-draw, Papa Parse, Turf, Tailwind CSS, Node.js test runner.

## Global Constraints

- Keep the compact map at its current size in Smart Archive.
- Open the full-screen workspace only after the user chooses « Ouvrir l'espace de traçage ».
- Support CSV and TXT RTK files; do not advertise KML support.
- Preserve the existing `saveCertificate` server contract and GeoJSON persistence.
- Allow exactly one parcel polygon at a time.
- Preserve « Localisation spatiale inconnue ».
- Follow the SÉCURIFOLIO light institutional design: white surfaces, slate borders, sky-blue primary actions.
- Do not add a new test dependency.

---

### Task 1: Isolate and test parcel geometry validation

**Files:**
- Create: `securifolio/src/lib/spatial/parcel-geometry.mjs`
- Create: `securifolio/tests/unit/parcel-geometry.test.mjs`

**Interfaces:**
- Consumes: GeoJSON-like values and an area expressed in square metres.
- Produces: `isValidParcelFeature(feature, areaSqm): boolean` for the Smart Archive validation handler.

- [ ] **Step 1: Write the failing Node test**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { isValidParcelFeature } from '../../src/lib/spatial/parcel-geometry.mjs'

const validPolygon = {
  type: 'Feature',
  properties: {},
  geometry: {
    type: 'Polygon',
    coordinates: [[
      [15.311, -4.305],
      [15.312, -4.305],
      [15.312, -4.306],
      [15.311, -4.305],
    ]],
  },
}

test('accepts a closed polygon with three distinct vertices and positive area', () => {
  assert.equal(isValidParcelFeature(validPolygon, 450), true)
})

test('rejects missing geometry, points, duplicate-only rings, and invalid areas', () => {
  assert.equal(isValidParcelFeature(null, 450), false)
  assert.equal(isValidParcelFeature({ ...validPolygon, geometry: { type: 'Point', coordinates: [15, -4] } }, 450), false)
  assert.equal(isValidParcelFeature({
    ...validPolygon,
    geometry: { type: 'Polygon', coordinates: [[[15, -4], [15, -4], [15, -4], [15, -4]]] },
  }, 10), false)
  assert.equal(isValidParcelFeature(validPolygon, 0), false)
  assert.equal(isValidParcelFeature(validPolygon, Number.NaN), false)
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd securifolio && node --test tests/unit/parcel-geometry.test.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `parcel-geometry.mjs`.

- [ ] **Step 3: Implement the validator**

```js
/**
 * @param {unknown} feature
 * @param {number} areaSqm
 * @returns {boolean}
 */
export function isValidParcelFeature(feature, areaSqm) {
  if (!Number.isFinite(areaSqm) || areaSqm <= 0) return false
  if (!feature || typeof feature !== 'object') return false

  const geometry = feature.geometry
  if (!geometry || geometry.type !== 'Polygon') return false

  const ring = geometry.coordinates?.[0]
  if (!Array.isArray(ring)) return false

  const distinctVertices = new Set(
    ring
      .filter(point => Array.isArray(point) && point.length >= 2)
      .map(point => `${Number(point[0])}:${Number(point[1])}`),
  )

  return distinctVertices.size >= 3
}
```

- [ ] **Step 4: Run the focused test**

Run: `cd securifolio && node --test tests/unit/parcel-geometry.test.mjs`

Expected: 2 tests pass, 0 fail.

- [ ] **Step 5: Commit the validator**

```bash
git add securifolio/src/lib/spatial/parcel-geometry.mjs securifolio/tests/unit/parcel-geometry.test.mjs
git commit -m "test: validate parcel polygon drafts"
```

---

### Task 2: Make MapDigitizer seedable and editable

**Files:**
- Modify: `securifolio/src/components/MapDigitizer.tsx:1-390`

**Interfaces:**
- Consumes: `initialGeoJson`, `editingEnabled`, and `onPolygonDrawn`.
- Produces: `onPolygonDrawn(geojson, areaSqm)` after RTK import, manual creation, vertex editing, or deletion.

- [ ] **Step 1: Extend the component contract**

Replace the existing props interface with:

```tsx
interface MapDigitizerProps {
  initialGeoJson?: Feature<Polygon> | null;
  editingEnabled?: boolean;
  onPolygonDrawn: (
    geojson: Feature<Polygon> | null,
    areaSqm: number,
  ) => void;
}
```

Import the GeoJSON types without adding a runtime dependency:

```tsx
import type { Feature, Polygon } from 'geojson';
```

- [ ] **Step 2: Add an initial-geometry control inside the map**

Add a child component that runs once for each keyed `MapDigitizer` session:

```tsx
function InitialGeometryControl({
  featureGroupRef,
  initialGeoJson,
}: {
  featureGroupRef: React.RefObject<L.FeatureGroup>;
  initialGeoJson?: Feature<Polygon> | null;
}) {
  const map = useMap();

  useEffect(() => {
    const group = featureGroupRef.current;
    if (!group) return;

    group.clearLayers();
    if (initialGeoJson) {
      L.geoJSON(initialGeoJson, {
        style: { color: '#007FFF', fillOpacity: 0.28, weight: 3 },
      }).eachLayer(layer => group.addLayer(layer));
      if (group.getLayers().length > 0) {
        map.fitBounds(group.getBounds(), { padding: [50, 50] });
      }
    }

    map.invalidateSize();
  }, [featureGroupRef, initialGeoJson, map]);

  return null;
}
```

Render it after `FeatureGroup` and before the closing `MapContainer` tag.

- [ ] **Step 3: Enable polygon creation only in the editing workspace**

Update the Leaflet Draw configuration:

```tsx
<EditControl
  position="topright"
  onCreated={handleCreated}
  onEdited={handleEdited}
  onDeleted={handleDeleted}
  edit={{ edit: editingEnabled, remove: editingEnabled }}
  draw={{
    rectangle: false,
    circle: false,
    circlemarker: false,
    polyline: false,
    marker: false,
    polygon: editingEnabled
      ? {
          allowIntersection: false,
          showArea: true,
          shapeOptions: { color: '#007FFF', fillOpacity: 0.28, weight: 3 },
        }
      : false,
  }}
/>
```

Keep the existing single-polygon behaviour in `handleCreated`: clear the feature group before adding the new layer.

In editing mode, render a visible institutional hint beside the Leaflet Draw toolbar: « Tracer manuellement : sélectionnez l’outil polygone ». This gives the icon-only Leaflet control an explicit user-facing label without creating a second drawing implementation.

- [ ] **Step 4: Restrict RTK import to editing mode and make the map fill its parent**

Render `RtkUploaderControl` only when `editingEnabled` is true. Change the component root from fixed `h-[400px]` to `h-full min-h-[400px] w-full`; the compact parent remains 400 px and the full-screen parent supplies the larger height.

Change all references to KML in `MapDigitizer` or its visible copy to CSV/TXT. Preserve `.csv,.txt` in the file input.

- [ ] **Step 5: Verify static correctness**

Run: `cd securifolio && npx tsc --noEmit`

Expected: exit code 0 with no new TypeScript error.

- [ ] **Step 6: Commit the map component**

```bash
git add securifolio/src/components/MapDigitizer.tsx
git commit -m "feat: enable editable parcel polygons"
```

---

### Task 3: Add committed and draft geometry to Smart Archive

**Files:**
- Modify: `securifolio/src/app/smart-archive/page.tsx:1-40,777-874,1008-1016`

**Interfaces:**
- Consumes: `MapDigitizer.initialGeoJson`, `MapDigitizer.editingEnabled`, `MapDigitizer.onPolygonDrawn`, and `isValidParcelFeature`.
- Produces: committed `geoData` and `geoAreaSqm` passed unchanged to the existing save workflow.

- [ ] **Step 1: Add draft session state and handlers**

Import the validator and add these states next to the existing spatial state:

```tsx
import { isValidParcelFeature } from '@/lib/spatial/parcel-geometry.mjs';

const [draftGeoData, setDraftGeoData] = useState<any>(null);
const [draftGeoAreaSqm, setDraftGeoAreaSqm] = useState(0);
const [editorInitialGeoData, setEditorInitialGeoData] = useState<any>(null);
const [mapSessionKey, setMapSessionKey] = useState(0);
const [spatialError, setSpatialError] = useState('');

const openTracingWorkspace = () => {
  setEditorInitialGeoData(geoData);
  setDraftGeoData(geoData);
  setDraftGeoAreaSqm(geoAreaSqm);
  setSpatialError('');
  setMapSessionKey(key => key + 1);
  setIsMapFullscreen(true);
};

const cancelTracingWorkspace = () => {
  setDraftGeoData(null);
  setDraftGeoAreaSqm(0);
  setSpatialError('');
  setMapSessionKey(key => key + 1);
  setIsMapFullscreen(false);
};

const validateTracingWorkspace = () => {
  if (!isValidParcelFeature(draftGeoData, draftGeoAreaSqm)) {
    setSpatialError('Tracez ou importez un polygone valide comportant au moins trois sommets.');
    return;
  }

  setGeoData(draftGeoData);
  setGeoAreaSqm(draftGeoAreaSqm);
  setSpatialError('');
  setIsMapFullscreen(false);
};
```

- [ ] **Step 2: Replace the icon-only control with a clear workspace action**

In compact mode, show one primary button on desktop and mobile:

```tsx
<button
  type="button"
  onClick={openTracingWorkspace}
  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#007FFF] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-blue-600"
>
  <Maximize className="h-4 w-4" />
  Ouvrir l&apos;espace de traçage
</button>
```

Do not open the full-screen workspace merely because the OCR stage finished.

- [ ] **Step 3: Build the full-screen header with validation and cancellation**

Replace the current single « Valider le tracé » button with:

```tsx
<div className="flex flex-wrap items-center justify-end gap-2">
  <button
    type="button"
    onClick={cancelTracingWorkspace}
    className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
  >
    Annuler
  </button>
  <button
    type="button"
    onClick={validateTracingWorkspace}
    className="inline-flex items-center gap-2 rounded-xl bg-[#007FFF] px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-600"
  >
    <CheckCircle2 className="h-4 w-4" />
    Valider le tracé
  </button>
</div>
```

Display `spatialError` below the header as a red alert and keep the workspace open when validation fails.

- [ ] **Step 4: Wire the draft into MapDigitizer**

Render the map with a keyed session:

```tsx
<MapDigitizer
  key={mapSessionKey}
  initialGeoJson={isMapFullscreen ? editorInitialGeoData : geoData}
  editingEnabled={isMapFullscreen}
  onPolygonDrawn={(geojson, area) => {
    if (!isMapFullscreen) return;
    setDraftGeoData(geojson);
    setDraftGeoAreaSqm(area);
    setSpatialError('');
  }}
/>
```

Show `draftGeoAreaSqm` in the full-screen header and `geoAreaSqm` in compact mode. The full-screen container remains `fixed inset-0` and its map area uses `flex-1 min-h-0` so `MapDigitizer` fills the available viewport.

- [ ] **Step 5: Preserve the unknown-location path**

When « Localisation spatiale inconnue » is checked, close an open editor, clear both committed and draft geometry, clear both areas, and increment `mapSessionKey`. Disable the workspace button while this option is checked.

- [ ] **Step 6: Correct the visible capability copy**

Change « CSV/KML » to « CSV/TXT » in the « Ancrage Spatial » explanation. Describe manual drawing as an optional fallback, not as an automatic RTK-equivalent precision claim.

- [ ] **Step 7: Run focused checks**

Run:

```bash
cd securifolio
node --test tests/unit/parcel-geometry.test.mjs
npx tsc --noEmit
```

Expected: geometry tests pass and TypeScript exits with code 0.

- [ ] **Step 8: Commit Smart Archive integration**

```bash
git add securifolio/src/app/smart-archive/page.tsx
git commit -m "feat: add full-screen tracing workspace"
```

---

### Task 4: Verify the complete tracing workflow

**Files:**
- Verify: `securifolio/src/app/smart-archive/page.tsx`
- Verify: `securifolio/src/components/MapDigitizer.tsx`
- Verify: `securifolio/src/lib/spatial/parcel-geometry.mjs`
- Verify: `securifolio/tests/unit/parcel-geometry.test.mjs`

**Interfaces:**
- Consumes: the complete tracing workspace.
- Produces: evidence that the existing save flow receives only validated committed GeoJSON.

- [ ] **Step 1: Run automated verification**

Run:

```bash
cd securifolio
node --test tests/unit/parcel-geometry.test.mjs
npx tsc --noEmit
npm run build
```

Expected: all commands exit with code 0.

- [ ] **Step 2: Verify RTK import in the browser**

Start the application with `npm run dev`, authenticate as an agent, open `/smart-archive`, reach « Résolution spatiale », and confirm:

1. the compact map remains 400 px high;
2. « Ouvrir l'espace de traçage » opens the full viewport;
3. importing `demo/1_smart_archive/rtk_1_authentique_450m2.csv` draws one polygon and fits its bounds;
4. the displayed area is positive;
5. moving a vertex changes the displayed area;
6. validating closes the editor and retains the polygon in the compact map.

- [ ] **Step 3: Verify manual drawing and cancellation**

Reopen the workspace and confirm:

1. the polygon tool is available;
2. drawing a polygon replaces the temporary imported polygon;
3. deleting all geometry prevents validation and shows the inline error;
4. cancelling after a modification restores the previously validated polygon;
5. checking « Localisation spatiale inconnue » clears the geometry and disables the workspace action.

- [ ] **Step 4: Review the final diff**

Run: `git diff --check HEAD~3..HEAD`

Expected: no whitespace errors. Confirm that no KML support is claimed and no unrelated file is included.

- [ ] **Step 5: Record final verification**

If verification required no corrective edit, do not create an empty commit. If a scoped correction was necessary, stage only the four files listed in this task and commit it with:

```bash
git commit -m "fix: polish geometer tracing workflow"
```
