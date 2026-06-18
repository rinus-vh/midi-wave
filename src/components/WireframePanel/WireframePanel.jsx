import { Minus, Plus } from 'lucide-react'
import {
  Checkbox,
  ColorInput,
  Icon,
  PanelContainer,
  PanelContainerDivider,
  PanelContainerSettingsRow,
  Slider,
} from '@6njp/prototype-library'

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
  const colorValueHex = `#${Math.floor((controls.color / 100) * 0xFFFFFF).toString(16).padStart(6, '0')}`

  return (
    <PanelContainer>
      {colorConfig.useMidi
        ? (
          <>
            <div className={styles.colorSwatches}>
              {colorConfig.colors.map((color, i) => (
                <div key={i} className={styles.colorSwatch}>
                  <ColorInput
                    value={color}
                    onChange={hex => {
                      const updated = [...colorConfig.colors]
                      updated[i] = hex
                      updateColorConfig({ colors: updated })
                    }}
                    layoutClassName={styles.colorInputLayout}
                  />
                  {colorConfig.colors.length > 1 && (
                    <button onClick={() => removeColor(i)} className={styles.removeBtn}>
                      <Icon icon={Minus} layoutClassName={styles.removeIconLayout} />
                    </button>
                  )}
                </div>
              ))}
              <button onClick={addColor} className={styles.addBtn}>
                <Icon icon={Plus} layoutClassName={styles.addIconLayout} />
              </button>
            </div>
            <PanelContainerDivider />
          </>
        )
        : (
          <PanelContainerSettingsRow label='Color'>
            <ColorInput
              value={colorValueHex}
              onChange={onColorChange}
              layoutClassName={styles.colorInputLayout}
            />
          </PanelContainerSettingsRow>
        )
      }

      <PanelContainerSettingsRow label='MIDI cycle'>
        <Checkbox
          checked={colorConfig.useMidi}
          onChange={v => updateColorConfig({ useMidi: v })}
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
