import { useState, useCallback, useRef } from 'react'

const defaultControls = {
  rotation: 0,
  xRotation: 270,
  zRotation: 360,
  scale: 50,
  speed: 0,
  complexity: 0,
  density: 50,
  color: (0xf4f4f4 / 0xFFFFFF) * 100, // --color-white
  pulse: 0,
  resolution: 32,
  zoom: 0,
}

const defaultMidiConfig = {
  rotation:   { offset: 0, offsetCenter: 0 },
  xRotation:  { offset: 0, offsetCenter: 270 },
  zRotation:  { offset: 0, offsetCenter: 360 },
  scale:      { offset: 0, offsetCenter: 50 },
  speed:      { offset: 0, offsetCenter: 50 },
  complexity: { offset: 0, offsetCenter: 50 },
  pulse:      { offset: 0, offsetCenter: 50 },
  resolution: { offset: 0, offsetCenter: 32 },
  zoom:       { offset: 0, offsetCenter: 50 },
}

const defaultColorConfig = {
  useMidi: false,
  midiNote: 0,
  colors: ['#ffffff'],
}

export function useAnimationControls() {
  const [controls, setControls] = useState(defaultControls)
  const [midiConfig, setMidiConfig] = useState(defaultMidiConfig)
  const [colorConfig, setColorConfig] = useState(defaultColorConfig)
  const lastMidiNoteRef = useRef(0)

  const updateControl = useCallback((name, value) => {
    setControls(prev => ({ ...prev, [name]: value }))
  }, [])

  const updateMidiConfig = useCallback((control, offset, offsetCenter) => {
    setMidiConfig(prev => ({
      ...prev,
      [control]: {
        offset: offset ?? prev[control].offset,
        offsetCenter: offsetCenter ?? prev[control].offsetCenter,
      },
    }))
  }, [])

  const updateColorConfig = useCallback((config) => {
    setColorConfig(prev => ({ ...prev, ...config }))
  }, [])

  const addColor = useCallback(() => {
    setColorConfig(prev => ({ ...prev, colors: [...prev.colors, '#ffffff'] }))
  }, [])

  const removeColor = useCallback((index) => {
    setColorConfig(prev => ({
      ...prev,
      colors: prev.colors.filter((_, i) => i !== index),
    }))
  }, [])

  const handleMidiMessage = useCallback((event) => {
    const [, data1] = Array.from(event.data)
    lastMidiNoteRef.current = data1
  }, [])

  const resetControls = useCallback((isDark) => {
    const color = isDark ? (0xf4f4f4 / 0xFFFFFF) * 100 : (0x262626 / 0xFFFFFF) * 100
    setControls({ ...defaultControls, color })
    setMidiConfig(defaultMidiConfig)
  }, [])

  const resetColorConfig = useCallback(() => {
    setColorConfig(defaultColorConfig)
  }, [])

  return {
    controls,
    updateControl,
    resetControls,
    resetColorConfig,
    handleMidiMessage,
    midiConfig,
    updateMidiConfig,
    colorConfig,
    updateColorConfig,
    addColor,
    removeColor,
  }
}
