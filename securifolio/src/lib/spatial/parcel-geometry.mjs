/**
 * Vérifie qu'une géométrie représente une parcelle polygonale exploitable.
 *
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
