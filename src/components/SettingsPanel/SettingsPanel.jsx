import { AlertCircle, Settings, Zap } from 'lucide-react'
import {
  ActionIconButton,
  Checkbox,
  ColorInput,
  Dropdown,
  Icon,
  KnobWithOffset,
  LabelSm,
  LabelUppercaseSm,
  PanelContainer,
  PanelContainerDivider,
  PanelContainerSettingsRow,
  PanelContainerSettingsSectionHeader,
  Tooltip,
} from '@6njp/prototype-library'

import {
  COLOR_CONFIG_DEFAULTS,
  LIGHTING_DEFAULTS,
  MATERIAL_DEFAULTS,
  PARAM_DEFAULTS,
  SCENE_DEFAULTS,
} from '@/constants/defaults.js'

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

function Section({ title, children, dirty = false, onReset }) {
  return (
    <div className={styles.componentSection}>
      <PanelContainerSettingsSectionHeader isDirty={dirty} {...{ title, onReset }} />
      <div className={styles.sectionBody}>{children}</div>
    </div>
  )
}

export function SettingsPanel({
  controls,
  updateControl,
  onReset,
  midiConfig,
  updateMidiConfig,
  colorConfig,
  midiStatus,
  midiInputs,
  selectedInput,
  onSelectedInputChange,
  showMidiHistory,
  onShowMidiHistoryChange,
  invertColors,
  onInvertColorsChange,
  bgColor,
  onBgColorChange,
  materialSettings,
  lightingSettings,
  onOpenWireframe,
  onOpenMaterial,
  onOpenLighting,
}) {
  const knobCellsRef = React.useRef({})
  const tooltipHasBeenShownRef = React.useRef(false)
  const [tooltipOpen, setTooltipOpen] = React.useState(false)
  const [tooltipAnchor, setTooltipAnchor] = React.useState(null)

  const deviceOptions = midiInputs.map(input => ({ value: input.id, label: input.name }))

  // ── Dirty detection ──────────────────────────────────────────────────────────
  const isParamsDirty = PARAM_CONTROLS.some(({ key }) => controls[key] !== PARAM_DEFAULTS[key])

  const isVisualDirty = (
    colorConfig.useMidi !== COLOR_CONFIG_DEFAULTS.useMidi ||
    materialSettings.preset !== MATERIAL_DEFAULTS.preset ||
    materialSettings.solid !== MATERIAL_DEFAULTS.solid ||
    materialSettings.color !== MATERIAL_DEFAULTS.color ||
    materialSettings.roughness !== MATERIAL_DEFAULTS.roughness ||
    materialSettings.metalness !== MATERIAL_DEFAULTS.metalness ||
    lightingSettings.enabled !== LIGHTING_DEFAULTS.enabled ||
    lightingSettings.color !== LIGHTING_DEFAULTS.color ||
    lightingSettings.strength !== LIGHTING_DEFAULTS.strength
  )

  const isSceneDirty = (
    bgColor !== SCENE_DEFAULTS.bgColor ||
    showMidiHistory !== SCENE_DEFAULTS.showTimeline ||
    invertColors !== SCENE_DEFAULTS.invertColors
  )

  // ── Reset handlers ───────────────────────────────────────────────────────────
  const handleResetParams = () => {
    PARAM_CONTROLS.forEach(({ key }) => updateControl(key, PARAM_DEFAULTS[key]))
  }

  const handleResetScene = () => {
    onBgColorChange(SCENE_DEFAULTS.bgColor)
    onShowMidiHistoryChange(SCENE_DEFAULTS.showTimeline)
    onInvertColorsChange(SCENE_DEFAULTS.invertColors)
  }

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
      {/* ── MIDI Device ────────────────────────────────────────────────────────── */}
      <div className={styles.deviceSection}>
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
          <Dropdown
            value={selectedInput?.id ?? null}
            onChange={id => onSelectedInputChange(midiInputs.find(i => i.id === id) ?? null)}
            options={deviceOptions}
            placeholder='Select device…'
          />
        )}
      </div>

      <PanelContainer>
        <PanelContainerSettingsRow label='MIDI notes history'>
          <Checkbox checked={showMidiHistory} onChange={onShowMidiHistoryChange} />
        </PanelContainerSettingsRow>
      </PanelContainer>

      <PanelContainerDivider />

      {/* ── Parameters ─────────────────────────────────────────────────────────── */}
      <Section title='Parameters' dirty={isParamsDirty} onReset={handleResetParams}>
        <div className={styles.knobGrid}>
          {PARAM_CONTROLS.map(({ key, label }) => {
            const cfg = midiConfig[key]

            return (
              <div
                key={key}
                ref={el => { knobCellsRef.current[key] = el }}
                className={styles.knobCell}
              >
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
      </Section>

      <PanelContainerDivider />

      {/* ── Visual ──────────────────────────────────────────────────────────────── */}
      <Section title='Visual' dirty={isVisualDirty} {...{ onReset }}>
        <PanelContainer>
          <PanelContainerSettingsRow label='Wireframe'>
            <ActionIconButton
              icon={Settings}
              size={20}
              style='outline'
              onClick={onOpenWireframe}
              title='Wireframe settings'
            />
          </PanelContainerSettingsRow>

          <PanelContainerSettingsRow label='Material'>
            <ActionIconButton
              icon={Settings}
              size={20}
              style='outline'
              onClick={onOpenMaterial}
              title='Material settings'
            />
          </PanelContainerSettingsRow>

          <PanelContainerSettingsRow label='Lighting'>
            <ActionIconButton
              icon={Settings}
              size={20}
              style='outline'
              onClick={onOpenLighting}
              title='Lighting settings'
            />
          </PanelContainerSettingsRow>
        </PanelContainer>
      </Section>

      <PanelContainerDivider />

      {/* ── Scene ───────────────────────────────────────────────────────────────── */}
      <Section title='Scene' dirty={isSceneDirty} onReset={handleResetScene}>
        <PanelContainer>
          <PanelContainerSettingsRow label='Background'>
            <ColorInput
              adjustOpacity
              value={bgColor}
              onChange={onBgColorChange}
              layoutClassName={styles.colorInputLayout}
            />
          </PanelContainerSettingsRow>

          <PanelContainerSettingsRow label='Invert colors'>
            <Checkbox checked={invertColors} onChange={onInvertColorsChange} />
          </PanelContainerSettingsRow>
        </PanelContainer>
      </Section>

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
