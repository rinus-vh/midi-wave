import { MidiTimeline } from '@/components/MidiTimeline/MidiTimeline.jsx'
import { drawWireframe } from '@/utils/visualRenderer.js'

import styles from './VisualCanvas.module.css'

export function VisualCanvas({ controls, colorConfig, updateControl, isDark, midiNotes, showTimeline, invertColors }) {
  const canvasRef = React.useRef(null)
  const animationRef = React.useRef(null)
  const isDraggingRef = React.useRef(false)
  const lastMousePosRef = React.useRef({ x: 0, y: 0 })
  const controlsRef = React.useRef(controls)
  const isDarkRef = React.useRef(isDark)

  React.useEffect(() => { controlsRef.current = controls }, [controls])
  React.useEffect(() => { isDarkRef.current = isDark }, [isDark])

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
      drawWireframe(ctx, canvas.width, canvas.height, controlsRef.current, colorConfig, isDarkRef.current)
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

  return (
    <div className={styles.component_root}>
      <canvas ref={canvasRef} className={cx(styles.canvas, invertColors && styles.inverted)} />
      {showTimeline && <MidiTimeline midiNotes={midiNotes} layoutClassName={styles.timelineLayout} />}
    </div>
  )
}
