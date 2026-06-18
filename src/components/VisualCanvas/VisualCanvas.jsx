import { drawWireframe } from '@/utils/visualRenderer.js'

import styles from './VisualCanvas.module.css'

const hexToRgba = (hex) => {
  if (!hex || hex.length < 7) return null
  const h = hex.replace('#', '').padEnd(8, 'ff')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  const a = (parseInt(h.slice(6, 8), 16) / 255).toFixed(3)
  return `rgba(${r},${g},${b},${a})`
}

export function VisualCanvas({ controls, colorConfig, updateControl, isDark, invertColors, bgColor, materialSettings, lightingSettings, wireframeSettings, getFrequencyData, audioConfig }) {
  const canvasRef = React.useRef(null)
  const animationRef = React.useRef(null)
  const isDraggingRef = React.useRef(false)
  const lastMousePosRef = React.useRef({ x: 0, y: 0 })
  const controlsRef = React.useRef(controls)
  const isDarkRef = React.useRef(isDark)
  const materialRef = React.useRef(materialSettings)
  const lightingRef = React.useRef(lightingSettings)
  const wireframeRef = React.useRef(wireframeSettings)
  const bgColorRef = React.useRef(bgColor)
  const getFrequencyDataRef = React.useRef(getFrequencyData)
  const audioConfigRef = React.useRef(audioConfig)

  React.useEffect(() => { controlsRef.current = controls }, [controls])
  React.useEffect(() => { isDarkRef.current = isDark }, [isDark])
  React.useEffect(() => { materialRef.current = materialSettings }, [materialSettings])
  React.useEffect(() => { lightingRef.current = lightingSettings }, [lightingSettings])
  React.useEffect(() => { wireframeRef.current = wireframeSettings }, [wireframeSettings])
  React.useEffect(() => { bgColorRef.current = bgColor }, [bgColor])
  React.useEffect(() => { getFrequencyDataRef.current = getFrequencyData }, [getFrequencyData])
  React.useEffect(() => { audioConfigRef.current = audioConfig }, [audioConfig])

  React.useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      const container = canvas.parentElement
      if (!container) return
      canvas.width = container.clientWidth
      canvas.height = container.clientHeight
    }

    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas.parentElement)

    const animate = () => {
      const freqData = getFrequencyDataRef.current?.()
      drawWireframe(ctx, canvas.width, canvas.height, controlsRef.current, colorConfig, isDarkRef.current, materialRef.current, lightingRef.current, bgColorRef.current, wireframeRef.current, freqData, audioConfigRef.current)
      animationRef.current = requestAnimationFrame(animate)
    }
    animationRef.current = requestAnimationFrame(animate)

    const onMouseDown = (e) => {
      isDraggingRef.current = true
      lastMousePosRef.current = { x: e.clientX, y: e.clientY }
    }

    const onMouseMove = (e) => {
      if (!isDraggingRef.current) return
      const dx = e.clientX - lastMousePosRef.current.x
      const dy = e.clientY - lastMousePosRef.current.y
      const c = controlsRef.current
      updateControl('xRotation', Math.max(0, Math.min(100, c.xRotation + dy * 0.5)))
      updateControl('rotation', Math.max(0, Math.min(100, c.rotation + dx * 0.5)))
      lastMousePosRef.current = { x: e.clientX, y: e.clientY }
    }

    const onMouseUp = () => { isDraggingRef.current = false }

    const onWheel = (e) => {
      e.preventDefault()
      const c = controlsRef.current
      updateControl('zoom', Math.max(0, Math.min(100, c.zoom + e.deltaY * 0.1)))
    }

    canvas.addEventListener('mousedown', onMouseDown)
    canvas.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    canvas.addEventListener('wheel', onWheel, { passive: false })

    return () => {
      cancelAnimationFrame(animationRef.current)
      ro.disconnect()
      canvas.removeEventListener('mousedown', onMouseDown)
      canvas.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      canvas.removeEventListener('wheel', onWheel)
    }
  }, [colorConfig, updateControl])

  const invertFilter = invertColors ? 'invert(1)' : undefined

  return (
    <div className={styles.component_root}>
      <canvas
        ref={canvasRef}
        style={{
          ...(bgColor ? { backgroundColor: hexToRgba(bgColor) } : {}),
          ...(invertFilter ? { filter: invertFilter } : {}),
        }}
        className={styles.canvas}
      />
    </div>
  )
}
