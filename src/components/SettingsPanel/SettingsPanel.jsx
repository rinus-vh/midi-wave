import { AlertCircle, Minus, Plus, Zap } from 'lucide-react'
import {
  Button,
  Checkbox,
  Dropdown,
  Icon,
  KnobWithOffset,
  LabelSm,
  LabelUppercaseSm,
  Tooltip,
} from '@6njp/prototype-library'

import styles from './SettingsPanel.module.css'

const PARAM_CONTROLS = [
  { key: 'rotation',   label: 'Y ROT' },
  { key: 'xRotation',  label: 'X ROT' },
  { key: 'zRotation',  label: 'Z ROT' },
  { key: 'scale',      label: 'HEIGHT' },
  { key: 'speed',      label: 'SPEED' },
  { key: 'complexity', label: 'FREQ' },
  { key: 'pulse',      label: 'PULSE' },
  { key: 'resolution', label: 'RES' },
  { key: 'zoom',       label: 'ZOOM' },
]

export function SettingsPanel({
  controls,
  updateControl,
  onReset,
  midiConfig,
  updateMidiConfig,
  colorConfig,
  updateColorConfig,
  addColor,
  removeColor,
  midiStatus,
  midiInputs,
  selectedInput,
  onSelectedInputChange,
  showTimeline,
  onShowTimelineChange,
  invertColors,
  onInvertColorsChange,
  onColorChange,
}) {
  const deviceOptions = midiInputs.map(input => ({ value: input.id, label: input.name }))
  const colorValueHex = `#${Math.floor((controls.color / 100) * 0xFFFFFF).toString(16).padStart(6, '0')}`

  const knobCellsRef = React.useRef({})
  const tooltipHasBeenShownRef = React.useRef(false)
  const [tooltipOpen, setTooltipOpen] = React.useState(false)
  const [tooltipAnchor, setTooltipAnchor] = React.useState(null)

  const handleMidiEnable = (key, enabled) => {
    updateMidiConfig(key, enabled)
    if (enabled && !tooltipHasBeenShownRef.current) {
      tooltipHasBeenShownRef.current = true
      setTooltipAnchor(knobCellsRef.current[key] ?? null)
      setTooltipOpen(true)
    }
  }

  return (
    <div className={cx(styles.component, styles.component_root)}>
      <section className={styles.deviceSection}>
        <LabelUppercaseSm>MIDI Status</LabelUppercaseSm>

        <div className={cx(styles.midiStatusRow, midiStatus === 'available' && styles.midiStatusActive)}>
          <Icon
            icon={midiStatus === 'available' ? Zap : AlertCircle}
            layoutClassName={styles.statusIconLayout}
          />
          <LabelSm>{midiStatus === 'available' ? 'MIDI Connected' : 'MIDI Unavailable'}</LabelSm>
        </div>

        {midiStatus === 'unavailable' && (
          <div className={styles.midiAlert}>
            <LabelSm>No MIDI Access</LabelSm>
            <LabelSm>Use manual controls below or connect a MIDI device.</LabelSm>
          </div>
        )}

        {midiStatus === 'available' && (
          <div className={styles.section}>
            <LabelSm>Select midi input:</LabelSm>
            <Dropdown
              value={selectedInput?.id ?? null}
              onChange={id => onSelectedInputChange(midiInputs.find(i => i.id === id) ?? null)}
              options={deviceOptions}
              placeholder='Select device…'
            />
          </div>
        )}
      </section>

      <section className={styles.section}>
        <LabelUppercaseSm>Parameters</LabelUppercaseSm>
        <div className={styles.knobGrid}>
          {PARAM_CONTROLS.map(({ key, label }) => {
            const cfg = midiConfig[key]

            return (
              <div key={key} ref={el => { knobCellsRef.current[key] = el }} className={styles.knobCell}>
                <KnobWithOffset
                  value={Math.round(controls[key])}
                  onChange={v => updateControl(key, v)}
                  offset={cfg.offset}
                  onOffsetChange={newOffset => updateMidiConfig(key, cfg.enabled, cfg.note, newOffset, cfg.offsetCenter)}
                  offsetCenter={cfg.offsetCenter}
                  onOffsetCenterChange={newCenter => updateMidiConfig(key, cfg.enabled, cfg.note, cfg.offset, newCenter)}
                  min={0}
                  max={100}
                  {...{ label }}
                />
                <div className={styles.midiRow}>
                  <Checkbox
                    checked={cfg?.enabled ?? false}
                    onChange={enabled => handleMidiEnable(key, enabled)}
                  />
                  {cfg?.enabled && (
                    <input
                      type='number'
                      min={0}
                      max={127}
                      value={cfg.note}
                      onChange={e => updateMidiConfig(key, true, parseInt(e.target.value, 10), cfg.offset)}
                      className={styles.noteInput}
                    />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section className={styles.section}>
        <LabelUppercaseSm>Color</LabelUppercaseSm>
        <div className={styles.colorSwatches}>
          {colorConfig.useMidi
            ? colorConfig.colors.map((color, i) => (
              <div key={i} className={styles.colorSwatch}>
                <input
                  type='color'
                  value={color}
                  onChange={e => {
                    const updated = [...colorConfig.colors]
                    updated[i] = e.target.value
                    updateColorConfig({ colors: updated })
                  }}
                  className={styles.colorPicker}
                />
                {colorConfig.colors.length > 1 && (
                  <button onClick={() => removeColor(i)} className={styles.removeColorBtn}>
                    <Icon icon={Minus} layoutClassName={styles.removeIconLayout} />
                  </button>
                )}
              </div>
            ))
            : (
              <div className={styles.colorSwatch}>
                <input
                  type='color'
                  value={colorValueHex}
                  onChange={e => onColorChange(e.target.value)}
                  className={styles.colorPicker}
                />
              </div>
            )
          }
          {colorConfig.useMidi && (
            <button onClick={addColor} className={styles.addColorBtn}>
              <Icon icon={Plus} layoutClassName={styles.addIconLayout} />
            </button>
          )}
        </div>
        <div className={styles.midiColorRow}>
          <Checkbox
            checked={colorConfig.useMidi}
            onChange={v => updateColorConfig({ useMidi: v })}
            label='MIDI cycle'
          />
          {colorConfig.useMidi && (
            <input
              type='number'
              min={0}
              max={127}
              value={colorConfig.midiNote}
              onChange={e => updateColorConfig({ midiNote: parseInt(e.target.value, 10) })}
              className={styles.noteInput}
            />
          )}
        </div>
      </section>

      <section className={styles.section}>
        <LabelUppercaseSm>Display</LabelUppercaseSm>
        <Checkbox
          checked={showTimeline}
          onChange={onShowTimelineChange}
          label='Show MIDI timeline'
        />
        <Checkbox
          checked={invertColors}
          onChange={onInvertColorsChange}
          label='Invert colors'
        />
      </section>

      <Button label='Reset all' variant='outline' onClick={onReset} layoutClassName={styles.resetLayout} />

      <Tooltip
        anchor={tooltipAnchor}
        open={tooltipOpen}
        onClose={() => setTooltipOpen(false)}
      >
        Hold ⌘ Cmd (or Ctrl on Windows) and drag a knob to set its MIDI offset range.
      </Tooltip>
    </div>
  )
}
