import {
  Checkbox,
  Dropdown,
  Knob,
  LabelSm,
  LabelUppercaseSm,
  PanelContainer,
  PanelContainerDivider,
  PanelContainerSettingsRow,
} from '@6njp/prototype-library'

import {
  HEATMAP_SIZE,
  heatmapCellColor,
  horizontalHeatmap,
  invertedRadialHeatmap,
  radialHeatmap,
  verticalHeatmap,
} from '@/utils/audioHeatmap.js'

import styles from './AudioInputPanel.module.css'

const PRESETS = [
  { label: '●', title: 'Bass center, treble edges', fn: radialHeatmap },
  { label: '○', title: 'Treble center, bass edges', fn: invertedRadialHeatmap },
  { label: '→', title: 'Bass left, treble right', fn: horizontalHeatmap },
  { label: '↓', title: 'Bass top, treble bottom', fn: verticalHeatmap },
]

export function AudioInputPanel({ audioConfig, updateAudioConfig, audioDevices, permissionError }) {
  const deviceOptions = audioDevices.map(d => ({
    value: d.deviceId,
    label: d.label || `Input ${d.deviceId.slice(0, 8)}…`,
  }))

  return (
    <PanelContainer>
      <PanelContainerSettingsRow label='Enabled'>
        <Checkbox
          checked={audioConfig.enabled}
          onChange={enabled => updateAudioConfig({ enabled })}
        />
      </PanelContainerSettingsRow>

      <PanelContainerSettingsRow label='Device'>
        <Dropdown
          value={audioConfig.deviceId}
          onChange={deviceId => updateAudioConfig({ deviceId })}
          options={deviceOptions}
          placeholder='Select input…'
          disabled={!audioConfig.enabled}
        />
      </PanelContainerSettingsRow>

      {permissionError && (
        <div className={styles.errorRow}>
          <LabelSm>{permissionError}</LabelSm>
        </div>
      )}

      <PanelContainerDivider />

      <FrequencyHeatmapEditor
        frequencyMap={audioConfig.frequencyMap}
        mapSize={HEATMAP_SIZE}
        onUpdate={map => updateAudioConfig({ frequencyMap: map })}
        disabled={!audioConfig.enabled}
      />

      <PanelContainerDivider />

      <div className={styles.audioKnobRow}>
        <Knob
          value={Math.round(audioConfig.strength)}
          onChange={v => updateAudioConfig({ strength: v })}
          min={0} max={100}
          label='STRENGTH'
          disabled={!audioConfig.enabled}
        />
        <Knob
          value={Math.round(audioConfig.peakHeight)}
          onChange={v => updateAudioConfig({ peakHeight: v })}
          min={0} max={100}
          label='HEIGHT'
          disabled={!audioConfig.enabled}
        />
        <Knob
          value={Math.round(audioConfig.smooth)}
          onChange={v => updateAudioConfig({ smooth: v })}
          min={0} max={100}
          label='SMOOTH'
          disabled={!audioConfig.enabled}
        />
      </div>
    </PanelContainer>
  )
}

const HOVER_RADIUS = 0.22
// Gradient stops for legend bar (same palette as heatmapCellColor)
const LEGEND_GRADIENT = 'linear-gradient(to right, hsl(240,70%,38%), hsl(190,75%,42%), hsl(120,60%,38%), hsl(45,90%,50%), hsl(5,85%,48%))'

function FrequencyHeatmapEditor({ frequencyMap, mapSize, onUpdate, disabled }) {
  const dragRef = React.useRef(null)
  const gridRef = React.useRef(null)
  const [mousePos, setMousePos] = React.useState(null)
  const [isDragging, setIsDragging] = React.useState(false)

  React.useEffect(() => {
    document.body.style.cursor = isDragging ? 'none' : ''
    return () => { document.body.style.cursor = '' }
  }, [isDragging])

  function getDotPos(i) {
    const col = i % mapSize
    const row = Math.floor(i / mapSize)
    return { nx: col / (mapSize - 1), ny: row / (mapSize - 1) }
  }

  function handlePointerDown(e, index) {
    if (disabled) return
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    const { nx, ny } = getDotPos(index)
    dragRef.current = { accDelta: 0, currentValues: [...frequencyMap], nx, ny }
    setIsDragging(true)
  }

  function handlePointerMove(e) {
    const rect = gridRef.current?.getBoundingClientRect()
    if (rect && !dragRef.current) {
      setMousePos({ x: (e.clientX - rect.left) / rect.width, y: (e.clientY - rect.top) / rect.height })
    }
    if (!dragRef.current || !e.buttons || disabled) return
    dragRef.current.accDelta += e.movementY / 60
    const { accDelta, currentValues, nx: cx, ny: cy } = dragRef.current
    const newMap = currentValues.map((startVal, i) => {
      const { nx, ny } = getDotPos(i)
      const dist = Math.sqrt((nx - cx) ** 2 + (ny - cy) ** 2)
      const weight = Math.max(0, 1 - dist / HOVER_RADIUS)
      return Math.max(0, Math.min(1, startVal + accDelta * weight))
    })
    onUpdate(newMap)
  }

  function handlePointerUp() {
    dragRef.current = null
    setIsDragging(false)
    setMousePos(null)
  }

  return (
    <div data-disabled={disabled || undefined} className={styles.componentFrequencyHeatmapEditor}>
      <div className={styles.heatmapHeader}>
        <LabelUppercaseSm>Frequency Map</LabelUppercaseSm>
        <div className={styles.presetButtons}>
          {PRESETS.map(({ label, fn, title }) => (
            <button
              key={title}
              type='button'
              onClick={() => !disabled && onUpdate(fn(mapSize))}
              className={styles.presetBtn}
              {...{ title }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div
        ref={gridRef}
        style={{ '--map-size': mapSize }}
        onPointerMove={handlePointerMove}
        onMouseLeave={() => setMousePos(null)}
        className={styles.heatmapGrid}
      >
        {frequencyMap.map((value, i) => {
          const col = i % mapSize
          const row = Math.floor(i / mapSize)
          const nx = col / (mapSize - 1)
          const ny = row / (mapSize - 1)
          const baseScale = 0.78 - value * 0.60
          let boost = 0
          if (mousePos) {
            const dx = nx - mousePos.x
            const dy = ny - mousePos.y
            const dist = Math.sqrt(dx * dx + dy * dy)
            boost = Math.max(0, 1 - dist / 0.22) * 0.38
          }

          return (
            <div
              key={i}
              style={{ '--dot-scale': Math.min(1, baseScale + boost), '--dot-color': heatmapCellColor(value) }}
              title={`${Math.round(value * 100)}%`}
              onPointerDown={e => handlePointerDown(e, i)}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              className={styles.heatmapCell}
            >
              <div className={styles.dot} />
            </div>
          )
        })}
      </div>

      <div className={styles.heatmapLegend}>
        <LabelSm>Treble</LabelSm>
        <div style={{ background: LEGEND_GRADIENT }} className={styles.legendBar} />
        <LabelSm>Bass</LabelSm>
      </div>
    </div>
  )
}
