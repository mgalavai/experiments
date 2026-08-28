import fs from 'node:fs'
import path from 'node:path'

const source = '/tmp/ldraw-complete'
const destination = 'public/ldraw'
const files = new Map()
const embedded = new Map()
const mpdText = fs.readFileSync('public/42081-1.mpd', 'utf8')
for (const section of mpdText.split(/^0 FILE /m).slice(1)) {
  const lines = section.split(/\r?\n/)
  embedded.set(lines[0].trim().toLowerCase(), section)
}
function index(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) index(full)
    else if (entry.name.toLowerCase().endsWith('.dat') || entry.name.toLowerCase().endsWith('.ldr')) files.set(entry.name.toLowerCase(), full)
  }
}
index(source)
const queue = ['42081-1.mpd']
const seen = new Set()
while (queue.length) {
  const name = queue.shift().toLowerCase()
  if (seen.has(name)) continue
  seen.add(name)
  const sourcePath = name === '42081-1.mpd' ? 'public/42081-1.mpd' : files.get(name)
  const text = embedded.get(name) ?? (sourcePath && fs.existsSync(sourcePath) ? fs.readFileSync(sourcePath, 'utf8') : null)
  if (!text) continue
  for (const line of text.split(/\r?\n/)) {
    const tokens = line.trim().split(/\s+/)
    if (tokens[0] === '1' && tokens.length > 14) queue.push(tokens.slice(14).join(' ').toLowerCase())
  }
  const output = path.join(destination, name)
  fs.mkdirSync(path.dirname(output), { recursive: true })
  if (name === '42081-1.mpd') fs.copyFileSync(sourcePath, output)
  else if (!embedded.has(name)) {
    fs.copyFileSync(sourcePath, output)
    const primitiveOutput = path.join(destination, 'p', name)
    fs.mkdirSync(path.dirname(primitiveOutput), { recursive: true })
    fs.copyFileSync(sourcePath, primitiveOutput)
  }
}
console.log(`Bundled ${seen.size} LDraw files`)
