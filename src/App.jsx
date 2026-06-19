import { Activity } from 'lucide-react'
import {
  Grid,
  Header,
  MinimizedPanelsMenu,
  MinimizedPanelsMenuContextProvider,
  Panel,
  usePanelManager,
} from '@6njp/prototype-library'
import { getThemeVariables, ThemeContextProvider } from '@6njp/prototype-library/machinery'

import { MidiDragContextProvider } from '@/contexts/MidiDragContext.jsx'
import { AudioInputPanel } from '@/components/AudioInputPanel/AudioInputPanel.jsx'
import { LightingPanel } from '@/components/LightingPanel/LightingPanel.jsx'
import { MaterialPanel } from '@/components/MaterialPanel/MaterialPanel.jsx'
import { MidiNoteSettingsAssignmentPanel } from '@/components/MidiNoteSettingsAssignmentPanel/MidiNoteSettingsAssignmentPanel.jsx'
import { SettingsPanel } from '@/components/SettingsPanel/SettingsPanel.jsx'
import { VisualCanvas } from '@/components/VisualCanvas/VisualCanvas.jsx'
import { WireframePanel } from '@/components/WireframePanel/WireframePanel.jsx'
import { AUDIO_INPUT_DEFAULTS, LIGHTING_DEFAULTS, MATERIAL_DEFAULTS, SCENE_DEFAULTS, WIREFRAME_DEFAULTS } from '@/constants/defaults.js'
import { useAnimationControls } from '@/hooks/useAnimationControls.js'
import { useAudioInput } from '@/hooks/useAudioInput.js'
import { useMidiSetup } from '@/hooks/useMidiSetup.js'
import { midiNoteToName } from '@/utils/midiNoteNames.js'

import styles from './App.module.css'

export default function App() {
  const [isDark, setIsDark] = React.useState(true)
  const [trackedNotes, setTrackedNotes] = React.useState([])
  const [activeNoteNumbers, setActiveNoteNumbers] = React.useState(new Set())
  const [midiAssignments, setMidiAssignments] = React.useState({})
  const [booleanAssignments, setBooleanAssignments] = React.useState({})
  const [invertColors, setInvertColors] = React.useState(SCENE_DEFAULTS.invertColors)
  const [userHasChosenBgColor, setUserHasChosenBgColor] = React.useState(false)
  const [materialSettings, setMaterialSettings] = React.useState(MATERIAL_DEFAULTS)
  const [lightingSettings, setLightingSettings] = React.useState(LIGHTING_DEFAULTS)
  const [wireframeSettings, setWireframeSettings] = React.useState(WIREFRAME_DEFAULTS)
  const [userHasChosenColor, setUserHasChosenColor] = React.useState(false)
  const [customBgColor, setCustomBgColor] = React.useState(SCENE_DEFAULTS.bgColor)
  const [audioConfig, setAudioConfig] = React.useState(AUDIO_INPUT_DEFAULTS)
  const [bgColorCycleConfig, setBgColorCycleConfig] = React.useState({ midiNote: null, colors: [] })
  const [solidColorCycleConfig, setSolidColorCycleConfig] = React.useState({ midiNote: null, colors: [] })
  const bgColorCycleIndexRef = React.useRef(0)
  const solidColorCycleIndexRef = React.useRef(0)
  const wireframeColorCycleIndexRef = React.useRef(0)
  const bgColorCycleConfigRef = React.useRef(bgColorCycleConfig)
  const solidColorCycleConfigRef = React.useRef(solidColorCycleConfig)
  React.useEffect(() => { bgColorCycleConfigRef.current = bgColorCycleConfig }, [bgColorCycleConfig])
  React.useEffect(() => { solidColorCycleConfigRef.current = solidColorCycleConfig }, [solidColorCycleConfig])

  const bgColor = userHasChosenBgColor ? customBgColor : (isDark ? '#000000ff' : '#f4f4f4ff')

  const { midiInputs, selectedInput, handleSelectedInputChange, midiStatus, midiErrorMessage, requestMidiAccess } = useMidiSetup()
  const { audioDevices, getFrequencyData, permissionError } = useAudioInput({
    enabled: audioConfig.enabled,
    deviceId: audioConfig.deviceId,
  })

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

  const booleanAssignmentsRef = React.useRef(booleanAssignments)
  React.useEffect(() => { booleanAssignmentsRef.current = booleanAssignments }, [booleanAssignments])

  // Stable refs for use inside the MIDI event callback
  const midiAssignmentsRef = React.useRef(midiAssignments)
  const midiConfigRef = React.useRef(midiConfig)
  const colorConfigRef = React.useRef(colorConfig)
  React.useEffect(() => { midiAssignmentsRef.current = midiAssignments }, [midiAssignments])
  React.useEffect(() => { midiConfigRef.current = midiConfig }, [midiConfig])
  React.useEffect(() => { colorConfigRef.current = colorConfig }, [colorConfig])

  React.useEffect(() => {
    if (!selectedInput) return
    const onMessage = (event) => {
      handleMidiMessage(event)
      const [status, data1, data2] = Array.from(event.data)
      if ((status & 0xF0) === 0x90 && data2 > 0) {
        // Add to persistent tracked notes if new
        setTrackedNotes(prev =>
          prev.some(n => n.noteNumber === data1)
            ? prev
            : [...prev, { noteNumber: data1, noteName: midiNoteToName(data1) }]
        )

        // Light up for 400ms
        setActiveNoteNumbers(prev => new Set([...prev, data1]))
        setTimeout(() => {
          setActiveNoteNumbers(prev => {
            const next = new Set(prev)
            next.delete(data1)
            return next
          })
        }, 400)

        // Trigger assigned settings
        const assignments = midiAssignmentsRef.current
        const midiCfg = midiConfigRef.current
        Object.entries(assignments).forEach(([settingKey, noteAssignments]) => {
          const assignment = noteAssignments.find(a => a.noteNumber === data1)
          if (!assignment) return
          if (Math.random() > assignment.chance) return
          const cfg = midiCfg[settingKey]
          if (cfg && cfg.offset > 0) {
            const low  = Math.max(0,   cfg.offsetCenter - cfg.offset)
            const high = Math.min(100, cfg.offsetCenter + cfg.offset)
            updateControl(settingKey, low + Math.random() * (high - low))
          }
        })

        // boolean toggle assignments
        const boolAssignments = booleanAssignmentsRef.current
        Object.entries(boolAssignments).forEach(([settingKey, noteAssignments]) => {
          const assignment = noteAssignments.find(a => a.noteNumber === data1)
          if (!assignment) return
          if (Math.random() > (assignment.chance ?? 1)) return
          if (settingKey === 'invertColors') setInvertColors(prev => !prev)
        })

        // wireframe color cycling
        const wireCfg = colorConfigRef.current
        if (wireCfg.useMidi && wireCfg.midiNote === data1 && wireCfg.colors.length > 0) {
          wireframeColorCycleIndexRef.current = (wireframeColorCycleIndexRef.current + 1) % wireCfg.colors.length
          const hex = wireCfg.colors[wireframeColorCycleIndexRef.current].replace('#', '')
          updateControl('color', (parseInt(hex, 16) / 0xFFFFFF) * 100)
        }

        // bgColor cycling
        const bgCfg = bgColorCycleConfigRef.current
        if (bgCfg.midiNote === data1 && bgCfg.colors.length > 0) {
          bgColorCycleIndexRef.current = (bgColorCycleIndexRef.current + 1) % bgCfg.colors.length
          setCustomBgColor(bgCfg.colors[bgColorCycleIndexRef.current])
          setUserHasChosenBgColor(true)
        }

        // solidColor cycling
        const solidCfg = solidColorCycleConfigRef.current
        if (solidCfg.midiNote === data1 && solidCfg.colors.length > 0) {
          solidColorCycleIndexRef.current = (solidColorCycleIndexRef.current + 1) % solidCfg.colors.length
          setMaterialSettings(prev => ({ ...prev, color: solidCfg.colors[solidColorCycleIndexRef.current] }))
        }
      }
    }
    selectedInput.addEventListener('midimessage', onMessage)
    return () => selectedInput.removeEventListener('midimessage', onMessage)
  }, [selectedInput, handleMidiMessage, updateControl])

  React.useEffect(() => {
    if (userHasChosenColor) return
    updateControl('color', isDark ? (0xf4f4f4 / 0xFFFFFF) * 100 : (0x262626 / 0xFFFFFF) * 100)
  }, [isDark, updateControl, userHasChosenColor])

  const handleUserColorChange = React.useCallback((hex) => {
    setUserHasChosenColor(true)
    const normalized = (parseInt(hex.substring(1), 16) / 0xFFFFFF) * 100
    updateControl('color', normalized)
  }, [updateControl])

  const handleReset = React.useCallback(() => {
    setUserHasChosenColor(false)
    setUserHasChosenBgColor(false)
    resetControls(isDark)
    resetColorConfig()
    setMaterialSettings(MATERIAL_DEFAULTS)
    setLightingSettings(LIGHTING_DEFAULTS)
    setWireframeSettings(WIREFRAME_DEFAULTS)
    setInvertColors(SCENE_DEFAULTS.invertColors)
    setTrackedNotes([])
    setActiveNoteNumbers(new Set())
    setMidiAssignments({})
    setBooleanAssignments({})
    setBgColorCycleConfig({ midiNote: null, colors: [] })
    setSolidColorCycleConfig({ midiNote: null, colors: [] })
    bgColorCycleIndexRef.current = 0
    solidColorCycleIndexRef.current = 0
  }, [isDark, resetControls, resetColorConfig])

  const updateMaterial = React.useCallback((patch) => setMaterialSettings(prev => ({ ...prev, ...patch })), [])
  const updateLighting = React.useCallback((patch) => setLightingSettings(prev => ({ ...prev, ...patch })), [])
  const updateWireframe = React.useCallback((patch) => setWireframeSettings(prev => ({ ...prev, ...patch })), [])
  const updateAudioConfig = React.useCallback((patch) => setAudioConfig(prev => ({ ...prev, ...patch })), [])
  const updateBgColorCycleConfig = React.useCallback((patch) => setBgColorCycleConfig(prev => ({ ...prev, ...patch })), [])
  const updateSolidColorCycleConfig = React.useCallback((patch) => setSolidColorCycleConfig(prev => ({ ...prev, ...patch })), [])

  const updateMidiAssignment = React.useCallback((settingKey, noteNumber, chance) => {
    setMidiAssignments(prev => {
      const existing = prev[settingKey] ?? []
      const already = existing.find(a => a.noteNumber === noteNumber)
      const updated = already
        ? existing.map(a => a.noteNumber === noteNumber ? { ...a, chance } : a)
        : [...existing, { noteNumber, chance }]
      return { ...prev, [settingKey]: updated }
    })
  }, [])

  const addMidiAssignment = React.useCallback((settingKey, noteNumber) => {
    setMidiAssignments(prev => {
      const existing = prev[settingKey] ?? []
      if (existing.some(a => a.noteNumber === noteNumber)) return prev
      return { ...prev, [settingKey]: [...existing, { noteNumber, chance: 1 }] }
    })
  }, [])

  const clearMidiAssignments = React.useCallback((settingKey) => {
    setMidiAssignments(prev => {
      const next = { ...prev }
      delete next[settingKey]
      return next
    })
  }, [])

  const removeMidiAssignment = React.useCallback((settingKey, noteNumber) => {
    setMidiAssignments(prev => {
      const updated = (prev[settingKey] ?? []).filter(a => a.noteNumber !== noteNumber)
      const next = { ...prev }
      if (updated.length === 0) delete next[settingKey]
      else next[settingKey] = updated
      return next
    })
  }, [])

  const addBooleanAssignment = React.useCallback((settingKey, noteNumber) => {
    setBooleanAssignments(prev => {
      const existing = prev[settingKey] ?? []
      if (existing.some(a => a.noteNumber === noteNumber)) return prev
      return { ...prev, [settingKey]: [...existing, { noteNumber, chance: 1 }] }
    })
  }, [])

  const updateBooleanAssignment = React.useCallback((settingKey, noteNumber, chance) => {
    setBooleanAssignments(prev => ({
      ...prev,
      [settingKey]: (prev[settingKey] ?? []).map(a =>
        a.noteNumber === noteNumber ? { ...a, chance } : a
      ),
    }))
  }, [])

  const removeBooleanAssignment = React.useCallback((settingKey, noteNumber) => {
    setBooleanAssignments(prev => {
      const updated = (prev[settingKey] ?? []).filter(a => a.noteNumber !== noteNumber)
      const next = { ...prev }
      if (updated.length === 0) delete next[settingKey]
      else next[settingKey] = updated
      return next
    })
  }, [])

  const themeVariables = getThemeVariables(isDark ? 'dark' : 'light')

  return (
    <ThemeContextProvider theme={isDark ? 'dark' : 'light'}>
      <MinimizedPanelsMenuContextProvider>
        <MidiDragContextProvider>
          <AppPanels
            onToggleTheme={() => setIsDark(d => !d)}
            onInvertColorsChange={setInvertColors}
            onBgColorChange={(color) => { setUserHasChosenBgColor(true); setCustomBgColor(color) }}
            onColorChange={handleUserColorChange}
            onReset={handleReset}
            onSelectedInputChange={handleSelectedInputChange}
            onAddMidiAssignment={addMidiAssignment}
            onUpdateMidiAssignment={updateMidiAssignment}
            onClearMidiAssignments={clearMidiAssignments}
            onRemoveMidiAssignment={removeMidiAssignment}
            onAddBooleanAssignment={addBooleanAssignment}
            onUpdateBooleanAssignment={updateBooleanAssignment}
            onRemoveBooleanAssignment={removeBooleanAssignment}
            {...{
              isDark,
              themeVariables,
              trackedNotes,
              activeNoteNumbers,
              midiAssignments,
              booleanAssignments,
              invertColors,
              bgColor,
              materialSettings,
              lightingSettings,
              wireframeSettings,
              updateMaterial,
              updateLighting,
              updateWireframe,
              controls,
              updateControl,
              midiConfig,
              updateMidiConfig,
              colorConfig,
              updateColorConfig,
              addColor,
              removeColor,
              midiStatus,
              midiErrorMessage,
              requestMidiAccess,
              midiInputs,
              selectedInput,
              audioConfig,
              updateAudioConfig,
              audioDevices,
              getFrequencyData,
              permissionError,
              bgColorCycleConfig,
              updateBgColorCycleConfig,
              solidColorCycleConfig,
              updateSolidColorCycleConfig,
              colorAssignments: {
                wireframeColor: colorConfig.midiNote !== null ? [{ noteNumber: colorConfig.midiNote, chance: 1 }] : [],
                bgColor: bgColorCycleConfig.midiNote !== null ? [{ noteNumber: bgColorCycleConfig.midiNote, chance: 1 }] : [],
                solidColor: solidColorCycleConfig.midiNote !== null ? [{ noteNumber: solidColorCycleConfig.midiNote, chance: 1 }] : [],
              },
              onRemoveColorAssignment: key => {
                if (key === 'wireframeColor') updateColorConfig({ useMidi: false, midiNote: null })
                else if (key === 'bgColor') updateBgColorCycleConfig({ midiNote: null, colors: [] })
                else if (key === 'solidColor') updateSolidColorCycleConfig({ midiNote: null, colors: [] })
              },
            }}
          />
        </MidiDragContextProvider>
      </MinimizedPanelsMenuContextProvider>
    </ThemeContextProvider>
  )
}

function AppPanels({
  isDark,
  themeVariables,
  trackedNotes,
  activeNoteNumbers,
  midiAssignments,
  invertColors,
  bgColor,
  materialSettings,
  lightingSettings,
  wireframeSettings,
  updateMaterial,
  updateLighting,
  updateWireframe,
  controls,
  updateControl,
  midiConfig,
  updateMidiConfig,
  colorConfig,
  updateColorConfig,
  addColor,
  removeColor,
  midiStatus,
  midiErrorMessage,
  requestMidiAccess,
  midiInputs,
  selectedInput,
  onToggleTheme,
  onInvertColorsChange,
  onBgColorChange,
  onColorChange,
  onReset,
  onSelectedInputChange,
  onAddMidiAssignment,
  onUpdateMidiAssignment,
  onClearMidiAssignments,
  onRemoveMidiAssignment,
  booleanAssignments,
  onAddBooleanAssignment,
  onUpdateBooleanAssignment,
  onRemoveBooleanAssignment,
  audioConfig,
  updateAudioConfig,
  audioDevices,
  getFrequencyData,
  permissionError,
  bgColorCycleConfig,
  updateBgColorCycleConfig,
  solidColorCycleConfig,
  updateSolidColorCycleConfig,
  colorAssignments,
  onRemoveColorAssignment,
}) {
  const settingsPanel   = usePanelManager('settings',    'Settings',     { defaultVisible: true })
  const outputPanel     = usePanelManager('output',      'Output',       { defaultVisible: true })
  const midiNotesPanel  = usePanelManager('midiNotes',   'MIDI Notes',   { defaultVisible: false })
  const audioPanel      = usePanelManager('audioInput',  'Audio Input',  { defaultVisible: false })
  const wireframePanel  = usePanelManager('wireframe',   'Wireframe',    { defaultVisible: false })
  const materialPanel   = usePanelManager('material',    'Material',     { defaultVisible: false })
  const lightingPanel   = usePanelManager('lighting',    'Lighting',     { defaultVisible: false })

  return (
    <main style={themeVariables} className={styles.componentPanels}>
      <Header
        title='MIDI Wave'
        logo={Activity}
        layoutClassName={styles.headerLayout}
        {...{ isDark, onToggleTheme }}
      />

      <Grid layoutClassName={styles.gridLayout}>
        {settingsPanel.visible && (
          <Panel
            isMinimizable
            title='Settings'
            minWidth={4}
            minHeight={9}
            onMinimize={settingsPanel.minimize}
          >
            <SettingsPanel
              onOpenWireframe={wireframePanel.open}
              onOpenMaterial={materialPanel.open}
              onOpenLighting={lightingPanel.open}
              onOpenMidiNotes={midiNotesPanel.open}
              onOpenAudioInput={audioPanel.open}
              defaultBgColor={isDark ? '#000000ff' : '#f4f4f4ff'}
              defaultMeshColor={isDark ? '#ffffff' : '#262626'}
              {...{
                controls,
                updateControl,
                midiConfig,
                updateMidiConfig,
                colorConfig,
                midiStatus,
                midiErrorMessage,
                requestMidiAccess,
                midiInputs,
                selectedInput,
                invertColors,
                bgColor,
                materialSettings,
                lightingSettings,
                midiAssignments,
                onSelectedInputChange,
                onInvertColorsChange,
                onBgColorChange,
                onReset,
                onAddMidiAssignment,
                onClearMidiAssignments,
                bgColorCycleConfig,
                updateBgColorCycleConfig,
                booleanAssignments,
                onAddBooleanAssignment,
              }}
            />
          </Panel>
        )}

        {outputPanel.visible && (
          <Panel
            isMinimizable
            title='Output'
            minWidth={8}
            minHeight={9}
            onMinimize={outputPanel.minimize}
          >
            <VisualCanvas
              {...{
                controls,
                colorConfig,
                updateControl,
                isDark,
                invertColors,
                bgColor,
                materialSettings,
                lightingSettings,
                wireframeSettings,
                getFrequencyData,
                audioConfig,
              }}
            />
          </Panel>
        )}

        {midiNotesPanel.visible && (
          <Panel
            isCloseable
            isMinimizable
            title='MIDI Notes'
            minWidth={3}
            minHeight={4}
            onClose={midiNotesPanel.close}
            onMinimize={midiNotesPanel.minimize}
          >
            <MidiNoteSettingsAssignmentPanel
              {...{
                trackedNotes,
                activeNoteNumbers,
                midiAssignments,
                onUpdateMidiAssignment,
                onRemoveMidiAssignment,
                colorAssignments,
                onRemoveColorAssignment,
                booleanAssignments,
                onUpdateBooleanAssignment,
                onRemoveBooleanAssignment
              }}
            />
          </Panel>
        )}

        {audioPanel.visible && (
          <Panel
            isCloseable
            isMinimizable
            title='Audio Input'
            minWidth={4}
            minHeight={8}
            onClose={audioPanel.close}
            onMinimize={audioPanel.minimize}
          >
            <AudioInputPanel
              {...{ audioConfig, updateAudioConfig, audioDevices, permissionError }}
            />
          </Panel>
        )}

        {wireframePanel.visible && (
          <Panel
            isCloseable
            isMinimizable
            title='Wireframe'
            minWidth={3}
            minHeight={4}
            onClose={wireframePanel.close}
            onMinimize={wireframePanel.minimize}
          >
            <WireframePanel
              {...{
                controls,
                colorConfig,
                updateColorConfig,
                addColor,
                removeColor,
                onColorChange,
                wireframeSettings,
                updateWireframe
              }}
            />
          </Panel>
        )}

        {materialPanel.visible && (
          <Panel
            isCloseable
            isMinimizable
            title='Material'
            minWidth={3}
            minHeight={4}
            onClose={materialPanel.close}
            onMinimize={materialPanel.minimize}
          >
            <MaterialPanel {...{ materialSettings, updateMaterial, solidColorCycleConfig, updateSolidColorCycleConfig }} />
          </Panel>
        )}

        {lightingPanel.visible && (
          <Panel
            isCloseable
            isMinimizable
            title='Lighting'
            minWidth={3}
            minHeight={4}
            onClose={lightingPanel.close}
            onMinimize={lightingPanel.minimize}
          >
            <LightingPanel {...{ lightingSettings, updateLighting }} />
          </Panel>
        )}
      </Grid>

      <MinimizedPanelsMenu layoutClassName={styles.minimizedMenuLayout} />
    </main>
  )
}
