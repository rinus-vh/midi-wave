import { Activity } from 'lucide-react'
import { Grid, Header, Panel } from '@6njp/prototype-library'
import { getThemeVariables } from '@6njp/prototype-library/machinery'

import { SettingsPanel } from '@/components/SettingsPanel/SettingsPanel.jsx'
import { VisualCanvas } from '@/components/VisualCanvas/VisualCanvas.jsx'
import { useAnimationControls } from '@/hooks/useAnimationControls.js'
import { useMidiSetup } from '@/hooks/useMidiSetup.js'

import styles from './App.module.css'

export default function App() {
  const [isDark, setIsDark] = React.useState(true)
  const themeVariables = getThemeVariables(isDark ? 'dark' : 'light')
  const [midiNotes, setMidiNotes] = React.useState([])
  const noteIdRef = React.useRef(0)
  const [showTimeline, setShowTimeline] = React.useState(true)
  const [invertColors, setInvertColors] = React.useState(false)
  const userHasChosenColorRef = React.useRef(false)

  const { midiInputs, selectedInput, handleSelectedInputChange, midiStatus } = useMidiSetup()

  const {
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
  } = useAnimationControls()

  React.useEffect(() => {
    if (!selectedInput) return
    const onMessage = (event) => {
      handleMidiMessage(event)
      const [status, data1, data2] = Array.from(event.data)
      if ((status & 0xF0) === 0x90 && data2 > 0) {
        setMidiNotes(prev => [...prev, { id: noteIdRef.current++, value: data1, timestamp: Date.now() }])
      }
    }
    selectedInput.addEventListener('midimessage', onMessage)
    return () => selectedInput.removeEventListener('midimessage', onMessage)
  }, [selectedInput, handleMidiMessage])

  React.useEffect(() => {
    if (userHasChosenColorRef.current) return
    updateControl('color', isDark ? (0xf4f4f4 / 0xFFFFFF) * 100 : (0x262626 / 0xFFFFFF) * 100)
  }, [isDark, updateControl])

  React.useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now()
      setMidiNotes(prev => prev.filter(n => now - n.timestamp < 1000))
    }, 100)
    return () => clearInterval(id)
  }, [])

  const handleUserColorChange = React.useCallback((hex) => {
    userHasChosenColorRef.current = true
    const normalized = (parseInt(hex.substring(1), 16) / 0xFFFFFF) * 100
    updateControl('color', normalized)
  }, [updateControl])

  const handleReset = React.useCallback(() => {
    userHasChosenColorRef.current = false
    resetControls(isDark)
    resetColorConfig()
  }, [isDark, resetControls, resetColorConfig])

  return (
    <main style={themeVariables} className={styles.app}>
      <Header
        title='MIDI Wave'
        logo={Activity}
        onToggleTheme={() => setIsDark(d => !d)}
        layoutClassName={styles.headerLayout}
        {...{ isDark }}
      />

      <Grid layoutClassName={styles.gridLayout}>
        <Panel title='Settings' minWidth={4} minHeight={11}>
          <SettingsPanel
            onSelectedInputChange={handleSelectedInputChange}
            onReset={handleReset}
            onColorChange={handleUserColorChange}
            {...{
              controls,
              updateControl,
              midiConfig,
              updateMidiConfig,
              colorConfig,
              updateColorConfig,
              addColor,
              removeColor,
              midiStatus,
              midiInputs,
              selectedInput,
              showTimeline,
              onShowTimelineChange: setShowTimeline,
              invertColors,
              onInvertColorsChange: setInvertColors,
            }}
          />
        </Panel>

        <Panel title='Output' minWidth={12} minHeight={12}>
          <VisualCanvas {...{ controls, colorConfig, updateControl, isDark, midiNotes, showTimeline, invertColors }} />
        </Panel>
      </Grid>
    </main>
  )
}
