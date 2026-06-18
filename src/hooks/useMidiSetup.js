import { useState, useEffect } from 'react'

export function useMidiSetup() {
  const [midiInputs, setMidiInputs] = useState([])
  const [selectedInput, setSelectedInput] = useState(null)
  const [midiStatus, setMidiStatus] = useState('unavailable')
  const [midiErrorMessage, setMidiErrorMessage] = useState(null)

  function setupAccess(access) {
    setMidiStatus('available')

    const getInputs = () => {
      const inputs = []
      access.inputs.forEach(input => inputs.push(input))
      return inputs
    }

    const inputs = getInputs()
    setMidiInputs(inputs)
    if (inputs.length > 0) setSelectedInput(inputs[0])

    access.addEventListener('statechange', () => {
      const updated = getInputs()
      setMidiInputs(updated)
      setSelectedInput(prev => {
        if (prev && !updated.some(i => i.id === prev.id)) return null
        return prev
      })
    })
  }

  useEffect(() => {
    if (!('requestMIDIAccess' in navigator)) return
    // On initial load, silently fail — modal is only shown on explicit user action
    navigator.requestMIDIAccess().then(setupAccess).catch(() => {
      setMidiStatus('unavailable')
    })
  }, [])

  function requestMidiAccess() {
    if (!('requestMIDIAccess' in navigator)) return
    setMidiErrorMessage(null)
    navigator.requestMIDIAccess().then(setupAccess).catch(err => {
      setMidiStatus('unavailable')
      setMidiErrorMessage(err?.message ?? 'MIDI access was denied.')
    })
  }

  function handleSelectedInputChange(input) {
    setSelectedInput(input)
  }

  return { midiInputs, selectedInput, handleSelectedInputChange, midiStatus, midiErrorMessage, requestMidiAccess }
}
