import * as THREE from 'three'
import { Cloth } from './cloth'
import { clamp } from './gesture'

const glyphs = 'アイウエオカキクケコサシスセソタチツテトナニヌネノ012345789ZX<>:='
const STEP = 1 / 60
// About 7,000 particles at most: smooth tears, a few ms per step even on a phone.
const MAX_PARTICLES = 7000

// The sheet is laid out in screen pixels (y down, z towards the viewer) and
// projected here with a mild perspective, so a lifted flap grows a little.
const sheetVertex = `
  attribute float loose;
  uniform vec2 view;
  uniform float shadow;
  varying vec2 vUv; varying vec3 vNormal; varying float vLoose; varying float vHeight;
  const float FOCAL = 1600.0;
  void main() {
    vec3 p = position;
    vHeight = max(p.z, 0.0);
    if (shadow > .5) {
      // Shadows fall down and right, further the higher the paper lifts, and sit
      // just above the flat sheet so they land on it but hide behind lifted parts.
      p.xy += vec2(2., 4.) + vHeight * vec2(.3, .5);
      p.z = 2.;
    }
    vec2 c = view * .5;
    float z = clamp(p.z, -FOCAL * .6, FOCAL * .6);
    vec2 q = c + (p.xy - c) * (FOCAL / (FOCAL - z));
    gl_Position = vec4(q.x / view.x * 2. - 1., 1. - q.y / view.y * 2., -z / FOCAL, 1.);
    vUv = uv; vNormal = normal; vLoose = loose;
  }
`

export class TearRenderer {
  constructor(canvas) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, stencil: true, powerPreference: 'high-performance' })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7))
    this.renderer.setClearColor(0x010503)
    this.scene = new THREE.Scene()
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 20)
    this.camera.position.z = 5
    this.carry = 0
    this.rain = document.createElement('canvas')
    this.rain.width = 768
    this.rain.height = 1024
    this.rainCtx = this.rain.getContext('2d', { alpha: false })
    this.rainTexture = new THREE.CanvasTexture(this.rain)
    // What lies behind the sheet: always drawn first, never in front.
    this.back = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.MeshBasicMaterial({ map: this.rainTexture, depthTest: false, depthWrite: false }))
    this.back.renderOrder = 0
    this.scene.add(this.back)
    this.preview = this.makePreview()
    this.previewTexture = new THREE.CanvasTexture(this.preview)
    this.previewTexture.colorSpace = THREE.SRGBColorSpace
    this.view = new THREE.Vector2(1, 1)
    this.material = new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      uniforms: {
        image: { value: this.previewTexture },
        crop: { value: new THREE.Vector2(1, 1) },
        mirror: { value: false },
        view: { value: this.view },
        shadow: { value: 0 },
      },
      vertexShader: sheetVertex,
      fragmentShader: `
        uniform sampler2D image; uniform vec2 crop; uniform bool mirror;
        varying vec2 vUv; varying vec3 vNormal; varying float vLoose;
        const vec3 LIGHT = vec3(-.35, -.55, 1.);
        void main() {
          vec2 uv = (vec2(vUv.x, 1. - vUv.y) - .5) * crop + .5;
          if (mirror) uv.x = 1. - uv.x;
          vec3 color = texture2D(image, uv).rgb;
          vec3 n = normalize(vNormal);
          // The back of reality is dark and faintly green.
          if (!gl_FrontFacing) { n = -n; color = color * .32 + vec3(.1, .13, .11); }
          vec3 l = normalize(LIGHT);
          // Lying flat reads exactly as the camera sees it; folds catch or lose the light.
          color *= clamp(.7 + .3 * max(dot(n, l), 0.) / l.z, .5, 1.08);
          // Torn edges glow acid green.
          color += vec3(.15, .65, .25) * smoothstep(0., 2.5, vLoose) * .6;
          gl_FragColor = vec4(color, 1.);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `,
    })
    this.shadowMaterial = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      // Each pixel darkens once, however many flaps overlap it.
      stencilWrite: true,
      stencilFunc: THREE.EqualStencilFunc,
      stencilRef: 0,
      stencilZPass: THREE.IncrementStencilOp,
      uniforms: { view: { value: this.view }, shadow: { value: 1 } },
      vertexShader: sheetVertex,
      fragmentShader: `
        varying float vHeight;
        void main() { gl_FragColor = vec4(0., 0., 0., .3 * smoothstep(4., 48., vHeight)); }
      `,
    })
    this.resize()
  }

  makePreview() {
    const canvas = document.createElement('canvas')
    canvas.width = 1200; canvas.height = 1600
    const c = canvas.getContext('2d')
    c.fillStyle = '#171c19'; c.fillRect(0, 0, 1200, 1600)
    const glow = c.createRadialGradient(700, 600, 30, 600, 800, 1100)
    glow.addColorStop(0, '#57645b'); glow.addColorStop(0.5, '#29332d'); glow.addColorStop(1, '#0a100d')
    c.fillStyle = glow; c.fillRect(0, 0, 1200, 1600)
    // A quiet architectural surface makes the material's bending readable.
    c.lineWidth = 2
    for (let i = -8; i < 18; i++) {
      c.strokeStyle = 'rgba(181,205,186,.10)'
      c.beginPath(); c.moveTo(i * 180, 0); c.lineTo(i * 180 - 300, 1600); c.stroke()
    }
    for (let y = 0; y < 1600; y += 220) {
      c.strokeStyle = 'rgba(0,0,0,.24)'; c.beginPath(); c.moveTo(0, y); c.lineTo(1200, y + 120); c.stroke()
    }
    const pixels = c.getImageData(0, 0, 1200, 1600)
    for (let i = 0; i < pixels.data.length; i += 4) {
      const n = (Math.random() - 0.5) * 9
      pixels.data[i] += n; pixels.data[i + 1] += n; pixels.data[i + 2] += n
    }
    c.putImageData(pixels, 0, 0)
    c.save(); c.translate(600, 780); c.rotate(-0.08)
    c.textAlign = 'center'; c.fillStyle = 'rgba(213,224,215,.19)'
    c.font = '900 174px Arial'; c.fillText('REALITY', 0, 0)
    c.font = '16px monospace'; c.fillText('THE SURFACE IS ONLY THE BEGINNING', 0, 54)
    c.restore()
    return canvas
  }

  resize() {
    const { clientWidth: w, clientHeight: h } = this.renderer.domElement
    this.w = Math.max(1, w)
    this.h = Math.max(1, h)
    this.aspect = this.w / this.h
    this.view.set(this.w, this.h)
    this.renderer.setSize(w, h, false)
    this.camera.left = -this.aspect; this.camera.right = this.aspect
    this.camera.updateProjectionMatrix()
    this.back.scale.x = this.aspect
    const rainWidth = Math.min(2048, Math.round(1024 * this.aspect))
    this.rain.width = rainWidth
    this.rain.height = Math.round(rainWidth / this.aspect)
    this.rainTexture.dispose()
    this.rainTexture = new THREE.CanvasTexture(this.rain)
    this.rainTexture.colorSpace = THREE.SRGBColorSpace
    this.rainTexture.minFilter = THREE.LinearFilter
    this.back.material.map = this.rainTexture
    this.lastRain = 0
    this.streams = Array.from({ length: Math.ceil(rainWidth / 9) }, (_, i) => ({
      x: ((i * 0.61803398875) % 1) * rainWidth,
      y: Math.random() * this.rain.height * 1.8,
      speed: 40 + Math.random() * 100,
      length: 8 + Math.floor(Math.random() * 20),
      size: (10 + (i % 3) * 5) * this.rain.height / 1024,
      depth: 0.25 + (i % 3) * 0.32,
    }))
    this.updateCrop()
    // A new size is a new sheet.
    this.reset()
  }

  /** A fresh, whole sheet over the whole view, held on all four edges. */
  reset() {
    const cell = clamp(Math.sqrt((this.w * this.h) / MAX_PARTICLES), 9, 24)
    const cols = Math.max(8, Math.round(this.w / cell))
    const rows = Math.max(8, Math.round(this.h / cell))
    this.cloth = new Cloth({ x: 0, y: 0, width: this.w, height: this.h, cols, rows, pins: { top: true, right: true, bottom: true, left: true } })
    this.grabRadius = clamp(Math.min(this.w, this.h) * 0.14, 50, 160)
    this.normals = new Float32Array(this.cloth.count * 3)
    this.looseness = new Float32Array(this.cloth.count)
    this.looseVersion = -1
    this.indices = new Uint16Array(cols * rows * 6)
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(this.cloth.pos, 3).setUsage(THREE.DynamicDrawUsage))
    geometry.setAttribute('normal', new THREE.BufferAttribute(this.normals, 3).setUsage(THREE.DynamicDrawUsage))
    geometry.setAttribute('uv', new THREE.BufferAttribute(this.cloth.uv, 2))
    geometry.setAttribute('loose', new THREE.BufferAttribute(this.looseness, 1).setUsage(THREE.DynamicDrawUsage))
    geometry.setIndex(new THREE.BufferAttribute(this.indices, 1).setUsage(THREE.DynamicDrawUsage))
    if (this.sheet) {
      this.scene.remove(this.sheet, this.shadows)
      this.sheet.geometry.dispose()
    }
    this.sheet = new THREE.Mesh(geometry, this.material)
    this.shadows = new THREE.Mesh(geometry, this.shadowMaterial)
    for (const [mesh, order] of [[this.sheet, 1], [this.shadows, 2]]) {
      mesh.frustumCulled = false
      mesh.renderOrder = order
      this.scene.add(mesh)
    }
    this.updateSheet()
  }

  /** Takes hold of the sheet at a point in CSS px; returns whether it caught anything. */
  grab(key, x, y) {
    return this.cloth.grab(key, x, y, this.grabRadius)
  }

  moveGrab(key, x, y) {
    this.cloth.moveGrab(key, x, y)
  }

  release(key) {
    this.cloth.release(key)
  }

  isHeld(key) {
    return this.cloth.isHeld(key)
  }

  cut(x0, y0, x1, y1) {
    this.cloth.cut(x0, y0, x1, y1, 7)
  }

  /** How much of the sheet has torn, 0..1. */
  get torn() {
    return this.cloth.torn
  }

  /**
   * The intro's loop: two unseen hands take hold of the sheet, pull it apart until
   * it rips, let go, and the sheet heals for the next round.
   */
  playIntro(time) {
    const length = 7.5
    const phase = (time % length) / length
    const round = Math.floor(time / length)
    if (round !== this.introRound) {
      this.introRound = round
      this.reset()
    }
    const cx = this.w * .62, cy = this.h * .46, start = Math.min(this.w, this.h) * .05
    const pull = clamp((phase - .08) / .42, 0, 1)
    const reach = start + pull * pull * Math.min(this.w, this.h) * .32
    if (phase > .08 && phase < .5) {
      if (!this.isHeld('intro-a')) {
        this.grab('intro-a', cx - start, cy)
        this.grab('intro-b', cx + start, cy + 10)
      }
      this.moveGrab('intro-a', cx - reach, cy - reach * .12)
      this.moveGrab('intro-b', cx + reach, cy + 10 + reach * .1)
    } else if (this.isHeld('intro-a')) {
      this.release('intro-a'); this.release('intro-b')
    }
  }

  setVideo(video, mirror) {
    this.videoTexture?.dispose()
    this.video = video
    if (video) {
      this.videoTexture = new THREE.VideoTexture(video)
      this.videoTexture.colorSpace = THREE.SRGBColorSpace
      this.material.uniforms.image.value = this.videoTexture
    } else {
      this.videoTexture = null
      this.material.uniforms.image.value = this.previewTexture
    }
    this.material.uniforms.mirror.value = mirror
    this.updateCrop()
  }

  updateCrop() {
    const aspect = this.video ? this.video.videoWidth / this.video.videoHeight : 1200 / 1600
    this.material.uniforms.crop.value.set(Math.min(1, this.aspect / aspect), Math.min(1, aspect / this.aspect))
  }

  drawRain(time) {
    const c = this.rainCtx
    c.fillStyle = '#010704'; c.fillRect(0, 0, this.rain.width, this.rain.height)
    for (const stream of this.streams) {
      const head = (stream.y + time * stream.speed) % (this.rain.height + stream.length * stream.size)
      c.font = `${stream.size}px monospace`
      for (let j = 0; j < stream.length; j++) {
        const y = head - j * stream.size
        if (y < -20 || y > this.rain.height + 20) continue
        const alpha = (1 - j / stream.length) * stream.depth
        c.fillStyle = j === 0 ? `rgba(204,255,219,${stream.depth})` : `rgba(45,245,108,${alpha})`
        const index = Math.abs(Math.floor(stream.x * 7 + j * 13 + time * (j === 0 ? 14 : 2))) % glyphs.length
        c.fillText(glyphs[index], stream.x, y)
      }
    }
    this.rainTexture.needsUpdate = true
  }

  /** Copies the simulation into the mesh. */
  updateSheet() {
    const geometry = this.sheet.geometry
    const count = this.cloth.writeIndices(this.indices)
    geometry.setDrawRange(0, count)
    geometry.index.needsUpdate = true
    this.cloth.writeNormals(this.normals)
    geometry.attributes.position.needsUpdate = true
    geometry.attributes.normal.needsUpdate = true
    if (this.looseVersion !== this.cloth.version) {
      this.looseVersion = this.cloth.version
      this.looseness.set(this.cloth.loose)
      geometry.attributes.loose.needsUpdate = true
    }
  }

  render(time, delta) {
    // Fixed steps, so the paper behaves the same at any frame rate.
    this.carry = Math.min(this.carry + delta, STEP * 4)
    while (this.carry >= STEP) {
      this.cloth.step()
      this.carry -= STEP
    }
    this.updateSheet()
    // Only worth drawing once something has torn; until then the sheet hides it.
    if (this.cloth.brokenCount && (!this.lastRain || time - this.lastRain > 1 / 30)) {
      this.drawRain(time); this.lastRain = time
    }
    this.renderer.render(this.scene, this.camera)
  }

  dispose() {
    this.sheet.geometry.dispose()
    this.material.dispose(); this.shadowMaterial.dispose()
    this.videoTexture?.dispose(); this.previewTexture.dispose()
    this.rainTexture.dispose(); this.back.geometry.dispose(); this.back.material.dispose()
    this.renderer.dispose()
  }
}
