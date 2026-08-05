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

test('rejects missing geometry', () => {
  assert.equal(isValidParcelFeature(null, 450), false)
})

test('rejects geometry that is not a polygon', () => {
  assert.equal(
    isValidParcelFeature(
      {
        ...validPolygon,
        geometry: { type: 'Point', coordinates: [15, -4] },
      },
      450,
    ),
    false,
  )
})

test('rejects a ring with fewer than three distinct vertices', () => {
  assert.equal(
    isValidParcelFeature(
      {
        ...validPolygon,
        geometry: {
          type: 'Polygon',
          coordinates: [[[15, -4], [15, -4], [15, -4], [15, -4]]],
        },
      },
      10,
    ),
    false,
  )
})

test('rejects zero, infinite, and NaN areas', () => {
  assert.equal(isValidParcelFeature(validPolygon, 0), false)
  assert.equal(isValidParcelFeature(validPolygon, Number.POSITIVE_INFINITY), false)
  assert.equal(isValidParcelFeature(validPolygon, Number.NaN), false)
})
