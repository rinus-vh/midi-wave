import { Grid, Header, Panel } from '@6njp/prototype-library'
import { getThemeVariables } from '@6njp/prototype-library/machinery'

import { ControlsOverview } from '@/pages/ControlsOverview/ControlsOverview.jsx'
import { DesignOverview } from '@/pages/DesignOverview/DesignOverview.jsx'

import styles from './App.module.css'

export default function App() {
  const [isDark, setIsDark] = React.useState(true)
  const themeName = isDark ? 'dark' : 'light'
  const themeVariables = getThemeVariables(themeName)

  return (
    <main style={themeVariables} className={styles.app}>
      <Header onToggleTheme={() => setIsDark(d => !d)} layoutClassName={styles.headerLayout} {...{ isDark }} />

      <Grid layoutClassName={styles.gridLayout}>
        <Panel
          title='Design'
          minWidth={8}
          minHeight={8}
        >
          <DesignOverview />
        </Panel>

        <Panel
          title='Controls'
          minWidth={8}
          minHeight={8}
        >
          <ControlsOverview />
        </Panel>

        <Panel
          title='Prototype'
          minWidth={6}
          minHeight={7}
        />
      </Grid>
    </main>
  )
}
