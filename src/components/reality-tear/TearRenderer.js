import * as THREE from 'three'
import { clamp } from './gesture'

const COLS = 34
const ROWS = 100
const glyphs = 'アイウエオカキクケコサシスセソタチツテトナニヌネノ012345789ZX<>:='

function makeSheet(side) {
  const positions = new Float32Array((COLS + 1) * (ROWS + 1) * 3)
  const uvs = new Float32Array((COLS + 1) * (ROWS + 1) * 2)
  const indices = []
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const a = y * (COLS + 1) + x, b = a + COLS + 1
      if (side === 1) indices.push(a, b, a + 1, b, b + 1, a + 1)
      else indices.push(a, a + 1, b, b, a + 1, b + 1)
    }
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage))
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2).setUsage(THREE.DynamicDrawUsage))
  geometry.setIndex(indices)
  return geometry
}

export class TearRenderer {
  constructor(canvas) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7))
    this.renderer.setClearColor(0x010503)
    this.scene = new THREE.Scene()
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 20)
    this.camera.position.z = 5
    this.width = 0
    this.center = { x: 0.5, y: 0.5 }
    this.rain = document.createElement('canvas')
    this.rain.width = 768
    this.rain.height = 1024
    this.rainCtx = this.rain.getContext('2d', { alpha: false })
    this.rainTexture = new THREE.CanvasTexture(this.rain)
    this.rainTexture.colorSpace = THREE.SRGBColorSpace
    this.rainTexture.minFilter = THREE.LinearFilter
    this.streams = Array.from({ length: 94 }, (_, i) => ({
      x: ((i * 0.61803398875) % 1) * 768,
      y: Math.random() * 1800,
      speed: 40 + Math.random() * 100,
      length: 8 + Math.floor(Math.random() * 20),
      size: 10 + (i % 3) * 5,
      depth: 0.25 + (i % 3) * 0.32,
    }))
    this.back = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.MeshBasicMaterial({ map: this.rainTexture }))
    this.back.position.z = -0.2
    this.scene.add(this.back)
    this.preview = this.makePreview()
    this.previewTexture = new THREE.CanvasTexture(this.preview)
    this.previewTexture.colorSpace = THREE.SRGBColorSpace
    this.material = new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      uniforms: {
        image: { value: this.previewTexture },
        crop: { value: new THREE.Vector2(1, 1) },
        mirror: { value: false },
        opening: { value: 0 },
      },
      vertexShader: `
        varying vec2 vUv; varying vec3 vPosition; varying float vLift;
        void main() {
          vUv = uv;
          vec4 p = modelViewMatrix * vec4(position, 1.0);
          vPosition = p.xyz; vLift = position.z;
          gl_Position = projectionMatrix * p;
        }
      `,
      fragmentShader: `
        uniform sampler2D image; uniform vec2 crop; uniform bool mirror; uniform float opening;
        varying vec2 vUv; varying vec3 vPosition; varying float vLift;
        void main() {
          vec2 uv = (vUv - .5) * crop + .5;
          if (mirror) uv.x = 1. - uv.x;
          vec3 color = texture2D(image, uv).rgb;
          vec3 n = normalize(cross(dFdx(vPosition), dFdy(vPosition)));
          float bend = 1. - abs(n.z);
          float light = .65 + .35 * abs(dot(n, normalize(vec3(-.3, .7, 1.))));
          color *= mix(1., light, smoothstep(0., .02, vLift));
          if (!gl_FrontFacing) color = color * .32 + vec3(.1, .13, .11);
          color += vec3(.15, .65, .25) * bend * min(opening * 4., 1.) * .3;
          color += pow(bend, 5.) * .14;
          gl_FragColor = vec4(color, 1.);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `,
    })
    this.sheets = [-1, 1].map(side => {
      const geometry = makeSheet(side)
      const mesh = new THREE.Mesh(geometry, this.material)
      mesh.frustumCulled = false
      this.scene.add(mesh)
      return { side, geometry }
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
    this.aspect = w / Math.max(1, h)
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

  render(time, delta, targetWidth, center) {
    const smooth = 1 - Math.exp(-delta * 13)
    this.width += (targetWidth - this.width) * smooth
    if (targetWidth === 0 && this.width < .002) this.width = 0
    this.center.x += (center.x - this.center.x) * smooth
    this.center.y += (center.y - this.center.y) * smooth
    const opening = this.width
    this.material.uniforms.opening.value = opening
    if (!this.lastRain || time - this.lastRain > 1 / 30) {
      this.drawRain(time); this.lastRain = time
    }
    const cx = (this.center.x * 2 - 1) * this.aspect
    const cy = 1 - this.center.y * 2
    const height = Math.min(1.8, .3 + opening * 2.5)
    for (const { side, geometry } of this.sheets) {
      const p = geometry.attributes.position.array
      const uv = geometry.attributes.uv.array
      for (let row = 0; row <= ROWS; row++) {
        const y = 1 - row / ROWS * 2
        const dy = (y - cy) / height
        const profile = Math.pow(Math.max(0, 1 - dy * dy), .72)
        const jag = (Math.sin(row * 2.17) * .007 + Math.sin(row * 5.71) * .004) * Math.min(opening * 20, 1)
        const seam = cx + Math.sin(y * 5 + cy) * .032 * profile * Math.min(opening * 10, 1)
        const gap = Math.min(opening * this.aspect * profile, Math.abs(side * this.aspect - seam) * .92)
        const boundary = side * this.aspect
        const span = Math.max(.01, Math.abs(boundary - seam))
        for (let col = 0; col <= COLS; col++) {
          const t = col / COLS
          const i = row * (COLS + 1) + col
          const distance = t * span
          const foldSize = Math.min(.3, opening * .8) * profile
          const influence = Math.exp(-distance / Math.max(.025, foldSize))
          const curl = Math.sin(Math.min(1, distance / Math.max(.01, foldSize)) * Math.PI)
          const displacement = (gap + jag * profile) * Math.pow(1 - t, 2.6)
          p[i * 3] = seam + side * (distance + displacement + curl * foldSize * .45 * influence)
          p[i * 3 + 1] = y + Math.sin(t * 9 + y * 13) * foldSize * .07 * influence
          p[i * 3 + 2] = foldSize * influence * (0.25 + curl * 1.8)
          uv[i * 2] = clamp((seam + side * distance) / (this.aspect * 2) + .5, 0, 1)
          uv[i * 2 + 1] = 1 - row / ROWS
        }
      }
      geometry.attributes.position.needsUpdate = true
      geometry.attributes.uv.needsUpdate = true
    }
    this.renderer.render(this.scene, this.camera)
  }

  dispose() {
    this.sheets.forEach(s => s.geometry.dispose())
    this.material.dispose(); this.videoTexture?.dispose(); this.previewTexture.dispose()
    this.rainTexture.dispose(); this.back.geometry.dispose(); this.back.material.dispose()
    this.renderer.dispose()
  }
}
