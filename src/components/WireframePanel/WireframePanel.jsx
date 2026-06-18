import { Checkbox, ColorInput, Dropdown, PanelContainer, PanelContainerDivider, PanelContainerSettingsRow, Slider } from '@6njp/prototype-library'

import { useMidiDrag } from '@/hooks/useMidiDrag.js'

import styles from './WireframePanel.module.css'

export function WireframePanel({
  controls,
  colorConfig,
  updateColorConfig,
  addColor,
  removeColor,
  onColorChange,
  wireframeSettings,
  updateWireframe,
}) {
  const { getDraggedNote } = useMidiDrag()
  const [colorPickerOpen, setColorPickerOpen] = React.useState(false)
  const [isDragOver, setIsDragOver] = React.useState(false)

  const colorValueHex = `#${Math.floor((controls.color / 100) * 0xFFFFFF).toString(16).padStart(6, '0')}`

  function handleColorDrop(e) {
    e.preventDefault()
    setIsDragOver(false)
    const note = getDraggedNote()
    if (note === null) return
    updateColorConfig({ useMidi: true, midiNote: note })
    setColorPickerOpen(true)
  }

  function handleClearColorArray() {
    updateColorConfig({ useMidi: false, midiNote: null })
    setColorPickerOpen(false)
  }

  const styleOptions = [
    { value: 'grid',   label: 'Grid lines' },
    { value: 'dots',   label: 'Dots' },
    { value: 'dashed', label: 'Dashed' },
  ]

  return (
    <PanelContainer>
      <PanelContainerSettingsRow label='Wireframe style'>
        <Dropdown
          value={wireframeSettings.style ?? 'grid'}
          onChange={style => updateWireframe({ style })}
          options={styleOptions}
        />
      </PanelContainerSettingsRow>

      {wireframeSettings.style === 'dots' && (
        <Slider
          value={wireframeSettings.dotSize ?? 4}
          onChange={dotSize => updateWireframe({ dotSize })}
          min={1}
          max={20}
          step={0.5}
          label='Dot size'
        />
      )}

      {wireframeSettings.style === 'dashed' && (
        <Slider
          value={wireframeSettings.dashSize ?? 12}
          onChange={dashSize => updateWireframe({ dashSize })}
          min={2}
          max={60}
          step={1}
          label='Dash size'
        />
      )}

      <PanelContainerDivider />

      <PanelContainerSettingsRow
        label='Color'
        onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; setIsDragOver(true) }}
        onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setIsDragOver(false) }}
        onDrop={handleColorDrop}
        className={cx(isDragOver && styles.isDragOver)}
      >
        <ColorInput
          value={colorValueHex}
          onChange={onColorChange}
          layoutClassName={styles.colorInputLayout}
          open={colorPickerOpen}
          onOpenChange={setColorPickerOpen}
          colorArrayIsActive={colorConfig.useMidi}
          colorArray={colorConfig.colors}
          onColorArrayChange={(i, hex) => {
            const updated = [...colorConfig.colors]
            updated[i] = hex
            updateColorConfig({ colors: updated })
          }}
          onAddColor={addColor}
          onRemoveColor={removeColor}
          onClearColorArray={handleClearColorArray}
        />
      </PanelContainerSettingsRow>

      <PanelContainerDivider />

      <PanelContainerSettingsRow label='Glow'>
        <Checkbox
          checked={wireframeSettings.glow}
          onChange={glow => updateWireframe({ glow })}
        />
      </PanelContainerSettingsRow>

      {wireframeSettings.glow && (
        <>
          <PanelContainerSettingsRow label='Glow color'>
            <ColorInput
              value={wireframeSettings.glowColor}
              onChange={glowColor => updateWireframe({ glowColor })}
              layoutClassName={styles.colorInputLayout}
            />
          </PanelContainerSettingsRow>

          <Slider
            value={wireframeSettings.glowIntensity}
            onChange={glowIntensity => updateWireframe({ glowIntensity })}
            min={0}
            max={15}
            step={0.1}
            label='Intensity'
          />
        </>
      )}
    </PanelContainer>
  )
}
