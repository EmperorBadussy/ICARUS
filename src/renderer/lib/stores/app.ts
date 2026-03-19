import { create } from 'zustand'
import type { ViewId } from '../types'

interface AppState {
  activeView: ViewId
  setActiveView: (view: ViewId) => void
  soundEnabled: boolean
  toggleSound: () => void
  forgeScript: string
  setForgeScript: (script: string) => void
}

export const useAppStore = create<AppState>((set) => ({
  activeView: 'wings',
  setActiveView: (view) => set({ activeView: view }),
  soundEnabled: true,
  toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),
  forgeScript: '',
  setForgeScript: (script) => set({ forgeScript: script })
}))
