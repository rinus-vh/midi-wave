const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const BLACK_KEY_INDICES = new Set([1, 3, 6, 8, 10])

export function midiNoteToName(noteNumber) {
  const octave = Math.floor(noteNumber / 12) - 1
  return NOTE_NAMES[noteNumber % 12] + octave
}

export function isBlackKey(noteNumber) {
  return BLACK_KEY_INDICES.has(noteNumber % 12)
}
