'use client'

/**
 * NOA AI Assist — context provider.
 *
 * Holds the global `enabled` flag for the AI Assist hover-to-listen feature
 * and a single shared `audioRef` so only one MP3 ever plays at a time.
 * Persists the user's preference in localStorage.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

type AIAssistContextValue = {
  enabled: boolean
  toggle: () => void
  setEnabled: (v: boolean) => void
  /** Stop whatever audio is currently playing (no-op if none). */
  stopCurrent: () => void
  /**
   * Play an MP3 by id. Any previously-playing clip is stopped first so only
   * one assist audio is ever heard at a time. Silently no-ops on failures
   * (missing file, autoplay restrictions, etc.).
   */
  play: (id: string) => void
}

const AIAssistContext = createContext<AIAssistContextValue | null>(null)

const STORAGE_KEY = 'noa-ai-assist-enabled'

export function AIAssistProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabledState] = useState<boolean>(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const currentIdRef = useRef<string | null>(null)

  // Hydrate from localStorage after mount (avoids SSR hydration mismatch).
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (stored === '1') setEnabledState(true)
    } catch {
      /* localStorage unavailable — fine */
    }
  }, [])

  const persist = useCallback((v: boolean) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, v ? '1' : '0')
    } catch {
      /* ignore */
    }
  }, [])

  const stopCurrent = useCallback(() => {
    const a = audioRef.current
    if (a) {
      try {
        a.pause()
        a.currentTime = 0
      } catch {
        /* ignore */
      }
    }
    audioRef.current = null
    currentIdRef.current = null
  }, [])

  const setEnabled = useCallback(
    (v: boolean) => {
      setEnabledState(v)
      persist(v)
      if (!v) stopCurrent()
    },
    [persist, stopCurrent],
  )

  const toggle = useCallback(() => {
    setEnabled(!enabled)
  }, [enabled, setEnabled])

  const play = useCallback(
    (id: string) => {
      if (!enabled || !id) return
      // If the same clip is already playing, don't restart it.
      if (currentIdRef.current === id && audioRef.current && !audioRef.current.paused) {
        return
      }
      stopCurrent()
      try {
        const audio = new Audio(`/audio/ai-assist/${id}.mp3`)
        audio.preload = 'auto'
        audioRef.current = audio
        currentIdRef.current = id
        const result = audio.play()
        if (result && typeof result.catch === 'function') {
          result.catch(() => {
            /* missing file / autoplay blocked — silent */
          })
        }
        audio.addEventListener('ended', () => {
          if (audioRef.current === audio) {
            audioRef.current = null
            currentIdRef.current = null
          }
        })
      } catch {
        /* ignore */
      }
    },
    [enabled, stopCurrent],
  )

  // Clean up on unmount.
  useEffect(() => {
    return () => {
      stopCurrent()
    }
  }, [stopCurrent])

  const value = useMemo<AIAssistContextValue>(
    () => ({ enabled, toggle, setEnabled, stopCurrent, play }),
    [enabled, toggle, setEnabled, stopCurrent, play],
  )

  return <AIAssistContext.Provider value={value}>{children}</AIAssistContext.Provider>
}

export function useAIAssist(): AIAssistContextValue {
  const ctx = useContext(AIAssistContext)
  if (!ctx) {
    // Safe fallback: if a wrapper renders outside the provider (e.g. during
    // static prerender of an error page), behave as if AI Assist is OFF.
    return {
      enabled: false,
      toggle: () => {},
      setEnabled: () => {},
      stopCurrent: () => {},
      play: () => {},
    }
  }
  return ctx
}
