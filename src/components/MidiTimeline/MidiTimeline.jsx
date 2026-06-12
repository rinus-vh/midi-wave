import styles from './MidiTimeline.module.css'

export function MidiTimeline({ midiNotes, layoutClassName }) {
  const [, forceUpdate] = React.useReducer(n => n + 1, 0)

  // Run a rAF loop while there are active notes so opacity animates at 60fps.
  React.useEffect(() => {
    if (!midiNotes.length) return
    let id = requestAnimationFrame(function loop() {
      forceUpdate()
      id = requestAnimationFrame(loop)
    })
    return () => cancelAnimationFrame(id)
  }, [midiNotes.length > 0])

  const now = Date.now()
  const activeNotes = midiNotes.filter(n => now - n.timestamp < 1000)

  if (!activeNotes.length) return null

  return (
    <div className={cx(styles.component, layoutClassName)}>
      {activeNotes.map(note => {
        const opacity = Math.max(0, 1 - (Date.now() - note.timestamp) / 1000)

        return (
          <div
            key={note.id}
            className={styles.note}
            style={{ opacity, transform: `scale(${Math.max(0.5, opacity)})` }}
          >
            {note.value}
          </div>
        )
      })}
    </div>
  )
}
