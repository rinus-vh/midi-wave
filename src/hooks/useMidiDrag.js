import { MidiDragContext } from '@/contexts/MidiDragContext.jsx'

export function useMidiDrag() {
  const ctx = React.useContext(MidiDragContext)
  if (!ctx) throw new Error('useMidiDrag must be used inside MidiDragContextProvider')
  return ctx
}
