// Generates PWA PNG icons from public/logo.svg using sharp.
// Run: node scripts/gen-icons.mjs
import sharp from 'sharp'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const src = readFileSync(resolve(root, 'public/logo.svg'))

const targets = [
  { size: 192, file: 'public/pwa-192x192.png' },
  { size: 512, file: 'public/pwa-512x512.png' },
  { size: 180, file: 'public/apple-touch-icon.png' },
]

for (const { size, file } of targets) {
  await sharp(src, { density: 384 })
    .resize(size, size, { fit: 'contain', background: { r: 11, g: 14, b: 17, alpha: 1 } })
    .png()
    .toFile(resolve(root, file))
  console.log(`✓ ${file} (${size}x${size})`)
}
console.log('Done.')
