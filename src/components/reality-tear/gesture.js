export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))

// Match the exact cover crop used by the camera material, including selfie mirroring.
export function cameraPoint(point, videoAspect, screenAspect, mirror) {
  const sx = Math.min(1, screenAspect / videoAspect)
  const sy = Math.min(1, videoAspect / screenAspect)
  return { x: ((mirror ? 1 - point.x : point.x) - 0.5) / sx + 0.5, y: (point.y - 0.5) / sy + 0.5 }
}

export function pinchRatio(landmarks) {
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, (a.z || 0) - (b.z || 0))
  return distance(landmarks[4], landmarks[8]) / Math.max(0.01, distance(landmarks[0], landmarks[9]))
}

// A pinch closes below the first ratio and opens again only above the second,
// so a pinch held near the threshold doesn't flicker.
const PINCH_CLOSE = 0.4
const PINCH_OPEN = 0.58
// How quickly a hand's grip follows its latest detection (per second).
const FOLLOW = 18

/**
 * Turns tracked hands into grips on the sheet. Each hand keeps its slot across
 * detections (matched to the nearest previous position, so crossing hands don't
 * swap), and each grip eases toward its latest detection every render frame, so
 * the sheet moves smoothly although detection runs at ~15 Hz.
 */
export class HandGrips {
  constructor(slots = 2) {
    this.slots = Array.from({ length: slots }, () => null)
  }

  reset() {
    this.slots.fill(null)
  }

  /** A new detection: hands as `{ x, y, ratio }` in 0..1 screen space. */
  detect(points) {
    const free = new Set(this.slots.keys())
    const next = this.slots.map(() => null)
    // Pair each hand with the nearest slot that had one, closest pairs first.
    const pairs = []
    points.forEach((point, p) => this.slots.forEach((slot, s) => {
      if (slot) pairs.push({ p, s, d: Math.hypot(point.x - slot.target.x, point.y - slot.target.y) })
    }))
    pairs.sort((a, b) => a.d - b.d)
    const placed = new Set()
    for (const { p, s } of pairs) {
      if (placed.has(p) || !free.has(s)) continue
      placed.add(p)
      free.delete(s)
      next[s] = this.follow(this.slots[s], points[p])
    }
    // New hands take the free slots, starting where they were seen.
    points.forEach((point, p) => {
      if (placed.has(p) || !free.size) return
      const s = free.values().next().value
      free.delete(s)
      next[s] = this.follow(null, point)
    })
    this.slots = next
  }

  follow(slot, point) {
    const wasPinched = slot?.pinched ?? false
    return {
      target: { x: point.x, y: point.y },
      at: slot ? slot.at : { x: point.x, y: point.y },
      pinched: point.ratio < (wasPinched ? PINCH_OPEN : PINCH_CLOSE),
    }
  }

  /** Eases each grip toward its hand; returns `[{ slot, x, y, pinched }]` for the hands in view. */
  advance(delta) {
    const k = 1 - Math.exp(-delta * FOLLOW)
    const out = []
    this.slots.forEach((slot, i) => {
      if (!slot) return
      slot.at.x += (slot.target.x - slot.at.x) * k
      slot.at.y += (slot.target.y - slot.at.y) * k
      out.push({ slot: i, x: slot.at.x, y: slot.at.y, pinched: slot.pinched })
    })
    return out
  }
}
