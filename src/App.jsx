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

import { LightingPanel } from '@/components/LightingPanel/LightingPanel.jsx'
import { MaterialPanel } from '@/components/MaterialPanel/MaterialPanel.jsx'
import { SettingsPanel } from '@/components/SettingsPanel/SettingsPanel.jsx'
import { VisualCanvas } from '@/components/VisualCanvas/VisualCanvas.jsx'
import { WireframePanel } from '@/components/WireframePanel/WireframePanel.jsx'
import { LIGHTING_DEFAULTS, MATERIAL_DEFAULTS, SCENE_DEFAULTS, WIREFRAME_DEFAULTS } from '@/constants/defaults.js'
import { useAnimationControls } from '@/hooks/useAnimationControls.js'
import { useMidiSetup } from '@/hooks/useMidiSetup.js'

import styles from './App.module.css'

export default function App() {
  const [isDark, setIsDark] = React.useState(true)
  const [midiNotes, setMidiNotes] = React.useState([])
  const noteIdRef = React.useRef(0)
  const [showMidiHistory, setShowMidiHistory] = React.useState(SCENE_DEFAULTS.showTimeline)
  const [invertColors, setInvertColors] = React.useState(SCENE_DEFAULTS.invertColors)
  const [bgColor, setBgColor] = React.useState(SCENE_DEFAULTS.bgColor)
  const [userHasChosenBgColor, setUserHasChosenBgColor] = React.useState(false)
  const [materialSettings, setMaterialSettings] = React.useState(MATERIAL_DEFAULTS)
  const [lightingSettings, setLightingSettings] = React.useState(LIGHTING_DEFAULTS)
  const [wireframeSettings, setWireframeSettings] = React.useState(WIREFRAME_DEFAULTS)
  const [userHasChosenColor, setUserHasChosenColor] = React.useState(false)

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
    if (userHasChosenColor) return
    updateControl('color', isDark ? (0xf4f4f4 / 0xFFFFFF) * 100 : (0x262626 / 0xFFFFFF) * 100)
  }, [isDark, updateControl, userHasChosenColor])

  React.useEffect(() => {
    if (userHasChosenBgColor) return
    setBgColor(isDark ? '#000000ff' : '#f4f4f4ff')
  }, [isDark, userHasChosenBgColor])

  React.useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now()
      setMidiNotes(prev => prev.filter(n => now - n.timestamp < 1000))
    }, 100)
    return () => clearInterval(id)
  }, [])

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
    setShowMidiHistory(SCENE_DEFAULTS.showTimeline)
    setInvertColors(SCENE_DEFAULTS.invertColors)
  }, [isDark, resetControls, resetColorConfig])

  const updateMaterial = React.useCallback((patch) => setMaterialSettings(prev => ({ ...prev, ...patch })), [])
  const updateLighting = React.useCallback((patch) => setLightingSettings(prev => ({ ...prev, ...patch })), [])
  const updateWireframe = React.useCallback((patch) => setWireframeSettings(prev => ({ ...prev, ...patch })), [])

  const themeVariables = getThemeVariables(isDark ? 'dark' : 'light')

  return (
    <ThemeContextProvider theme={isDark ? 'dark' : 'light'}>
      <MinimizedPanelsMenuContextProvider>
        <AppPanels
          onToggleTheme={() => setIsDark(d => !d)}
          onShowMidiHistoryChange={setShowMidiHistory}
          onInvertColorsChange={setInvertColors}
          onBgColorChange={(color) => { setUserHasChosenBgColor(true); setBgColor(color) }}
          onColorChange={handleUserColorChange}
          onReset={handleReset}
          onSelectedInputChange={handleSelectedInputChange}
          {...{
            isDark,
            themeVariables,
            midiNotes,
            showMidiHistory,
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
            midiInputs,
            selectedInput,
          }}
        />
      </MinimizedPanelsMenuContextProvider>
    </ThemeContextProvider>
  )
}

function AppPanels({
  isDark,
  themeVariables,
  midiNotes,
  showMidiHistory,
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
  midiInputs,
  selectedInput,
  onToggleTheme,
  onShowMidiHistoryChange,
  onInvertColorsChange,
  onBgColorChange,
  onColorChange,
  onReset,
  onSelectedInputChange,
}) {
  const settingsPanel  = usePanelManager('settings',  'Settings',  { defaultVisible: true })
  const outputPanel    = usePanelManager('output',    'Output',    { defaultVisible: true })
  const wireframePanel = usePanelManager('wireframe', 'Wireframe', { defaultVisible: false })
  const materialPanel  = usePanelManager('material',  'Material',  { defaultVisible: false })
  const lightingPanel  = usePanelManager('lighting',  'Lighting',  { defaultVisible: false })

  return (
    <main style={themeVariables} className={styles.componentPanels}>
      <Header
        title='MIDI Wave'
        logo={Activity}
        layoutClassName={styles.headerLayout}
        {...{ isDark, onToggleTheme }}
      />

      <Grid layoutClassName={styles.gridLayout}>
        {settingsPanel.visible && <Panel title='Settings' minWidth={4} minHeight={9} isMinimizable onMinimize={settingsPanel.minimize}>
          <SettingsPanel
            onOpenWireframe={wireframePanel.open}
            onOpenMaterial={materialPanel.open}
            onOpenLighting={lightingPanel.open}
            {...{
              controls,
              updateControl,
              midiConfig,
              updateMidiConfig,
              colorConfig,
              midiStatus,
              midiInputs,
              selectedInput,
              showMidiHistory,
              invertColors,
              bgColor,
              materialSettings,
              lightingSettings,
              onSelectedInputChange,
              onShowMidiHistoryChange,
              onInvertColorsChange,
              onBgColorChange,
              onReset,
            }}
          />
        </Panel>}

        {outputPanel.visible && <Panel title='Output' minWidth={12} minHeight={9} isMinimizable onMinimize={outputPanel.minimize}>
          <VisualCanvas
            showTimeline={showMidiHistory}
            {...{
              controls,
              colorConfig,
              updateControl,
              isDark,
              midiNotes,
              invertColors,
              bgColor,
              materialSettings,
              lightingSettings,
              wireframeSettings,
            }}
          />
        </Panel>}

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
              {...{ controls, colorConfig, updateColorConfig, addColor, removeColor, onColorChange, wireframeSettings, updateWireframe }}
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
            <MaterialPanel {...{ materialSettings, updateMaterial }} />
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
