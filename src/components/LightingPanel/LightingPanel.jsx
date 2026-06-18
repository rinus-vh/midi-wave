import {
  Checkbox,
  ColorInput,
  PanelContainer,
  PanelContainerDivider,
  PanelContainerSettingsRow,
  Slider,
} from '@6njp/prototype-library'

import styles from './LightingPanel.module.css'

export function LightingPanel({ lightingSettings, updateLighting }) {
  return (
    <PanelContainer>
      <PanelContainerSettingsRow label='Enabled'>
        <Checkbox
          checked={lightingSettings.enabled}
          onChange={enabled => updateLighting({ enabled })}
        />
      </PanelContainerSettingsRow>

      <PanelContainerDivider />

      <PanelContainerSettingsRow label='Color'>
        <ColorInput
          value={lightingSettings.color}
          onChange={color => updateLighting({ color })}
          layoutClassName={styles.colorInputLayout}
        />
      </PanelContainerSettingsRow>

      <Slider
        value={lightingSettings.strength}
        onChange={strength => updateLighting({ strength })}
        min={0}
        max={15}
        step={0.1}
        label='Strength'
      />

      <PanelContainerDivider />

      <PanelContainerSettingsRow label='Cast shadows'>
        <Checkbox
          checked={lightingSettings.castShadows ?? false}
          onChange={castShadows => updateLighting({ castShadows })}
        />
      </PanelContainerSettingsRow>
    </PanelContainer>
  )
}
