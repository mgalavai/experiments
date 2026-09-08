import test from 'node:test'
import assert from 'node:assert/strict'
import { cameraPoint, TearGesture, pinchRatio } from './gesture.js'

const grips = (a, b, pinched = true) => [{ x: a, y: .5, pinched }, { x: b, y: .5, pinched }]
test('two pinches grab, pulling tears, release preserves opening, regrab does not jump', () => {
  const g = new TearGesture()
  assert.equal(g.update(grips(.4, .6, false)), false)
  assert.equal(g.width, 0)
  g.update(grips(.4, .6)); assert.equal(g.width, 0)
  g.update(grips(.2, .8)); assert.ok(g.width > .5)
  const width = g.width
  g.update([]); assert.equal(g.width, width)
  g.update(grips(.1, .9)); assert.equal(g.width, width)
  g.update(grips(.2, .8)); assert.equal(g.width, width)
  g.reset(); assert.equal(g.width, 0); assert.equal(g.grab, null)
})
test('one hand cannot trigger the tear and hand order does not matter', () => {
  const g = new TearGesture()
  assert.equal(g.update(grips(.4, .6).slice(0, 1)), false)
  g.update(grips(.4, .6).reverse()); g.update(grips(.2, .8))
  assert.ok(g.width > .5)
})
test('camera crop and selfie mirroring agree with portrait cover mapping', () => {
  const center = cameraPoint({x:.5,y:.5},16/9,9/16,true)
  assert.deepEqual(center,{x:.5,y:.5})
  const visibleLeft = .5 - ((9/16)/(16/9))/2
  assert.ok(Math.abs(cameraPoint({x:visibleLeft,y:.5},16/9,9/16,false).x) < 1e-9)
  assert.ok(Math.abs(cameraPoint({x:visibleLeft,y:.5},16/9,9/16,true).x-1) < 1e-9)
})
test('pinch detection is independent of hand scale', () => {
  const points = Array.from({length:21},()=>({x:0,y:0,z:0}))
  points[9]={x:0,y:.2,z:0}; points[8]={x:.03,y:0,z:0}
  assert.ok(Math.abs(pinchRatio(points)-.15)<1e-9)
  assert.ok(Math.abs(pinchRatio(points.map(p=>({x:p.x*2,y:p.y*2,z:0})))-.15)<1e-9)
})
