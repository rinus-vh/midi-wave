const parseBgColor = (hex, isDark) => {
  const fallback = isDark ? { r: 38, g: 38, b: 38 } : { r: 244, g: 244, b: 244 }
  if (!hex || hex.length < 7) return fallback
  const h = hex.replace('#', '').padEnd(8, 'ff')
  const a = parseInt(h.slice(6, 8), 16)
  if (a === 0) return fallback
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  }
}

const getWireColor = (colorValue, colorConfig, materialSettings, isSolid = false) => {
  if (materialSettings?.preset === 'chrome') return '#e8e8e8'
  if (isSolid) return materialSettings?.color || '#ffffff'
  const hexColor = Math.floor((colorValue / 100) * 0xFFFFFF).toString(16).padStart(6, '0')
  return `#${hexColor}`
}

// Chrome brightness from wave height: peaks reflect studio ceiling (bright), valleys
// reflect floor (dark). Uses a contrast curve to match the high-contrast studio look.
const chromeHeightBrightness = (avgY, waveAmplitude) => {
  if (waveAmplitude === 0) return 0.55
  const t = Math.max(-1, Math.min(1, avgY / waveAmplitude))
  // S-curve contrast: push brights toward white and darks toward black
  const contrasted = Math.sign(t) * Math.pow(Math.abs(t), 0.55)
  return (contrasted + 1) / 2
}

let _smoothedFrequency = null

const createPlanePoints = (time, controls, frequencyData, audioConfig) => {
  const gridSize = Math.floor(5 + (controls.resolution / 150) * 56.25)
  const planeSize = 1000
  const spacing = planeSize / (gridSize - 1)
  const startX = -planeSize / 2
  const startZ = -planeSize / 2
  const waveAmplitude = (controls.scale / 100) * 400
  const waveFrequency = (controls.complexity / 100) * 0.1
  const waveSpeed = (controls.speed / 100) * 2
  const pulseIntensity = controls.pulse / 100

  const audioEnabled = audioConfig?.enabled && frequencyData && frequencyData.length > 0
  const audioStrength = audioEnabled ? (audioConfig.strength ?? 50) / 100 : 0
  const peakHeight = audioEnabled ? (audioConfig.peakHeight ?? 50) / 100 : 0
  const smoothFactor = audioEnabled ? (audioConfig.smooth ?? 30) / 100 : 0
  const frequencyMap = audioConfig?.frequencyMap ?? null
  const mapSize = frequencyMap ? Math.round(Math.sqrt(frequencyMap.length)) : 5
  const audioBase = Math.max(waveAmplitude, 200)

  // Smooth frequency data across frames
  let smoothedData = frequencyData
  if (audioEnabled && smoothFactor > 0) {
    if (!_smoothedFrequency || _smoothedFrequency.length !== frequencyData.length) {
      _smoothedFrequency = new Float32Array(frequencyData)
    }
    for (let i = 0; i < frequencyData.length; i++) {
      _smoothedFrequency[i] = _smoothedFrequency[i] * smoothFactor + frequencyData[i] * (1 - smoothFactor)
    }
    smoothedData = _smoothedFrequency
  } else {
    _smoothedFrequency = null
  }

  const points = []
  for (let z = 0; z < gridSize; z++) {
    for (let x = 0; x < gridSize; x++) {
      const xPos = startX + x * spacing
      const zPos = startZ + z * spacing
      let y = Math.sin(xPos * waveFrequency + zPos * waveFrequency - time * waveSpeed) * waveAmplitude
      y *= 1 + Math.sin(time * pulseIntensity * 10) * 0.5

      if (audioEnabled) {
        const normX = x / (gridSize - 1)
        const normZ = z / (gridSize - 1)
        let freqZone
        if (frequencyMap && frequencyMap.length >= mapSize * mapSize) {
          freqZone = sampleHeatmap(frequencyMap, mapSize, normX, normZ)
        } else {
          const dx = normX * 2 - 1
          const dz = normZ * 2 - 1
          freqZone = Math.min(1, Math.sqrt(dx * dx + dz * dz))
        }
        const binIndex = Math.floor(freqZone * (smoothedData.length - 1))
        const amplitude = smoothedData[binIndex] / 255
        y += amplitude * audioStrength * audioBase * (peakHeight * 2)
      }

      points.push([xPos, y, zPos])
    }
  }
  return { points, gridSize }
}

function sampleHeatmap(heatmap, size, normX, normZ) {
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

const project3DTo2D = (point, width, height, controls) => {
  const fov = 1000
  const zoomFactor = ((controls.zoom + 100) / 200)
  const viewDistance = 500 + (1 - zoomFactor) * 3000

  const [x, y, z] = point

  const xRot = (controls.xRotation / 360) * Math.PI * 2
  const yRot = (controls.rotation / 360) * Math.PI * 2
  const zRot = (controls.zRotation / 360) * Math.PI * 2

  const cosX = Math.cos(xRot), sinX = Math.sin(xRot)
  const rotatedY = y * cosX - z * sinX
  let rotatedZ = z * cosX + y * sinX

  const cosY = Math.cos(yRot), sinY = Math.sin(yRot)
  const rotatedX = x * cosY - rotatedZ * sinY
  rotatedZ = rotatedZ * cosY + x * sinY

  const cosZ = Math.cos(zRot), sinZ = Math.sin(zRot)
  const finalX = rotatedX * cosZ - rotatedY * sinZ
  const finalY = rotatedY * cosZ + rotatedX * sinZ

  const scale = fov / (viewDistance + rotatedZ)
  return [finalX * scale + width / 2, finalY * scale + height / 2, rotatedY]
}

const freqZoneForPoint = (normX, normZ, frequencyMap, mapSize) => {
  if (frequencyMap && frequencyMap.length >= mapSize * mapSize) {
    return sampleHeatmap(frequencyMap, mapSize, normX, normZ)
  }
  const dx = normX * 2 - 1
  const dz = normZ * 2 - 1
  return Math.min(1, Math.sqrt(dx * dx + dz * dz))
}

const FREQ_COLOR_STOPS = [
  [0.00,  60, 70, 62],
  [0.25,  10, 75, 58],
  [0.50, 300, 60, 62],
  [0.75, 225, 90, 50],
  [1.00, 185, 85, 52],
]

const freqToColor = (zone) => {
  const v = Math.max(0, Math.min(1, zone))
  let i = 0
  while (i < FREQ_COLOR_STOPS.length - 2 && FREQ_COLOR_STOPS[i + 1][0] <= v) i++
  const [t0, h0, s0, l0] = FREQ_COLOR_STOPS[i]
  const [t1, h1, s1, l1] = FREQ_COLOR_STOPS[i + 1]
  const t = (v - t0) / (t1 - t0)
  const h = h0 + (h1 - h0) * t
  return `hsl(${Math.round(h)},${Math.round(s0 + (s1 - s0) * t)}%,${Math.round(l0 + (l1 - l0) * t)}%)`
}

export const drawWireframe = (ctx, width, height, controls, colorConfig, isDark = true, materialSettings, lightingSettings, bgColor = null, wireframeSettings = null, frequencyData = null, audioConfig = null) => {
  const roughness = materialSettings?.roughness ?? 0.5
  const metalness = materialSettings?.metalness ?? 0.5
  const isSolid = materialSettings?.solid ?? false
  const isChrome = isSolid && materialSettings?.preset === 'chrome'

  const { r: bgR, g: bgG, b: bgB } = parseBgColor(bgColor, isDark)
  if (isChrome) {
    // Chrome is fully opaque — clear to background each frame
    ctx.fillStyle = `rgb(${bgR}, ${bgG}, ${bgB})`
  } else {
    const trailAlpha = 0.08 + roughness * 0.24
    ctx.fillStyle = `rgba(${bgR}, ${bgG}, ${bgB}, ${trailAlpha})`
  }
  ctx.fillRect(0, 0, width, height)

  const time = Date.now() / 1000
  const waveAmplitude = (controls.scale / 100) * 400
  const { points, gridSize } = createPlanePoints(time, controls, frequencyData, audioConfig)

  const baseColor = getWireColor(controls.color, colorConfig, materialSettings, isSolid)

  const lightEnabled = lightingSettings?.enabled ?? false
  const lightStrength = lightingSettings?.strength ?? 2
  const baseAlpha = lightEnabled ? Math.min(1, 0.3 + (lightStrength / 15) * 0.7) : 1
  const solidOpacity = materialSettings?.opacity ?? 1

  ctx.globalAlpha = (isSolid || isChrome) ? 1 : baseAlpha

  // For solid/chrome with opacity < 1, draw into an offscreen canvas first so
  // overlapping quads don't accumulate alpha unevenly, then composite in one pass.
  const useOffscreen = (isSolid || isChrome) && solidOpacity < 1
  let drawCtx = ctx
  let offscreen = null
  if (useOffscreen) {
    offscreen = document.createElement('canvas')
    offscreen.width = width
    offscreen.height = height
    drawCtx = offscreen.getContext('2d')
    drawCtx.globalAlpha = 1
  }

  if (isChrome) {
    const projected = points.map(p => project3DTo2D(p, width, height, controls))

    for (let z = 0; z < gridSize - 1; z++) {
      for (let x = 0; x < gridSize - 1; x++) {
        const [sx0, sy0] = projected[z * gridSize + x]
        const [sx1, sy1] = projected[z * gridSize + x + 1]
        const [sx2, sy2] = projected[(z + 1) * gridSize + x + 1]
        const [sx3, sy3] = projected[(z + 1) * gridSize + x]

        const b = chromeHeightBrightness(points[z * gridSize + x][1], waveAmplitude)
        const v = Math.round(b * 255)

        drawCtx.beginPath()
        drawCtx.moveTo(sx0, sy0)
        drawCtx.lineTo(sx1, sy1)
        drawCtx.lineTo(sx2, sy2)
        drawCtx.lineTo(sx3, sy3)
        drawCtx.closePath()
        drawCtx.fillStyle = `rgb(${v},${v},${v})`
        drawCtx.fill()
      }
    }
  } else if (isSolid) {
    // Solid: per-quad fills expanded 1.5% from centroid to close seam gaps
    const projected = points.map(p => project3DTo2D(p, width, height, controls))

    const castShadows = lightEnabled && (lightingSettings?.castShadows ?? false)
    const lightColor = lightingSettings?.color ?? '#ffffff'
    const lr = parseInt(lightColor.slice(1, 3), 16)
    const lg = parseInt(lightColor.slice(3, 5), 16)
    const lb = parseInt(lightColor.slice(5, 7), 16)

    // Spotlight position in world space — above and slightly in front
    const lightX = 300, lightY = -600, lightZ = -500
    const lightLen = Math.sqrt(lightX * lightX + lightY * lightY + lightZ * lightZ)
    const lnx = lightX / lightLen, lny = lightY / lightLen, lnz = lightZ / lightLen

    const br = parseInt(baseColor.slice(1, 3), 16)
    const bg2 = parseInt(baseColor.slice(3, 5), 16)
    const bb = parseInt(baseColor.slice(5, 7), 16)

    for (let z = 0; z < gridSize - 1; z++) {
      for (let x = 0; x < gridSize - 1; x++) {
        const [rx0, ry0] = projected[z * gridSize + x]
        const [rx1, ry1] = projected[z * gridSize + x + 1]
        const [rx2, ry2] = projected[(z + 1) * gridSize + x + 1]
        const [rx3, ry3] = projected[(z + 1) * gridSize + x]

        const cx = (rx0 + rx1 + rx2 + rx3) * 0.25
        const cy = (ry0 + ry1 + ry2 + ry3) * 0.25
        const e = 1.015

        let fillStyle = baseColor
        if (castShadows) {
          // Compute face normal in world space from two edges of the quad
          const p0 = points[z * gridSize + x]
          const p1 = points[z * gridSize + x + 1]
          const p3 = points[(z + 1) * gridSize + x]
          const ax = p1[0] - p0[0], ay = p1[1] - p0[1], az = p1[2] - p0[2]
          const bx = p3[0] - p0[0], by = p3[1] - p0[1], bz = p3[2] - p0[2]
          const nx = ay * bz - az * by
          const ny = az * bx - ax * bz
          const nz = ax * by - ay * bx
          const nl = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1
          const dot = Math.max(0, (nx / nl) * lnx + (ny / nl) * lny + (nz / nl) * lnz)
          // ambient 0.15 + diffuse up to 0.85, tinted by light color
          const ambient = 0.15
          const diffuse = dot * 0.85 * (lightStrength / 15)
          const shade = ambient + diffuse
          const r = Math.round(Math.min(255, br * shade * (lr / 255) * 2))
          const g = Math.round(Math.min(255, bg2 * shade * (lg / 255) * 2))
          const b = Math.round(Math.min(255, bb * shade * (lb / 255) * 2))
          fillStyle = `rgb(${r},${g},${b})`
        }

        drawCtx.beginPath()
        drawCtx.moveTo(cx + (rx0 - cx) * e, cy + (ry0 - cy) * e)
        drawCtx.lineTo(cx + (rx1 - cx) * e, cy + (ry1 - cy) * e)
        drawCtx.lineTo(cx + (rx2 - cx) * e, cy + (ry2 - cy) * e)
        drawCtx.lineTo(cx + (rx3 - cx) * e, cy + (ry3 - cy) * e)
        drawCtx.closePath()
        drawCtx.fillStyle = fillStyle
        drawCtx.fill()
      }
    }
  } else {
    const lineWidth = 0.5 + metalness * 1.5
    const glowOn = wireframeSettings?.glow
    const wireStyle = wireframeSettings?.style ?? 'grid'
    const useFreqColors = wireframeSettings?.freqColors ?? false
    const freqMap = audioConfig?.frequencyMap ?? null
    const freqMapSize = freqMap ? Math.round(Math.sqrt(freqMap.length)) : 5

    // Always reset dash state at start of frame to prevent bleed between styles
    ctx.setLineDash([])

    // When glow is enabled, draw onto a separate canvas so we only need one
    // shadowBlur composite pass instead of one per stroke call.
    let lineCtx = ctx
    let glowCanvas = null
    if (glowOn) {
      glowCanvas = document.createElement('canvas')
      glowCanvas.width = width
      glowCanvas.height = height
      lineCtx = glowCanvas.getContext('2d')
    }

    lineCtx.strokeStyle = baseColor
    lineCtx.fillStyle = baseColor
    lineCtx.lineWidth = lineWidth

    // Pre-project all points once when freq colors are on — avoids projecting
    // each point 2× per segment (once as the end of one segment, once as the
    // start of the next). Also needed for the bucket-batching path below.
    const projected = useFreqColors
      ? points.map(p => project3DTo2D(p, width, height, controls))
      : null

    // Batch freq-color segments by quantized color bucket so we issue at most
    // FREQ_BUCKETS stroke/fill calls instead of one per segment/dot.
    // 48 buckets gives a smooth gradient with no perceptible banding.
    const FREQ_BUCKETS = 48

    if (wireStyle === 'dots') {
      const dotR = wireframeSettings?.dotSize ?? 4
      if (useFreqColors) {
        const buckets = Array.from({ length: FREQ_BUCKETS }, () => [])
        for (let z = 0; z < gridSize; z++) {
          for (let x = 0; x < gridSize; x++) {
            const zone = freqZoneForPoint(x / (gridSize - 1), z / (gridSize - 1), freqMap, freqMapSize)
            const b = Math.min(FREQ_BUCKETS - 1, Math.floor(zone * FREQ_BUCKETS))
            buckets[b].push(z * gridSize + x)
          }
        }
        for (let b = 0; b < FREQ_BUCKETS; b++) {
          if (buckets[b].length === 0) continue
          lineCtx.fillStyle = freqToColor((b + 0.5) / FREQ_BUCKETS)
          lineCtx.beginPath()
          for (const idx of buckets[b]) {
            const [sx, sy] = projected[idx]
            lineCtx.moveTo(sx + dotR, sy)
            lineCtx.arc(sx, sy, dotR, 0, Math.PI * 2)
          }
          lineCtx.fill()
        }
      } else {
        lineCtx.beginPath()
        for (let z = 0; z < gridSize; z++) {
          for (let x = 0; x < gridSize; x++) {
            const [sx, sy] = project3DTo2D(points[z * gridSize + x], width, height, controls)
            lineCtx.moveTo(sx + dotR, sy)
            lineCtx.arc(sx, sy, dotR, 0, Math.PI * 2)
          }
        }
        lineCtx.fill()
      }
    } else if (wireStyle === 'dashed') {
      const dash = wireframeSettings?.dashSize ?? 12
      lineCtx.setLineDash([dash, dash * 0.6])

      if (useFreqColors) {
        const buckets = Array.from({ length: FREQ_BUCKETS }, () => [])
        for (let z = 0; z < gridSize; z++) {
          for (let x = 0; x < gridSize - 1; x++) {
            const zone = freqZoneForPoint(x / (gridSize - 1), z / (gridSize - 1), freqMap, freqMapSize)
            const b = Math.min(FREQ_BUCKETS - 1, Math.floor(zone * FREQ_BUCKETS))
            buckets[b].push([z * gridSize + x, z * gridSize + x + 1])
          }
        }
        for (let x = 0; x < gridSize; x++) {
          for (let z = 0; z < gridSize - 1; z++) {
            const zone = freqZoneForPoint(x / (gridSize - 1), z / (gridSize - 1), freqMap, freqMapSize)
            const b = Math.min(FREQ_BUCKETS - 1, Math.floor(zone * FREQ_BUCKETS))
            buckets[b].push([z * gridSize + x, (z + 1) * gridSize + x])
          }
        }
        for (let b = 0; b < FREQ_BUCKETS; b++) {
          if (buckets[b].length === 0) continue
          lineCtx.strokeStyle = freqToColor((b + 0.5) / FREQ_BUCKETS)
          lineCtx.beginPath()
          for (const [i0, i1] of buckets[b]) {
            const [sx0, sy0] = projected[i0]
            const [sx1, sy1] = projected[i1]
            lineCtx.moveTo(sx0, sy0)
            lineCtx.lineTo(sx1, sy1)
          }
          lineCtx.stroke()
        }
      } else {
        for (let z = 0; z < gridSize; z++) {
          lineCtx.beginPath()
          for (let x = 0; x < gridSize; x++) {
            const [sx, sy] = project3DTo2D(points[z * gridSize + x], width, height, controls)
            x === 0 ? lineCtx.moveTo(sx, sy) : lineCtx.lineTo(sx, sy)
          }
          lineCtx.stroke()
        }
        for (let x = 0; x < gridSize; x++) {
          lineCtx.beginPath()
          for (let z = 0; z < gridSize; z++) {
            const [sx, sy] = project3DTo2D(points[z * gridSize + x], width, height, controls)
            z === 0 ? lineCtx.moveTo(sx, sy) : lineCtx.lineTo(sx, sy)
          }
          lineCtx.stroke()
        }
      }

      lineCtx.setLineDash([])
    } else {
      if (useFreqColors) {
        const buckets = Array.from({ length: FREQ_BUCKETS }, () => [])
        for (let z = 0; z < gridSize; z++) {
          for (let x = 0; x < gridSize - 1; x++) {
            const zone = freqZoneForPoint(x / (gridSize - 1), z / (gridSize - 1), freqMap, freqMapSize)
            const b = Math.min(FREQ_BUCKETS - 1, Math.floor(zone * FREQ_BUCKETS))
            buckets[b].push([z * gridSize + x, z * gridSize + x + 1])
          }
        }
        for (let x = 0; x < gridSize; x++) {
          for (let z = 0; z < gridSize - 1; z++) {
            const zone = freqZoneForPoint(x / (gridSize - 1), z / (gridSize - 1), freqMap, freqMapSize)
            const b = Math.min(FREQ_BUCKETS - 1, Math.floor(zone * FREQ_BUCKETS))
            buckets[b].push([z * gridSize + x, (z + 1) * gridSize + x])
          }
        }
        for (let b = 0; b < FREQ_BUCKETS; b++) {
          if (buckets[b].length === 0) continue
          lineCtx.strokeStyle = freqToColor((b + 0.5) / FREQ_BUCKETS)
          lineCtx.beginPath()
          for (const [i0, i1] of buckets[b]) {
            const [sx0, sy0] = projected[i0]
            const [sx1, sy1] = projected[i1]
            lineCtx.moveTo(sx0, sy0)
            lineCtx.lineTo(sx1, sy1)
          }
          lineCtx.stroke()
        }
      } else {
        for (let z = 0; z < gridSize; z++) {
          lineCtx.beginPath()
          for (let x = 0; x < gridSize; x++) {
            const [sx, sy] = project3DTo2D(points[z * gridSize + x], width, height, controls)
            x === 0 ? lineCtx.moveTo(sx, sy) : lineCtx.lineTo(sx, sy)
          }
          lineCtx.stroke()
        }
        for (let x = 0; x < gridSize; x++) {
          lineCtx.beginPath()
          for (let z = 0; z < gridSize; z++) {
            const [sx, sy] = project3DTo2D(points[z * gridSize + x], width, height, controls)
            z === 0 ? lineCtx.moveTo(sx, sy) : lineCtx.lineTo(sx, sy)
          }
          lineCtx.stroke()
        }
      }
    }

    if (glowOn && glowCanvas) {
      ctx.shadowColor = wireframeSettings.glowColor || '#ffffff'
      ctx.shadowBlur = wireframeSettings.glowIntensity * 3
      ctx.drawImage(glowCanvas, 0, 0)
      ctx.shadowBlur = 0
    }
  }

  if (useOffscreen) {
    ctx.globalAlpha = solidOpacity
    ctx.drawImage(offscreen, 0, 0)
  }

  ctx.globalAlpha = 1
}
