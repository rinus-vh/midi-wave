export const HEATMAP_SIZE = 5

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

// value 0 = bass (blue), 1 = treble (red)
export function heatmapCellColor(value) {
  const hue = Math.round((1 - value) * 240)
  return `hsl(${hue}, 80%, 45%)`
}
