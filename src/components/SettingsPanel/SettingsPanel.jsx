import { AlertCircle, Music, Settings, Trash2, Usb, Zap } from 'lucide-react'
import {
  ActionIconButton,
  Checkbox,
  ColorInput,
  ContextMenu,
  Dropdown,
  GhostButton,
  Icon,
  KnobWithOffset,
  LabelSm,
  LabelUppercaseSm,
  Modal,
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
  PARAM_CONTROLS,
  PARAM_DEFAULTS,
  SCENE_DEFAULTS,
} from '@/constants/defaults.js'
import { useMidiDrag } from '@/hooks/useMidiDrag.js'

import styles from './SettingsPanel.module.css'

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
  invertColors,
  onInvertColorsChange,
  bgColor,
  defaultBgColor,
  defaultMeshColor,
  onBgColorChange,
  materialSettings,
  lightingSettings,
  midiAssignments,
  onOpenWireframe,
  onOpenMaterial,
  onOpenLighting,
  onOpenMidiNotes,
  onOpenAudioInput,
  onAddMidiAssignment,
  onClearMidiAssignments,
  bgColorCycleConfig,
  updateBgColorCycleConfig,
  requestMidiAccess,
  midiErrorMessage,
  booleanAssignments = {},
  onAddBooleanAssignment,
}) {
  const { getDraggedNote } = useMidiDrag()
  const [midiErrorModalOpen, setMidiErrorModalOpen] = React.useState(false)
  const midiErrorMessageRef = React.useRef(midiErrorMessage)
  React.useEffect(() => {
    if (midiErrorMessage && midiErrorMessage !== midiErrorMessageRef.current) {
      midiErrorMessageRef.current = midiErrorMessage
      setTimeout(() => setMidiErrorModalOpen(true), 0)
    } else {
      midiErrorMessageRef.current = midiErrorMessage
    }
  }, [midiErrorMessage])
  const [bgColorPickerOpen, setBgColorPickerOpen] = React.useState(false)
  const [bgColorDragOver, setBgColorDragOver] = React.useState(false)
  const [invertColorsDragOver, setInvertColorsDragOver] = React.useState(false)
  const knobCellsRef = React.useRef({})
  const tooltipHasBeenShownRef = React.useRef(false)
  const [tooltipOpen, setTooltipOpen] = React.useState(false)
  const [tooltipAnchor, setTooltipAnchor] = React.useState(null)
  const [dragOverKey, setDragOverKey] = React.useState(null)
  const [contextMenu, setContextMenu] = React.useState({ open: false, x: 0, y: 0, key: null })

  const deviceOptions = midiInputs.map(input => ({ value: input.id, label: input.name }))

  // ── Dirty detection ──────────────────────────────────────────────────────────
  const isParamsDirty = PARAM_CONTROLS.some(({ key }) => controls[key] !== PARAM_DEFAULTS[key])

  const isVisualDirty = (
    colorConfig.useMidi !== COLOR_CONFIG_DEFAULTS.useMidi ||
    materialSettings.preset !== MATERIAL_DEFAULTS.preset ||
    materialSettings.solid !== MATERIAL_DEFAULTS.solid ||
    materialSettings.color !== (defaultMeshColor ?? MATERIAL_DEFAULTS.color) ||
    materialSettings.roughness !== MATERIAL_DEFAULTS.roughness ||
    materialSettings.metalness !== MATERIAL_DEFAULTS.metalness ||
    lightingSettings.enabled !== LIGHTING_DEFAULTS.enabled ||
    lightingSettings.color !== LIGHTING_DEFAULTS.color ||
    lightingSettings.strength !== LIGHTING_DEFAULTS.strength
  )

  const isSceneDirty = (
    bgColor !== (defaultBgColor ?? SCENE_DEFAULTS.bgColor) ||
    invertColors !== SCENE_DEFAULTS.invertColors
  )

  // ── Reset handlers ───────────────────────────────────────────────────────────
  const handleResetParams = () => {
    PARAM_CONTROLS.forEach(({ key }) => updateControl(key, PARAM_DEFAULTS[key]))
  }

  const handleResetScene = () => {
    onBgColorChange(defaultBgColor ?? SCENE_DEFAULTS.bgColor)
    onInvertColorsChange(SCENE_DEFAULTS.invertColors)
  }

  const handleOffsetChange = (key, newOffset) => {
    const cfg = midiConfig[key]
    updateMidiConfig(key, newOffset, cfg.offsetCenter)
    if (!tooltipHasBeenShownRef.current) {
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

      {midiStatus === 'unavailable' && (
        <GhostButton
          icon={Usb}
          label='Connect MIDI device'
          color='dynamic'
          onClick={requestMidiAccess}
          layoutClassName={styles.connectMidiButtonLayout}
        />
      )}

      <GhostButton
        icon={Music}
        label='MIDI Notes'
        color='white'
        onClick={onOpenMidiNotes}
        layoutClassName={styles.midiNotesButtonLayout}
      />

      <PanelContainerDivider />

      {/* ── Parameters ─────────────────────────────────────────────────────────── */}
      <Section title='Parameters' dirty={isParamsDirty} onReset={handleResetParams}>
        <div className={styles.knobGrid}>
          {PARAM_CONTROLS.map(({ key, label }) => {
            const cfg = midiConfig[key]
            const assignedNotes = (midiAssignments[key] ?? []).length

            return (
              <div
                key={key}
                ref={el => { knobCellsRef.current[key] = el }}
                onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; setDragOverKey(key) }}
                onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setDragOverKey(null) }}
                onDrop={e => { e.preventDefault(); setDragOverKey(null); const n = getDraggedNote(); if (n !== null) onAddMidiAssignment(key, n) }}
                onContextMenu={e => { e.preventDefault(); setContextMenu({ open: true, x: e.clientX, y: e.clientY, key }) }}
                className={cx(styles.knobCell, assignedNotes > 0 && styles.hasAssignment, dragOverKey === key && styles.isDragOver, contextMenu.open && contextMenu.key === key && styles.isContextActive)}
              >
                <KnobWithOffset
                  value={Math.round(controls[key])}
                  onChange={v => updateControl(key, v)}
                  offset={cfg.offset}
                  onOffsetChange={newOffset => handleOffsetChange(key, newOffset)}
                  offsetCenter={cfg.offsetCenter}
                  onOffsetCenterChange={newCenter => updateMidiConfig(key, cfg.offset, newCenter)}
                  min={0}
                  max={
                    ['rotation', 'xRotation', 'zRotation'].includes(key) ? 360
                    : key === 'resolution' ? 150
                    : 100
                  }
                  normalizedValue={key === 'resolution' ? Math.floor(5 + (controls[key] / 150) * 56.25) : undefined}
                  {...{ label }}
                />
                {assignedNotes > 0 && (
                  <div title={`${assignedNotes} MIDI note${assignedNotes > 1 ? 's' : ''} assigned`} className={styles.assignmentDot} />
                )}
              </div>
            )
          })}
        </div>
      </Section>

      <PanelContainerDivider />

      {/* ── Plane settings ──────────────────────────────────────────────────────── */}
      <Section title='Plane settings' dirty={isVisualDirty} {...{ onReset }}>
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

          <PanelContainerSettingsRow label='Audio Input'>
            <ActionIconButton
              icon={Settings}
              size={20}
              style='outline'
              onClick={onOpenAudioInput}
              title='Audio input settings'
            />
          </PanelContainerSettingsRow>
        </PanelContainer>
      </Section>

      <PanelContainerDivider />

      {/* ── Scene ───────────────────────────────────────────────────────────────── */}
      <Section title='Scene' dirty={isSceneDirty} onReset={handleResetScene}>
        <PanelContainer>
          <PanelContainerSettingsRow
            label='Background'
            className={bgColorDragOver ? styles.isDragOver : undefined}
            onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; setBgColorDragOver(true) }}
            onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setBgColorDragOver(false) }}
            onDrop={e => {
              e.preventDefault()
              setBgColorDragOver(false)
              const note = getDraggedNote()
              if (note === null) return
              updateBgColorCycleConfig({
                midiNote: note,
                colors: bgColorCycleConfig.colors.length > 0 ? bgColorCycleConfig.colors : [bgColor],
              })
              setBgColorPickerOpen(true)
            }}
          >
            <ColorInput
              adjustOpacity
              colorArrayIsActive={bgColorCycleConfig.midiNote !== null}
              value={bgColor}
              onChange={onBgColorChange}
              colorArray={bgColorCycleConfig.colors}
              onColorArrayChange={(i, hex) => {
                const updated = [...bgColorCycleConfig.colors]
                updated[i] = hex
                updateBgColorCycleConfig({ colors: updated })
              }}
              onAddColor={() => updateBgColorCycleConfig({ colors: [...bgColorCycleConfig.colors, bgColor] })}
              onRemoveColor={i => updateBgColorCycleConfig({ colors: bgColorCycleConfig.colors.filter((_, idx) => idx !== i) })}
              onClearColorArray={() => { updateBgColorCycleConfig({ midiNote: null, colors: [] }); setBgColorPickerOpen(false) }}
              open={bgColorPickerOpen}
              onOpenChange={setBgColorPickerOpen}
              layoutClassName={styles.colorInputLayout}
            />
          </PanelContainerSettingsRow>

          <PanelContainerSettingsRow
            label='Invert colors'
            onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; setInvertColorsDragOver(true) }}
            onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setInvertColorsDragOver(false) }}
            onDrop={e => { e.preventDefault(); setInvertColorsDragOver(false); const n = getDraggedNote(); if (n !== null) onAddBooleanAssignment('invertColors', n) }}
            className={invertColorsDragOver ? styles.isDragOver : undefined}
          >
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

      <ContextMenu
        isOpen={contextMenu.open}
        x={contextMenu.x}
        y={contextMenu.y}
        onClose={() => setContextMenu(prev => ({ ...prev, open: false }))}
        items={[
          {
            icon: <Trash2 size={14} />,
            label: 'Clear MIDI assignments',
            onClick: () => onClearMidiAssignments(contextMenu.key),
            disabled: !contextMenu.key || !(midiAssignments[contextMenu.key]?.length > 0),
          },
        ]}
      />

      <Modal
        isOpen={midiErrorModalOpen}
        onClose={() => setMidiErrorModalOpen(false)}
        title='MIDI Access Unavailable'
      >
        <div className={styles.midiErrorModal}>
          <LabelSm>Your browser reported:</LabelSm>
          <div className={styles.midiErrorQuote}>
            <LabelSm>{midiErrorMessage}</LabelSm>
          </div>
          <LabelSm>
            If no MIDI devices are connected, plug one in and reload the page.
            If devices are connected, try restarting your browser — Your browser sometimes
            requires a restart to detect newly connected MIDI hardware.
          </LabelSm>
        </div>
      </Modal>
    </div>
  )
}
