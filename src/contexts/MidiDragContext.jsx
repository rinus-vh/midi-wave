const MidiDragContext = React.createContext(null)

export { MidiDragContext }

export function MidiDragContextProvider({ children }) {
  const draggedNoteRef = React.useRef(null)

  const setDraggedNote = React.useCallback((noteNumber) => {
    draggedNoteRef.current = noteNumber
  }, [])

  const getDraggedNote = React.useCallback(() => draggedNoteRef.current, [])

  const value = React.useMemo(() => ({ setDraggedNote, getDraggedNote }), [setDraggedNote, getDraggedNote])

  return (
    <MidiDragContext.Provider {...{ value }}>
      {children}
    </MidiDragContext.Provider>
  )
}
