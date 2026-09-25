import { area, booleanValid, kinks, booleanContains, booleanDisjoint, polygon, lineString } from '@turf/turf'

/** Validate every ring and independently recompute area; never trust a supplied area alone.
 * @param {unknown} feature
 * @param {number} [areaSqm]
 */
export function isValidParcelFeature(feature, areaSqm = undefined) {
  if (areaSqm !== undefined && (!Number.isFinite(areaSqm) || areaSqm <= 0)) return false
  if (!feature || feature.type !== 'Feature' || feature.geometry?.type !== 'Polygon') return false
  const rings = feature.geometry.coordinates
  if (!Array.isArray(rings) || rings.length === 0) return false
  let vertices = 0
  for (const ring of rings) {
    if (!Array.isArray(ring) || ring.length < 4 || (vertices += ring.length) > 10000) return false
    if (!ring.every(p => Array.isArray(p) && p.length >= 2 &&
      Number.isFinite(p[0]) && Number.isFinite(p[1]) && Math.abs(p[0]) <= 180 && Math.abs(p[1]) <= 90)) return false
    const first = ring[0], last = ring[ring.length - 1]
    if (first[0] !== last[0] || first[1] !== last[1]) return false
    if (new Set(ring.slice(0,-1).map(p => `${p[0]}:${p[1]}`)).size !== ring.length - 1) return false
  }
  try {
    const shell = polygon([rings[0]])
    for (let i = 1; i < rings.length; i++) {
      const hole = polygon([rings[i]])
      if (!booleanContains(shell, hole) || !booleanDisjoint(lineString(rings[0]), lineString(rings[i]))) return false
      for (let j = 1; j < i; j++) if (!booleanDisjoint(hole, polygon([rings[j]]))) return false
    }
    const computedArea = area(feature)
    return Number.isFinite(computedArea) && computedArea > 0 && booleanValid(feature) && kinks(feature).features.length === 0
  } catch { return false }
}
