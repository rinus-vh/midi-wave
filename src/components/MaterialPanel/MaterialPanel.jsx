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

import styles from './MaterialPanel.module.css'

const PRESETS = [
  { value: 'custom', label: 'Custom' },
  { value: 'chrome', label: 'Chrome' },
]

export function MaterialPanel({ materialSettings, updateMaterial }) {
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

      <PanelContainerSettingsRow label='Color'>
        <ColorInput
          value={isChrome ? MATERIAL_DEFAULTS.color : materialSettings.color}
          onChange={color => updateMaterial({ color })}
          disabled={isChrome}
          layoutClassName={styles.colorInputLayout}
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
