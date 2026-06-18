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
  if (colorConfig.useMidi) return colorConfig.colors[0] || '#ffffff'
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

const createPlanePoints = (time, controls, frequencyData, audioConfig) => {
  const gridSize = Math.floor(5 + (controls.resolution / 100) * 37.5)
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
  const frequencyMap = audioConfig?.frequencyMap ?? null
  const mapSize = audioConfig?.mapSize ?? 5
  const audioBase = Math.max(waveAmplitude, 200)

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
          // Default: radial — low frequency at center, high at edges
          const dx = normX * 2 - 1
          const dz = normZ * 2 - 1
          freqZone = Math.min(1, Math.sqrt(dx * dx + dz * dz))
        }
        const binIndex = Math.floor(freqZone * (frequencyData.length - 1))
        const amplitude = frequencyData[binIndex] / 255
        y += amplitude * audioStrength * audioBase
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

  const xRot = (controls.xRotation / 100) * Math.PI * 2
  const yRot = (controls.rotation / 100) * Math.PI * 2
  const zRot = (controls.zRotation / 100) * Math.PI * 2

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
    // Metalness thickens the line
    const lineWidth = 0.5 + metalness * 1.5

    if (wireframeSettings?.glow) {
      ctx.shadowColor = wireframeSettings.glowColor || '#ffffff'
      ctx.shadowBlur = wireframeSettings.glowIntensity * 3
    }

    ctx.strokeStyle = baseColor
    ctx.lineWidth = lineWidth

    for (let z = 0; z < gridSize; z++) {
      ctx.beginPath()
      for (let x = 0; x < gridSize; x++) {
        const [sx, sy] = project3DTo2D(points[z * gridSize + x], width, height, controls)
        x === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy)
      }
      ctx.stroke()
    }

    for (let x = 0; x < gridSize; x++) {
      ctx.beginPath()
      for (let z = 0; z < gridSize; z++) {
        const [sx, sy] = project3DTo2D(points[z * gridSize + x], width, height, controls)
        z === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy)
      }
      ctx.stroke()
    }
  }

  if (useOffscreen) {
    ctx.globalAlpha = solidOpacity
    ctx.drawImage(offscreen, 0, 0)
  }

  ctx.globalAlpha = 1
  ctx.shadowBlur = 0
}
