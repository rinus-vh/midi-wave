import { radialHeatmap, HEATMAP_SIZE } from '@/utils/audioHeatmap.js'

export const AUDIO_INPUT_DEFAULTS = {
  enabled: false,
  deviceId: null,
  strength: 50,
  peakHeight: 50,
  smooth: 30,
  frequencyMap: radialHeatmap(HEATMAP_SIZE),
}

export const PARAM_CONTROLS = [
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

export const PARAM_DEFAULTS = {
  rotation: 180,
  xRotation: 198,
  zRotation: 180,
  scale: 50,
  speed: 0,
  complexity: 0,
  pulse: 0,
  resolution: 32,
  zoom: 0,
}

export const MATERIAL_DEFAULTS = {
  preset: 'custom',
  color: '#ffffff',
  roughness: 0.5,
  metalness: 0.5,
  solid: false,
  opacity: 1,
}

export const LIGHTING_DEFAULTS = {
  enabled: false,
  color: '#ffffff',
  strength: 2,
  castShadows: false,
}

export const WIREFRAME_DEFAULTS = {
  style: 'grid',
  dotSize: 4,
  dashSize: 12,
  glow: false,
  glowIntensity: 5,
  glowColor: '#ffffff',
}

export const COLOR_CONFIG_DEFAULTS = {
  useMidi: false,
  midiNote: 0,
  colors: ['#ffffff'],
}

export const SCENE_DEFAULTS = {
  bgColor: '#000000ff',
  invertColors: false,
}
