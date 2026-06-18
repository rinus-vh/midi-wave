import {
  Checkbox,
  ColorInput,
  Dropdown,
  PanelContainer,
  PanelContainerDivider,
  PanelContainerSettingsRow,
  Slider,
} from '@6njp/prototype-library'

import { MATERIAL_DEFAULTS } from '@/constants/defaults.js'
import { useMidiDrag } from '@/hooks/useMidiDrag.js'

import styles from './MaterialPanel.module.css'

const PRESETS = [
  { value: 'custom', label: 'Custom' },
  { value: 'chrome', label: 'Chrome' },
]

export function MaterialPanel({ materialSettings, updateMaterial, solidColorCycleConfig, updateSolidColorCycleConfig }) {
  const { getDraggedNote } = useMidiDrag()
  const [solidColorPickerOpen, setSolidColorPickerOpen] = React.useState(false)
  const [isDragOver, setIsDragOver] = React.useState(false)

  const isSolid = materialSettings.solid ?? false
  const isChrome = isSolid && materialSettings.preset === 'chrome'

  return (
    <PanelContainer>
      <PanelContainerSettingsRow label='Solid enabled'>
        <Checkbox
          checked={isSolid}
          onChange={solid => updateMaterial({ solid })}
        />
      </PanelContainerSettingsRow>

      <PanelContainerSettingsRow label='Preset'>
        <Dropdown
          value={materialSettings.preset}
          onChange={preset => updateMaterial({ preset })}
          options={PRESETS}
          placeholder='Preset'
        />
      </PanelContainerSettingsRow>

      <PanelContainerDivider />

      <PanelContainerSettingsRow
        label='Color'
        onDragOver={e => { if (isChrome) return; e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; setIsDragOver(true) }}
        onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setIsDragOver(false) }}
        onDrop={e => {
          e.preventDefault()
          setIsDragOver(false)
          if (isChrome) return
          const note = getDraggedNote()
          if (note === null) return
          updateSolidColorCycleConfig({
            midiNote: note,
            colors: solidColorCycleConfig.colors.length > 0 ? solidColorCycleConfig.colors : [materialSettings.color],
          })
          setSolidColorPickerOpen(true)
        }}
        className={cx(isDragOver && styles.isDragOver)}
      >
        <ColorInput
          value={isChrome ? MATERIAL_DEFAULTS.color : materialSettings.color}
          onChange={color => updateMaterial({ color })}
          disabled={isChrome}
          layoutClassName={styles.colorInputLayout}
          open={solidColorPickerOpen}
          onOpenChange={setSolidColorPickerOpen}
          colorArrayIsActive={solidColorCycleConfig?.midiNote !== null}
          colorArray={solidColorCycleConfig?.colors ?? []}
          onColorArrayChange={(i, hex) => {
            const updated = [...solidColorCycleConfig.colors]
            updated[i] = hex
            updateSolidColorCycleConfig({ colors: updated })
          }}
          onAddColor={() => updateSolidColorCycleConfig({ colors: [...solidColorCycleConfig.colors, materialSettings.color] })}
          onRemoveColor={i => updateSolidColorCycleConfig({ colors: solidColorCycleConfig.colors.filter((_, idx) => idx !== i) })}
          onClearColorArray={() => { updateSolidColorCycleConfig({ midiNote: null, colors: [] }); setSolidColorPickerOpen(false) }}
        />
      </PanelContainerSettingsRow>

      <Slider
        value={isChrome ? 0 : materialSettings.roughness}
        onChange={roughness => updateMaterial({ roughness })}
        min={0}
        max={1}
        step={0.01}
        label='Roughness'
        disabled={isChrome || !isSolid}
      />

      <Slider
        value={isChrome ? 1 : materialSettings.metalness}
        onChange={metalness => updateMaterial({ metalness })}
        min={0}
        max={1}
        step={0.01}
        label='Metalness'
        disabled={isChrome || !isSolid}
      />

      <Slider
        value={materialSettings.opacity ?? 1}
        onChange={opacity => updateMaterial({ opacity })}
        min={0}
        max={1}
        step={0.01}
        label='Opacity'
        disabled={!isSolid}
      />
    </PanelContainer>
  )
}
