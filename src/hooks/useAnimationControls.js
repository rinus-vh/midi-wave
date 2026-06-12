import { useState, useCallback, useRef } from 'react'

const defaultControls = {
  rotation: 50,
  xRotation: 55,
  zRotation: 50,
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
  rotation:   { enabled: false, note: 0, offset: 0, offsetCenter: 50 },
  xRotation:  { enabled: false, note: 0, offset: 0, offsetCenter: 50 },
  zRotation:  { enabled: false, note: 0, offset: 0, offsetCenter: 50 },
  scale:      { enabled: false, note: 0, offset: 0, offsetCenter: 50 },
  speed:      { enabled: false, note: 0, offset: 0, offsetCenter: 50 },
  complexity: { enabled: false, note: 0, offset: 0, offsetCenter: 50 },
  pulse:      { enabled: false, note: 0, offset: 0, offsetCenter: 50 },
  resolution: { enabled: false, note: 0, offset: 0, offsetCenter: 50 },
  zoom:       { enabled: false, note: 0, offset: 0, offsetCenter: 50 },
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
  const [currentColorIndex, setCurrentColorIndex] = useState(0)
  const lastMidiNoteRef = useRef(0)

  const updateControl = useCallback((name, value) => {
    setControls(prev => ({ ...prev, [name]: value }))
  }, [])

  const updateMidiConfig = useCallback((control, enabled, note, offset, offsetCenter) => {
    setMidiConfig(prev => ({
      ...prev,
      [control]: {
        ...prev[control],
        enabled,
        note: note ?? lastMidiNoteRef.current,
        offset: offset ?? prev[control].offset,
        offsetCenter: offsetCenter ?? prev[control].offsetCenter,
      },
    }))
  }, [])

  const updateColorConfig = useCallback((config) => {
    if (config.useMidi !== undefined && config.midiNote === undefined) {
      config.midiNote = lastMidiNoteRef.current
    }
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
    setCurrentColorIndex(prev => Math.max(0, prev - 1))
  }, [])

  const handleMidiMessage = useCallback((event) => {
    const [status, data1, data2] = Array.from(event.data)
    lastMidiNoteRef.current = data1

    if ((status & 0xF0) === 0x90 && data2 > 0) {
      setColorConfig(colorCfg => {
        if (colorCfg.useMidi && data1 === colorCfg.midiNote && colorCfg.colors.length > 0) {
          setCurrentColorIndex(prev => {
            const nextIndex = (prev + 1) % colorCfg.colors.length
            const hexColor = colorCfg.colors[nextIndex].substring(1)
            const normalized = (parseInt(hexColor, 16) / 0xFFFFFF) * 100
            updateControl('color', normalized)
            return nextIndex
          })
        }
        return colorCfg
      })

      setMidiConfig(cfg => {
        Object.entries(cfg).forEach(([control, config]) => {
          if (config.enabled && data1 === config.note) {
            const low  = Math.max(0,   config.offsetCenter - config.offset)
            const high = Math.min(100, config.offsetCenter + config.offset)
            updateControl(control, low + Math.random() * (high - low))
          }
        })
        return cfg
      })
    }
  }, [updateControl])

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
