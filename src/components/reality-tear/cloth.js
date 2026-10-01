// A tearable sheet: a grid of particles joined by distance constraints (Verlet
// integration), in screen pixels with y down and z towards the viewer. Ported
// from the page designer's tear easter egg (lib/cloth.ts there).
//
// The sheet is pinned along the edges you choose. Gravity wakes at the first
// touch, so torn flaps droop and dangle, and pieces torn free fall away.

// Tuned for thin paper: a wide, lifted pull bends the sheet before it rips, and
// torn parts hang rather than spring back.
const DAMPING = 0.985
// Faint while the sheet is whole (it sags a few px), stronger once it has torn.
const GRAVITY = 0.05 // px per step²
const GRAVITY_TORN = 0.2
const ITERATIONS = 8
// A constraint snaps beyond this multiple of its length, give or take a little
// per fibre so rips run ragged rather than in clean circles.
const TEAR_RATIO = 2.5
const TEAR_JITTER = 0.1
// Triangles stretched past this (below any snap point) aren't drawn: a sheet
// about to tear thins out, and torn edges don't grow long slivers.
const DRAW_STRETCH = 1.9
const GRAB_STRENGTH = 0.35
const GRAB_LIFT = 120 // px the middle of a grab lifts towards the viewer
// Torn edges curl up towards the viewer a little (per broken link), so loose
// flaps stand off the sheet and cast a shadow on it.
const CURL = 0.08 // px per step²
const CURL_HEIGHT = 40 // px

export class Cloth {
  /**
   * @param {object} o
   * @param {number} o.x Left of the sheet on screen, px.
   * @param {number} o.y Top of the sheet on screen, px.
   * @param {number} o.width
   * @param {number} o.height
   * @param {number} o.cols
   * @param {number} o.rows
   * @param {{ top?: boolean, right?: boolean, bottom?: boolean, left?: boolean }} o.pins Edges held in place.
   */
  constructor({ x, y, width, height, cols, rows, pins }) {
    this.cols = cols
    this.rows = rows
    this.count = (cols + 1) * (rows + 1)
    /** Particle positions, xyz. */
    this.pos = new Float32Array(this.count * 3)
    this.prev = new Float32Array(this.count * 3)
    this.rest = new Float32Array(this.count * 3)
    /** Where each particle sits on the sheet, 0..1 (u right, v down). */
    this.uv = new Float32Array(this.count * 2)
    this.pinned = new Uint8Array(this.count)
    /** Whether each particle is still joined to a pinned edge. */
    this.attached = new Uint8Array(this.count).fill(1)
    /** Broken links at each particle: how much its edge curls (and glows). */
    this.loose = new Uint8Array(this.count)
    this.brokenCount = 0
    /** Bumped whenever a constraint breaks. */
    this.version = 0
    this.grabs = new Map()
    this.dirty = false
    // Gravity starts with the first touch, so an untouched sheet doesn't sag.
    this.awake = false

    for (let r = 0; r <= rows; r++) {
      for (let c = 0; c <= cols; c++) {
        const i = this.id(c, r)
        this.rest[i * 3] = x + (c / cols) * width
        this.rest[i * 3 + 1] = y + (r / rows) * height
        this.uv[i * 2] = c / cols
        this.uv[i * 2 + 1] = r / rows
        if ((pins.top && r === 0) || (pins.bottom && r === rows) || (pins.left && c === 0) || (pins.right && c === cols)) this.pinned[i] = 1
      }
    }
    this.pos.set(this.rest)
    this.prev.set(this.rest)

    // Constraints in four runs so an edge's index follows from its cell:
    // horizontal, vertical, and the two diagonals of each cell.
    this.hBase = 0
    this.vBase = (rows + 1) * cols
    this.dBase = this.vBase + rows * (cols + 1)
    const total = this.dBase + 2 * rows * cols
    this.a = new Uint32Array(total)
    this.b = new Uint32Array(total)
    this.len = new Float32Array(total)
    /** Length beyond which each constraint snaps. */
    this.limit = new Float32Array(total)
    this.broken = new Uint8Array(total)
    let k = 0
    const link = (p, q) => {
      this.a[k] = p
      this.b[k] = q
      this.len[k] = Math.hypot(this.rest[q * 3] - this.rest[p * 3], this.rest[q * 3 + 1] - this.rest[p * 3 + 1])
      this.limit[k] = this.len[k] * TEAR_RATIO * (1 + (Math.random() * 2 - 1) * TEAR_JITTER)
      k++
    }
    for (let r = 0; r <= rows; r++) for (let c = 0; c < cols; c++) link(this.id(c, r), this.id(c + 1, r))
    for (let r = 0; r < rows; r++) for (let c = 0; c <= cols; c++) link(this.id(c, r), this.id(c, r + 1))
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) link(this.id(c, r + 1), this.id(c + 1, r))
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) link(this.id(c, r), this.id(c + 1, r + 1))

    // Each particle's constraints (CSR): adjacent[adjacentStart[i] .. adjacentStart[i + 1]].
    this.adjacentStart = new Uint32Array(this.count + 1)
    for (let e = 0; e < total; e++) {
      this.adjacentStart[this.a[e] + 1]++
      this.adjacentStart[this.b[e] + 1]++
    }
    for (let i = 0; i < this.count; i++) this.adjacentStart[i + 1] += this.adjacentStart[i]
    this.adjacent = new Uint32Array(total * 2)
    const fill = this.adjacentStart.slice(0, this.count)
    for (let e = 0; e < total; e++) {
      this.adjacent[fill[this.a[e]]++] = e
      this.adjacent[fill[this.b[e]]++] = e
    }
  }

  id(c, r) {
    return r * (this.cols + 1) + c
  }

  /** Takes hold of the sheet within `radius` of a point. Returns whether anything was caught. */
  grab(key, x, y, radius) {
    const particles = []
    const weights = []
    const offsets = []
    for (let i = 0; i < this.count; i++) {
      if (this.pinned[i]) continue
      const dx = this.pos[i * 3] - x
      const dy = this.pos[i * 3 + 1] - y
      const d2 = dx * dx + dy * dy
      if (d2 > radius * radius) continue
      particles.push(i)
      // A smooth falloff, so the pull fades into the sheet without a crease.
      const fall = 1 - d2 / (radius * radius)
      weights.push(fall * fall)
      offsets.push(dx, dy)
    }
    if (!particles.length) return false
    this.grabs.set(key, { x, y, particles, weights, offsets })
    this.awake = true
    return true
  }

  moveGrab(key, x, y) {
    const g = this.grabs.get(key)
    if (g) {
      g.x = x
      g.y = y
    }
  }

  release(key) {
    this.grabs.delete(key)
  }

  isHeld(key) {
    return this.grabs.has(key)
  }

  /** Cuts every constraint that the stroke from (x0, y0) to (x1, y1) crosses or passes near. */
  cut(x0, y0, x1, y1, radius) {
    const sx = x1 - x0
    const sy = y1 - y0
    const s2 = sx * sx + sy * sy
    const p = this.pos
    for (let k = 0; k < this.len.length; k++) {
      if (this.broken[k]) continue
      const i = this.a[k] * 3
      const j = this.b[k] * 3
      const mx = (p[i] + p[j]) / 2 - x0
      const my = (p[i + 1] + p[j + 1]) / 2 - y0
      const t = s2 > 0 ? Math.max(0, Math.min(1, (mx * sx + my * sy) / s2)) : 0
      const dx = mx - t * sx
      const dy = my - t * sy
      if (dx * dx + dy * dy < radius * radius || crosses(x0, y0, x1, y1, p[i], p[i + 1], p[j], p[j + 1])) this.snap(k)
    }
    this.awake = true
    this.settleTopology()
  }

  step() {
    const { pos, prev, pinned, loose } = this
    const gravity = !this.awake ? 0 : this.brokenCount > 0 ? GRAVITY_TORN : GRAVITY
    for (let i = 0; i < this.count; i++) {
      if (pinned[i]) continue
      const o = i * 3
      const vx = (pos[o] - prev[o]) * DAMPING
      const vy = (pos[o + 1] - prev[o + 1]) * DAMPING + gravity
      let vz = (pos[o + 2] - prev[o + 2]) * DAMPING
      if (loose[i] && pos[o + 2] < CURL_HEIGHT) vz += CURL * loose[i]
      prev[o] = pos[o]
      prev[o + 1] = pos[o + 1]
      prev[o + 2] = pos[o + 2]
      pos[o] += vx
      pos[o + 1] += vy
      pos[o + 2] += vz
    }

    for (const g of this.grabs.values()) {
      for (let n = 0; n < g.particles.length; n++) {
        const o = g.particles[n] * 3
        const w = g.weights[n] * GRAB_STRENGTH
        pos[o] += (g.x + g.offsets[n * 2] - pos[o]) * w
        pos[o + 1] += (g.y + g.offsets[n * 2 + 1] - pos[o + 1]) * w
        pos[o + 2] += (GRAB_LIFT * g.weights[n] - pos[o + 2]) * w
      }
    }

    const { a, b, len, limit, broken } = this
    for (let it = 0; it < ITERATIONS; it++) {
      for (let k = 0; k < len.length; k++) {
        if (broken[k]) continue
        const p = a[k]
        const q = b[k]
        const i = p * 3
        const j = q * 3
        const dx = pos[j] - pos[i]
        const dy = pos[j + 1] - pos[i + 1]
        const dz = pos[j + 2] - pos[i + 2]
        const d = Math.sqrt(dx * dx + dy * dy + dz * dz)
        if (d === 0) continue
        if (d > limit[k]) {
          this.snap(k)
          continue
        }
        const wp = pinned[p] ? 0 : 1
        const wq = pinned[q] ? 0 : 1
        if (wp + wq === 0) continue
        const f = (d - len[k]) / d / (wp + wq)
        pos[i] += dx * f * wp
        pos[i + 1] += dy * f * wp
        pos[i + 2] += dz * f * wp
        pos[j] -= dx * f * wq
        pos[j + 1] -= dy * f * wq
        pos[j + 2] -= dz * f * wq
      }
    }
    this.settleTopology()
  }

  /** Share of the sheet's constraints that are broken, 0..1. */
  get torn() {
    return this.brokenCount / this.len.length
  }

  /** Whether constraint `k` holds and isn't stretched too far to draw. */
  drawable(k) {
    if (this.broken[k]) return false
    const i = this.a[k] * 3
    const j = this.b[k] * 3
    const dx = this.pos[j] - this.pos[i]
    const dy = this.pos[j + 1] - this.pos[i + 1]
    const dz = this.pos[j + 2] - this.pos[i + 2]
    const max = this.len[k] * DRAW_STRETCH
    return dx * dx + dy * dy + dz * dz <= max * max
  }

  /**
   * Triangle indices for the sheet to draw: a triangle is drawn while all three
   * of its edges hold and none is overstretched. Returns the number written.
   */
  writeIndices(out) {
    const { cols, rows } = this
    let n = 0
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const top = this.drawable(this.hBase + r * cols + c)
        const bottom = this.drawable(this.hBase + (r + 1) * cols + c)
        const left = this.drawable(this.vBase + r * (cols + 1) + c)
        const right = this.drawable(this.vBase + r * (cols + 1) + c + 1)
        const diag = this.drawable(this.dBase + r * cols + c)
        const tl = this.id(c, r)
        const tr = tl + 1
        const bl = tl + cols + 1
        const br = bl + 1
        if (top && left && diag) {
          out[n++] = tl
          out[n++] = bl
          out[n++] = tr
        }
        if (bottom && right && diag) {
          out[n++] = bl
          out[n++] = br
          out[n++] = tr
        }
      }
    }
    return n
  }

  /** Smooth vertex normals, for shading folds; a flat sheet faces the viewer (+z). */
  writeNormals(out) {
    out.fill(0)
    const p = this.pos
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        // Each cell's normal from its two diagonals, shared by its four corners.
        const tl = this.id(c, r)
        const tr = tl + 1
        const bl = tl + this.cols + 1
        const br = bl + 1
        const ux = p[tr * 3] - p[bl * 3]
        const uy = p[tr * 3 + 1] - p[bl * 3 + 1]
        const uz = p[tr * 3 + 2] - p[bl * 3 + 2]
        const vx = p[br * 3] - p[tl * 3]
        const vy = p[br * 3 + 1] - p[tl * 3 + 1]
        const vz = p[br * 3 + 2] - p[tl * 3 + 2]
        const nx = uy * vz - uz * vy
        const ny = uz * vx - ux * vz
        const nz = ux * vy - uy * vx
        for (const i of [tl, tr, bl, br]) {
          out[i * 3] += nx
          out[i * 3 + 1] += ny
          out[i * 3 + 2] += nz
        }
      }
    }
    for (let i = 0; i < this.count; i++) {
      const o = i * 3
      const l = Math.hypot(out[o], out[o + 1], out[o + 2]) || 1
      out[o] /= l
      out[o + 1] /= l
      out[o + 2] /= l
    }
  }

  snap(k) {
    this.broken[k] = 1
    this.brokenCount++
    this.dirty = true
  }

  /** The particle at the other end of constraint `k` from `i`. */
  other(k, i) {
    return this.a[k] === i ? this.b[k] : this.a[k]
  }

  /**
   * After a tear: counts each particle's broken links (its curl), finds what is
   * still joined to a pinned edge, and gives each newly freed piece a tumble.
   */
  settleTopology() {
    if (!this.dirty) return
    this.dirty = false
    this.version++

    const { adjacentStart, adjacent, broken, loose } = this
    loose.fill(0)
    for (let k = 0; k < broken.length; k++) {
      if (!broken[k]) continue
      loose[this.a[k]] = Math.min(255, loose[this.a[k]] + 1)
      loose[this.b[k]] = Math.min(255, loose[this.b[k]] + 1)
    }

    const reached = new Uint8Array(this.count)
    const queue = new Uint32Array(this.count)
    let tail = 0
    for (let i = 0; i < this.count; i++) {
      if (this.pinned[i]) {
        reached[i] = 1
        queue[tail++] = i
      }
    }
    for (let head = 0; head < tail; head++) {
      const i = queue[head]
      for (let e = adjacentStart[i]; e < adjacentStart[i + 1]; e++) {
        const k = adjacent[e]
        if (broken[k]) continue
        const n = this.other(k, i)
        if (!reached[n]) {
          reached[n] = 1
          queue[tail++] = n
        }
      }
    }

    // Each newly freed piece gets a small tumble, so it tips as it falls.
    const seen = new Uint8Array(this.count)
    for (let start = 0; start < this.count; start++) {
      if (reached[start] || !this.attached[start] || seen[start]) continue
      let size = 0
      queue[size++] = start
      seen[start] = 1
      for (let head = 0; head < size; head++) {
        const i = queue[head]
        for (let e = adjacentStart[i]; e < adjacentStart[i + 1]; e++) {
          const k = adjacent[e]
          if (broken[k]) continue
          const n = this.other(k, i)
          if (!seen[n] && !reached[n]) {
            seen[n] = 1
            queue[size++] = n
          }
        }
      }
      let cx = 0
      let cy = 0
      for (let h = 0; h < size; h++) {
        cx += this.pos[queue[h] * 3]
        cy += this.pos[queue[h] * 3 + 1]
      }
      cx /= size
      cy /= size
      const angle = Math.random() * Math.PI * 2
      const spin = 0.01 + Math.random() * 0.015
      for (let h = 0; h < size; h++) {
        const p = queue[h]
        const along = (this.pos[p * 3] - cx) * Math.cos(angle) + (this.pos[p * 3 + 1] - cy) * Math.sin(angle)
        this.prev[p * 3 + 2] -= along * spin
      }
    }
    this.attached.set(reached)
  }
}

/** Whether segment ab crosses segment cd. */
function crosses(ax, ay, bx, by, cx, cy, dx, dy) {
  const side = (px, py, qx, qy, rx, ry) => (qx - px) * (ry - py) - (qy - py) * (rx - px)
  const c = side(ax, ay, bx, by, cx, cy)
  const d = side(ax, ay, bx, by, dx, dy)
  const a = side(cx, cy, dx, dy, ax, ay)
  const b = side(cx, cy, dx, dy, bx, by)
  return c * d < 0 && a * b < 0
}
