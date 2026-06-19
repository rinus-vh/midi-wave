export const HEATMAP_SIZE = 10

export function radialHeatmap(size = HEATMAP_SIZE) {
  const map = []
  const c = (size - 1) / 2
  for (let r = 0; r < size; r++) {
    for (let col = 0; col < size; col++) {
      const dx = (col - c) / c
      const dy = (r - c) / c
      map.push(Math.min(1, Math.sqrt(dx * dx + dy * dy)))
    }
  }
  return map
}

export function invertedRadialHeatmap(size = HEATMAP_SIZE) {
  return radialHeatmap(size).map(v => 1 - v)
}

export function horizontalHeatmap(size = HEATMAP_SIZE) {
  const map = []
  for (let r = 0; r < size; r++) {
    for (let col = 0; col < size; col++) map.push(col / (size - 1))
  }
  return map
}

export function verticalHeatmap(size = HEATMAP_SIZE) {
  const map = []
  for (let r = 0; r < size; r++) {
    for (let col = 0; col < size; col++) map.push(r / (size - 1))
  }
  return map
}

// Bilinear sample of a flat row-major heatmap array
export function sampleHeatmap(heatmap, size, normX, normZ) {
  const x = normX * (size - 1)
  const z = normZ * (size - 1)
  const x0 = Math.floor(x)
  const x1 = Math.min(size - 1, x0 + 1)
  const z0 = Math.floor(z)
  const z1 = Math.min(size - 1, z0 + 1)
  const fx = x - x0
  const fz = z - z0
  const v00 = heatmap[z0 * size + x0] ?? 0
  const v10 = heatmap[z0 * size + x1] ?? 0
  const v01 = heatmap[z1 * size + x0] ?? 0
  const v11 = heatmap[z1 * size + x1] ?? 0
  return v00 * (1 - fx) * (1 - fz) + v10 * fx * (1 - fz) + v01 * (1 - fx) * fz + v11 * fx * fz
}

function lerpHue(h0, h1, t) {
  const d = ((h1 - h0 + 540) % 360) - 180
  return (h0 + d * t + 360) % 360
}

// value 0=bass, 1=treble — inverted thermal palette (yellow→pink→teal)
const COLOR_STOPS = [
  [0.00,  60, 70, 62],
  [0.25,  10, 75, 58],
  [0.50, 300, 60, 62],
  [0.75, 225, 90, 50],
  [1.00, 185, 85, 52],
]

export function heatmapCellColor(value) {
  const v = Math.max(0, Math.min(1, value))
  let i = 0
  while (i < COLOR_STOPS.length - 2 && COLOR_STOPS[i + 1][0] <= v) i++
  const [t0, h0, s0, l0] = COLOR_STOPS[i]
  const [t1, h1, s1, l1] = COLOR_STOPS[i + 1]
  const t = (v - t0) / (t1 - t0)
  return `hsl(${Math.round(lerpHue(h0, h1, t))}, ${Math.round(s0 + (s1 - s0) * t)}%, ${Math.round(l0 + (l1 - l0) * t)}%)`
}
