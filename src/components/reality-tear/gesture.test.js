import test from 'node:test'
import assert from 'node:assert/strict'
import { cameraPoint, HandGrips, pinchRatio } from './gesture.js'

const hand = (x, y, ratio) => ({ x, y, ratio })

test('each hand keeps its slot as the hands move, even when they cross', () => {
  const grips = new HandGrips()
  grips.detect([hand(.3, .5, .3), hand(.7, .5, .3)])
  const left = grips.slots.findIndex(s => s.target.x === .3)
  // The hands pass each other a little per detection, reported in either order.
  for (let x = .3; x <= .7 + 1e-9; x += .04) {
    const a = hand(x, .5, .3), b = hand(1 - x, .52, .3)
    grips.detect(x * 100 % 2 < 1 ? [a, b] : [b, a])
  }
  assert.ok(Math.abs(grips.slots[left].target.x - .7) < 1e-9, 'the left hand, now on the right, kept its slot')
})
test('a pinch closes below the close ratio and holds until it opens past the open ratio', () => {
  const grips = new HandGrips()
  grips.detect([hand(.5, .5, .5)]); assert.equal(grips.advance(0)[0].pinched, false)
  grips.detect([hand(.5, .5, .35)]); assert.equal(grips.advance(0)[0].pinched, true)
  grips.detect([hand(.5, .5, .5)]); assert.equal(grips.advance(0)[0].pinched, true, 'still pinched in the band')
  grips.detect([hand(.5, .5, .62)]); assert.equal(grips.advance(0)[0].pinched, false)
})
test('a grip eases toward its hand instead of jumping, and a new hand starts where it is seen', () => {
  const grips = new HandGrips()
  grips.detect([hand(.2, .5, .3)])
  assert.deepEqual(grips.advance(1 / 60).map(g => [g.x, g.y]), [[.2, .5]])
  grips.detect([hand(.6, .5, .3)])
  const first = grips.advance(1 / 60)[0].x
  assert.ok(first > .2 && first < .6)
  let x = first
  for (let i = 0; i < 60; i++) x = grips.advance(1 / 60)[0].x
  assert.ok(Math.abs(x - .6) < .001)
})
test('a hand that leaves the view frees its slot', () => {
  const grips = new HandGrips()
  grips.detect([hand(.3, .5, .3), hand(.7, .5, .3)])
  grips.detect([hand(.31, .5, .3)])
  assert.equal(grips.advance(0).length, 1)
  grips.reset()
  assert.equal(grips.advance(0).length, 0)
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
