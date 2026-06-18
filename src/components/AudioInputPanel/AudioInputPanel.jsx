import {
  Checkbox,
  Dropdown,
  LabelSm,
  LabelUppercaseSm,
  PanelContainer,
  PanelContainerDivider,
  PanelContainerSettingsRow,
  Slider,
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

      <Slider
        value={audioConfig.strength}
        onChange={strength => updateAudioConfig({ strength })}
        min={0}
        max={100}
        step={1}
        label='Strength'
        disabled={!audioConfig.enabled}
      />

      <PanelContainerDivider />

      <FrequencyHeatmapEditor
        frequencyMap={audioConfig.frequencyMap}
        mapSize={HEATMAP_SIZE}
        onUpdate={map => updateAudioConfig({ frequencyMap: map })}
        disabled={!audioConfig.enabled}
      />
    </PanelContainer>
  )
}

function FrequencyHeatmapEditor({ frequencyMap, mapSize, onUpdate, disabled }) {
  const dragRef = React.useRef(null)

  function handlePointerDown(e, index) {
    if (disabled) return
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = { index, startY: e.clientY, startValue: frequencyMap[index] }
  }

  function handlePointerMove(e) {
    if (!dragRef.current || !e.buttons || disabled) return
    const delta = (dragRef.current.startY - e.clientY) / 60
    const newValue = Math.max(0, Math.min(1, dragRef.current.startValue + delta))
    const newMap = [...frequencyMap]
    newMap[dragRef.current.index] = newValue
    onUpdate(newMap)
  }

  function handlePointerUp() {
    dragRef.current = null
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

      <div style={{ '--map-size': mapSize }} className={styles.heatmapGrid}>
        {frequencyMap.map((value, i) => (
          <div
            key={i}
            style={{ backgroundColor: heatmapCellColor(value) }}
            title={`${Math.round(value * 100)}%`}
            onPointerDown={e => handlePointerDown(e, i)}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className={styles.heatmapCell}
          />
        ))}
      </div>

      <div className={styles.heatmapLegend}>
        <LabelSm>Bass</LabelSm>
        <div className={styles.legendBar} />
        <LabelSm>Treble</LabelSm>
      </div>
    </div>
  )
}
