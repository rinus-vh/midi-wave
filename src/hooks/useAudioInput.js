import { useState, useEffect, useCallback } from 'react'

export function useAudioInput({ enabled, deviceId }) {
  const analyserRef = React.useRef(null)
  const sourceRef = React.useRef(null)
  const contextRef = React.useRef(null)
  const streamRef = React.useRef(null)
  const [audioDevices, setAudioDevices] = useState([])
  const [permissionError, setPermissionError] = useState(null)

  useEffect(() => {
    if (!navigator.mediaDevices?.enumerateDevices) return
    navigator.mediaDevices.enumerateDevices()
      .then(all => setAudioDevices(all.filter(d => d.kind === 'audioinput')))
      .catch(() => {})
  }, [])

  const isGetUserMediaSupported = Boolean(navigator.mediaDevices?.getUserMedia)

  useEffect(() => {
    if (!enabled) return
    if (!isGetUserMediaSupported) return

    let cancelled = false

    const constraints = {
      audio: deviceId ? { deviceId: { exact: deviceId } } : true,
      video: false,
    }

    navigator.mediaDevices.getUserMedia(constraints)
      .then(stream => {
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return }
        setPermissionError(null)

        const ctx = new AudioContext()
        const analyser = ctx.createAnalyser()
        analyser.fftSize = 2048
        analyser.smoothingTimeConstant = 0.8
        const source = ctx.createMediaStreamSource(stream)
        source.connect(analyser)

        streamRef.current = stream
        contextRef.current = ctx
        analyserRef.current = analyser
        sourceRef.current = source

        navigator.mediaDevices.enumerateDevices()
          .then(all => { if (!cancelled) setAudioDevices(all.filter(d => d.kind === 'audioinput')) })
          .catch(() => {})
      })
      .catch(err => {
        if (!cancelled) setPermissionError(err.message)
      })

    return () => {
      cancelled = true
      sourceRef.current?.disconnect()
      streamRef.current?.getTracks().forEach(t => t.stop())
      contextRef.current?.close()
      analyserRef.current = null
      sourceRef.current = null
      contextRef.current = null
      streamRef.current = null
    }
  }, [enabled, deviceId, isGetUserMediaSupported])

  const unsupportedError = enabled && !isGetUserMediaSupported ? 'getUserMedia not supported' : null

  const getFrequencyData = useCallback(() => {
    if (!analyserRef.current) return null
    const data = new Uint8Array(analyserRef.current.frequencyBinCount)
    analyserRef.current.getByteFrequencyData(data)
    return data
  }, [])

  return { audioDevices, getFrequencyData, permissionError: unsupportedError ?? permissionError }
}
