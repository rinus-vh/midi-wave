import { ContextMenu, LabelSm } from '@6njp/prototype-library'

import { PARAM_CONTROLS } from '@/constants/defaults.js'
import { useMidiDrag } from '@/hooks/useMidiDrag.js'
import { isBlackKey } from '@/utils/midiNoteNames.js'

import styles from './MidiNoteSettingsAssignmentPanel.module.css'

const PARAM_LABEL = Object.fromEntries(PARAM_CONTROLS.map(({ key, label }) => [key, label]))

export function MidiNoteSettingsAssignmentPanel({
  trackedNotes,
  activeNoteNumbers,
  midiAssignments = {},
  onUpdateMidiAssignment,
  onRemoveMidiAssignment,
}) {
  if (trackedNotes.length === 0) {
    return (
      <div className={styles.component_root}>
        <div className={styles.emptyState}>
          <LabelSm>Play MIDI notes to see them here</LabelSm>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.component_root}>
      {[...trackedNotes].sort((a, b) => a.noteName.localeCompare(b.noteName)).map(note => {
        const assignments = Object.entries(midiAssignments)
          .filter(([, arr]) => arr.some(a => a.noteNumber === note.noteNumber))
          .map(([key, arr]) => ({
            key,
            chance: arr.find(a => a.noteNumber === note.noteNumber).chance,
          }))

        return (
          <NoteRow
            key={note.noteNumber}
            isActive={activeNoteNumbers.has(note.noteNumber)}
            {...{ note, assignments, onUpdateMidiAssignment, onRemoveMidiAssignment }}
          />
        )
      })}
    </div>
  )
}

function NoteRow({ note, isActive, assignments, onUpdateMidiAssignment, onRemoveMidiAssignment }) {
  const { setDraggedNote } = useMidiDrag()
  const black = isBlackKey(note.noteNumber)

  return (
    <div
      draggable
      data-active={isActive || undefined}
      onDragStart={e => {
        e.dataTransfer.effectAllowed = 'copy'
        e.dataTransfer.setData('text/plain', note.noteName)
        setDraggedNote(note.noteNumber)
      }}
      onDragEnd={() => setDraggedNote(null)}
      className={styles.componentNoteRow}
    >
      <div className={cx(styles.keyIndicator, black && styles.isBlackKey)} />
      <LabelSm layoutClassName={styles.noteNameLayout}>{note.noteName}</LabelSm>

      <div className={styles.assignmentBars}>
        {assignments.map(({ key, chance }) => (
          <AssignmentBar
            key={key}
            settingKey={key}
            noteNumber={note.noteNumber}
            onUpdate={(newChance) => onUpdateMidiAssignment(key, note.noteNumber, newChance)}
            onRemove={() => onRemoveMidiAssignment(key, note.noteNumber)}
            {...{ chance }}
          />
        ))}
      </div>
    </div>
  )
}

function AssignmentBar({ settingKey, chance, onUpdate, onRemove }) {
  const dragRef = React.useRef(null)
  const [contextMenu, setContextMenu] = React.useState({ open: false, x: 0, y: 0 })

  function handlePointerDown(e) {
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = { startY: e.clientY, startChance: chance }
  }

  function handlePointerMove(e) {
    if (!dragRef.current || !e.buttons) return
    const delta = (dragRef.current.startY - e.clientY) / 80
    onUpdate(Math.max(0, Math.min(1, dragRef.current.startChance + delta)))
  }

  function handlePointerUp() {
    dragRef.current = null
  }

  const showPercent = chance < 1
  const label = PARAM_LABEL[settingKey] ?? settingKey

  return (
    <>
      <div
        style={{ '--bar-fill': chance }}
        title={`${label} — ${Math.round(chance * 100)}% chance`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onContextMenu={e => { e.preventDefault(); e.stopPropagation(); setContextMenu({ open: true, x: e.clientX, y: e.clientY }) }}
        className={styles.assignmentBar}
      >
        <div className={styles.barFill} />
        <span className={styles.barLabel}>{label}</span>
        {showPercent && <span className={styles.barPercent}>{Math.round(chance * 100)}%</span>}
      </div>

      <ContextMenu
        isOpen={contextMenu.open}
        x={contextMenu.x}
        y={contextMenu.y}
        onClose={() => setContextMenu(prev => ({ ...prev, open: false }))}
        items={[{ label: 'Remove assignment', onClick: onRemove }]}
      />
    </>
  )
}
