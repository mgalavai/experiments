import fs from 'node:fs'
import path from 'node:path'

const source = '/tmp/ldraw-complete/ldraw'
const destination = 'public/ldraw'
const files = new Map()
const exactFiles = new Map()
const embedded = new Map()
function normalizeReference(value) {
  let reference = value.toLowerCase().replaceAll('\\', '/')
  if (reference.startsWith('s/')) reference = `parts/${reference}`
  else if (reference.startsWith('48/')) reference = `p/${reference}`
  return reference
}
const mpdText = fs.readFileSync('public/42081-1.mpd', 'utf8')
for (const section of mpdText.split(/^0 FILE /m).slice(1)) {
  const lines = section.split(/\r?\n/)
  embedded.set(normalizeReference(lines[0].trim()), section)
}
function index(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) index(full)
    else if (entry.name.toLowerCase().endsWith('.dat') || entry.name.toLowerCase().endsWith('.ldr')) {
      const relative = path.relative(source, full).split(path.sep).join('/').toLowerCase()
      exactFiles.set(relative, full)
      const basename = entry.name.toLowerCase()
      if (!files.has(basename) || relative.startsWith('parts/')) files.set(basename, full)
    }
  }
}
index(source)
fs.mkdirSync(destination, { recursive: true })
fs.copyFileSync(path.join(source, 'LDConfig.ldr'), path.join(destination, 'LDConfig.ldr'))
const queue = ['42081-1.mpd']
const seen = new Set()
const missing = []
while (queue.length) {
  const name = queue.shift().toLowerCase()
  if (seen.has(name)) continue
  seen.add(name)
  const sourcePath = name === '42081-1.mpd'
    ? 'public/42081-1.mpd'
    : exactFiles.get(name) ?? exactFiles.get(`parts/${name}`) ?? exactFiles.get(`p/${name}`) ?? files.get(path.basename(name))
  const text = embedded.get(name) ?? (sourcePath && fs.existsSync(sourcePath) ? fs.readFileSync(sourcePath, 'utf8') : null)
  if (!text) {
    missing.push(name)
    continue
  }
  for (const line of text.split(/\r?\n/)) {
    const tokens = line.trim().split(/\s+/)
    if (tokens[0] === '1' && tokens.length > 14) {
      queue.push(normalizeReference(tokens.slice(14).join(' ')))
    }
  }
  const output = path.join(destination, name)
  fs.mkdirSync(path.dirname(output), { recursive: true })
  if (name === '42081-1.mpd') fs.copyFileSync(sourcePath, output)
  else if (!embedded.has(name)) {
    fs.copyFileSync(sourcePath, output)
    const canonicalOutput = path.join(destination, 'parts', name)
    fs.mkdirSync(path.dirname(canonicalOutput), { recursive: true })
    fs.copyFileSync(sourcePath, canonicalOutput)
  }
}
console.log(`Bundled ${seen.size} LDraw files`)
if (missing.length) {
  console.error(`Missing ${missing.length} files:\n${missing.join('\n')}`)
  process.exitCode = 1
}
