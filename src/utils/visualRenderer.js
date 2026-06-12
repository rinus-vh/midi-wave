const getColor = (colorValue, colorConfig) => {
  if (colorConfig.useMidi) return colorConfig.colors[0] || '#ffffff'
  const hexColor = Math.floor((colorValue / 100) * 0xFFFFFF).toString(16).padStart(6, '0')
  return `#${hexColor}`
}

const createPlanePoints = (time, controls) => {
  const gridSize = Math.floor(5 + (controls.resolution / 100) * 30)
  const planeSize = 1000
  const spacing = planeSize / (gridSize - 1)
  const startX = -planeSize / 2
  const startZ = -planeSize / 2
  const waveAmplitude = (controls.scale / 100) * 400
  const waveFrequency = (controls.complexity / 100) * 0.1
  const waveSpeed = (controls.speed / 100) * 2
  const pulseIntensity = controls.pulse / 100

  const points = []
  for (let z = 0; z < gridSize; z++) {
    for (let x = 0; x < gridSize; x++) {
      const xPos = startX + x * spacing
      const zPos = startZ + z * spacing
      let y = Math.sin((xPos * waveFrequency + time * waveSpeed) + zPos * waveFrequency) * waveAmplitude
      y *= 1 + Math.sin(time * pulseIntensity * 10) * 0.5
      points.push([xPos, y, zPos])
    }
  }
  return { points, gridSize }
}

const project3DTo2D = (point, width, height, controls) => {
  const fov = 1000
  const zoomFactor = ((controls.zoom + 100) / 200)
  const viewDistance = 500 + (1 - zoomFactor) * 1500

  let [x, y, z] = point

  const xRot = (controls.xRotation / 100) * Math.PI * 2
  const yRot = (controls.rotation / 100) * Math.PI * 2
  const zRot = (controls.zRotation / 100) * Math.PI * 2

  const cosX = Math.cos(xRot), sinX = Math.sin(xRot)
  let rotatedY = y * cosX - z * sinX
  let rotatedZ = z * cosX + y * sinX

  const cosY = Math.cos(yRot), sinY = Math.sin(yRot)
  let rotatedX = x * cosY - rotatedZ * sinY
  rotatedZ = rotatedZ * cosY + x * sinY

  const cosZ = Math.cos(zRot), sinZ = Math.sin(zRot)
  const finalX = rotatedX * cosZ - rotatedY * sinZ
  const finalY = rotatedY * cosZ + rotatedX * sinZ

  const scale = fov / (viewDistance + rotatedZ)
  return [finalX * scale + width / 2, finalY * scale + height / 2]
}

export const drawWireframe = (ctx, width, height, controls, colorConfig, isDark = true) => {
  ctx.fillStyle = isDark ? 'rgba(38, 38, 38, 0.2)' : 'rgba(244, 244, 244, 0.2)'
  ctx.fillRect(0, 0, width, height)

  const time = Date.now() / 1000
  const { points, gridSize } = createPlanePoints(time, controls)

  ctx.strokeStyle = getColor(controls.color, colorConfig)
  ctx.lineWidth = 1

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
