import { useState, useEffect } from 'react'

export function useMidiSetup() {
  const [midiInputs, setMidiInputs] = useState([])
  const [selectedInput, setSelectedInput] = useState(null)
  const [midiStatus, setMidiStatus] = useState('unavailable')

  useEffect(() => {
    if (!('requestMIDIAccess' in navigator)) return

    navigator.requestMIDIAccess().then(access => {
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
    }).catch(() => {
      setMidiStatus('unavailable')
    })
  }, [])

  function handleSelectedInputChange(input) {
    setSelectedInput(input)
  }

  return { midiInputs, selectedInput, handleSelectedInputChange, midiStatus }
}
