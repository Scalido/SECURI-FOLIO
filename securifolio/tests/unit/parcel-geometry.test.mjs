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

test('rejects open, non-finite, out-of-range and self-crossing parcel rings', () => {
  for (const ring of [
    [[15,-4],[16,-4],[16,-5]],
    [[15,-4],[Infinity,-4],[16,-5],[15,-4]],
    [[200,95],[201,95],[201,94],[200,95]],
    [[0,0],[3,3],[0,3],[2,0],[0,0]],
    [[0,0],[1,0],[2,0],[0,0]],
  ]) {
    const feature = {type:'Feature', properties:{}, geometry:{type:'Polygon',coordinates:[ring]}}
    assert.equal(isValidParcelFeature(feature,100),false,JSON.stringify(ring))
  }
})

test('rejects an invalid inner ring even when the outer ring is valid', () => {
  const feature=structuredClone(validPolygon)
  feature.geometry.coordinates.push([[200,95],[201,95],[201,94],[200,95]])
  assert.equal(isValidParcelFeature(feature,450),false)
})

test('holes must be inside the exterior and cannot overlap or contain one another', () => {
  const outer=[[15,-4],[15.1,-4],[15.1,-4.1],[15,-4.1],[15,-4]]
  const hole=[[15.01,-4.01],[15.05,-4.01],[15.05,-4.05],[15.01,-4.05],[15.01,-4.01]]
  const nested=[[15.02,-4.02],[15.03,-4.02],[15.03,-4.03],[15.02,-4.03],[15.02,-4.02]]
  const outside=hole.map(([x,y])=>[x+1,y])
  const touching=[[15,-4.01],[15.02,-4.01],[15.02,-4.03],[15,-4.03],[15,-4.01]]
  const parcel=rings=>({type:'Feature',properties:{},geometry:{type:'Polygon',coordinates:rings}})
  assert.equal(isValidParcelFeature(parcel([outer,hole])),true)
  for(const rings of [[outer,outside],[outer,hole,nested],[outer,touching]])assert.equal(isValidParcelFeature(parcel(rings)),false)
})
