import fs from 'node:fs'
import * as THREE from 'three'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'
import { LDrawLoader } from 'three/examples/jsm/loaders/LDrawLoader.js'
import { LDrawConditionalLineMaterial } from 'three/examples/jsm/materials/LDrawConditionalLineMaterial.js'

globalThis.ProgressEvent ??= class ProgressEvent {
  constructor(type, init = {}) { this.type = type; Object.assign(this, init) }
}
globalThis.FileReader ??= class FileReader {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((result) => { this.result = result; this.onloadend?.() })
  }
  readAsDataURL(blob) {
    blob.arrayBuffer().then((result) => {
      this.result = `data:${blob.type};base64,${Buffer.from(result).toString('base64')}`
      this.onloadend?.()
    })
  }
}

const baseUrl = 'http://127.0.0.1:5173/'
const loader = new LDrawLoader()
loader.setConditionalLineMaterial(LDrawConditionalLineMaterial)
loader.setPath(baseUrl)
loader.setPartsLibraryPath(`${baseUrl}ldraw/`)
await loader.preloadMaterials('ldraw/LDConfig.ldr')
const source = await loader.loadAsync('ldraw/42081-1.mpd')
source.rotation.x = Math.PI
source.updateMatrixWorld(true)

let meshCount = 0
const discarded = []
source.traverse((child) => {
  if (child.isLine || child.isLineSegments || child.isConditionalLine) discarded.push(child)
  if (child.isMesh) {
    meshCount += 1
    child.name ||= `element-${meshCount}`
  }
})
discarded.forEach((child) => child.removeFromParent())

const model = new THREE.Group()
model.name = '42081-1'
model.add(source)

const box = new THREE.Box3().setFromObject(model)
const center = box.getCenter(new THREE.Vector3())
const size = box.getSize(new THREE.Vector3())
const scale = 4.4 / Math.max(size.x, size.y, size.z)
model.scale.setScalar(scale)
model.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale)
model.updateMatrixWorld(true)

const exporter = new GLTFExporter()
const glb = await exporter.parseAsync(model, { binary: true, onlyVisible: true })
fs.writeFileSync('/private/tmp/42081-1-raw.glb', Buffer.from(glb))
console.log(`Exported ${meshCount} selectable meshes, ${Math.round(glb.byteLength / 1024)} KB`)
