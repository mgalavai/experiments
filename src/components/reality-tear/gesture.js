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

export class TearGesture {
  constructor() { this.reset() }
  reset() {
    this.width = 0
    this.center = { x: 0.5, y: 0.5 }
    this.grab = null
  }
  release() { this.grab = null }
  update(points) {
    if (points.length !== 2 || points.some(p => !p.pinched)) {
      this.release()
      return false
    }
    const [a, b] = [...points].sort((a, b) => a.x - b.x)
    const distance = Math.hypot(a.x - b.x, (a.y - b.y) * 0.45)
    if (!this.grab) {
      if (this.width < 0.01) this.center = { x: clamp((a.x + b.x) / 2, 0.2, 0.8), y: clamp((a.y + b.y) / 2, 0.2, 0.8) }
      this.grab = { distance, width: this.width }
    }
    this.width = Math.max(this.width, clamp(this.grab.width + Math.max(0, distance - this.grab.distance - .018) * 1.35, 0, 0.86))
    return true
  }
}
