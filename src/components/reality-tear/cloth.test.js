import test from 'node:test'
import assert from 'node:assert/strict'
import { Cloth } from './cloth.js'

// A full-screen sheet held on all four edges, 14 px cells.
const W = 700, H = 980, COLS = 50, ROWS = 70
const sheet = () => new Cloth({ x: 0, y: 0, width: W, height: H, cols: COLS, rows: ROWS, pins: { top: true, right: true, bottom: true, left: true } })
const detached = cloth => cloth.attached.reduce((n, a) => n + (a ? 0 : 1), 0)

function pullApart(cloth, distance, frames) {
  cloth.grab('a', W / 2 - 40, H / 2, 100)
  cloth.grab('b', W / 2 + 40, H / 2, 100)
  for (let f = 1; f <= frames; f++) {
    const t = Math.min(1, f / (frames * 0.7))
    cloth.moveGrab('a', W / 2 - 40 - distance * t, H / 2)
    cloth.moveGrab('b', W / 2 + 40 + distance * t, H / 2)
    cloth.step()
  }
}

test('left alone, the sheet stays put', () => {
  const cloth = sheet()
  for (let f = 0; f < 200; f++) cloth.step()
  for (let i = 0; i < cloth.pos.length; i++) assert.ok(Math.abs(cloth.pos[i] - cloth.rest[i]) < 1e-3)
})

test('two hands pulling a little stretch it without tearing', () => {
  const cloth = sheet()
  pullApart(cloth, 30, 30)
  assert.equal(cloth.brokenCount, 0)
})

test('two hands pulling apart rip it open between them, and the frame holds', () => {
  const cloth = sheet()
  pullApart(cloth, 260, 90)
  assert.ok(cloth.brokenCount > 0)
  // The rip runs between the hands.
  let between = 0
  for (let k = 0; k < cloth.broken.length; k++) {
    if (!cloth.broken[k]) continue
    const x = cloth.rest[cloth.a[k] * 3]
    if (x > W / 2 - 120 && x < W / 2 + 120) between++
  }
  assert.ok(between > 0)
  for (let i = 0; i < cloth.count; i++) {
    if (!cloth.pinned[i]) continue
    assert.equal(cloth.pos[i * 3], cloth.rest[i * 3])
    assert.equal(cloth.pos[i * 3 + 1], cloth.rest[i * 3 + 1])
  }
})

test('a piece cut free falls away; the rest stays held by the frame', () => {
  const cloth = sheet()
  const box = [[200, 300], [500, 300], [500, 600], [200, 600]]
  for (let i = 0; i < 4; i++) cloth.cut(...box[i], ...box[(i + 1) % 4], 6)
  assert.ok(detached(cloth) > 0)
  for (let f = 0; f < 120; f++) cloth.step()
  for (let i = 0; i < cloth.count; i++) {
    if (!cloth.attached[i]) assert.ok(cloth.pos[i * 3 + 1] > cloth.rest[i * 3 + 1] + 100)
  }
})

test('torn edges are marked loose, which lights them, and curl towards the viewer', () => {
  const cloth = sheet()
  // Between particle columns 24 and 25, so the links across are severed.
  cloth.cut(347, 200, 347, 700, 4)
  const edge = cloth.id(24, 30)
  assert.ok(cloth.loose[edge] > 0)
  for (let f = 0; f < 60; f++) cloth.step()
  assert.ok(cloth.pos[edge * 3 + 2] > 5)
})

test('only intact, unstretched cells are drawn', () => {
  const cloth = sheet()
  const out = new Uint16Array(COLS * ROWS * 6)
  assert.equal(cloth.writeIndices(out), COLS * ROWS * 6)
  cloth.cut(300, 200, 300, 260, 4)
  assert.ok(cloth.writeIndices(out) < COLS * ROWS * 6)
})
