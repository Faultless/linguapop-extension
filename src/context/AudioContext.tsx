import { createContext, useContext, useRef, useState, useCallback, type ReactNode } from 'react'
import type { Resource } from '../data/types'

interface Track {
  url: string
  title: string
}

interface AudioState {
  resource: Resource | null
  track: Track | null
  isPlaying: boolean
  isLoading: boolean
  currentTime: number
  duration: number
  speed: number
  play: (resource: Resource, track: Track) => void
  togglePlay: () => void
  seek: (t: number) => void
  setSpeed: (s: number) => void
  stop: () => void
}

const Ctx = createContext<AudioState | null>(null)

export function AudioProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [resource, setResource] = useState<Resource | null>(null)
  const [track, setTrack] = useState<Track | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [speed, setSpeedState] = useState(1)

  const getOrCreateAudio = useCallback(() => {
    if (!audioRef.current) {
      const el = new Audio()
      el.addEventListener('timeupdate', () => setCurrentTime(el.currentTime))
      el.addEventListener('durationchange', () => setDuration(el.duration || 0))
      el.addEventListener('playing', () => { setIsPlaying(true); setIsLoading(false) })
      el.addEventListener('pause', () => setIsPlaying(false))
      el.addEventListener('waiting', () => setIsLoading(true))
      el.addEventListener('ended', () => { setIsPlaying(false); setCurrentTime(0) })
      audioRef.current = el
    }
    return audioRef.current
  }, [])

  const play = useCallback((res: Resource, tr: Track) => {
    const el = getOrCreateAudio()
    el.src = tr.url
    el.playbackRate = speed
    setResource(res)
    setTrack(tr)
    setCurrentTime(0)
    setDuration(0)
    setIsLoading(true)
    el.play().catch(() => setIsLoading(false))
  }, [getOrCreateAudio, speed])

  const togglePlay = useCallback(() => {
    const el = audioRef.current
    if (!el) return
    if (el.paused) el.play().catch(() => {})
    else el.pause()
  }, [])

  const seek = useCallback((t: number) => {
    const el = audioRef.current
    if (el && isFinite(t)) { el.currentTime = t; setCurrentTime(t) }
  }, [])

  const setSpeed = useCallback((s: number) => {
    setSpeedState(s)
    if (audioRef.current) audioRef.current.playbackRate = s
  }, [])

  const stop = useCallback(() => {
    const el = audioRef.current
    if (el) { el.pause(); el.src = '' }
    setResource(null); setTrack(null)
    setIsPlaying(false); setCurrentTime(0); setDuration(0)
  }, [])

  return (
    <Ctx.Provider value={{ resource, track, isPlaying, isLoading, currentTime, duration, speed, play, togglePlay, seek, setSpeed, stop }}>
      {children}
    </Ctx.Provider>
  )
}

export const useAudio = () => {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAudio must be used inside AudioProvider')
  return ctx
}
