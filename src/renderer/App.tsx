import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Feather, Hammer, Plane, Shield, Sun, GraduationCap, Volume2, VolumeX
} from 'lucide-react'
import { useAppStore } from './lib/stores/app'
import type { ViewId } from './lib/types'
import BootSequence from './components/BootSequence'
import WaxParticles from './components/WaxParticles'
import WingsView from './components/WingsView'
import ForgeView from './components/ForgeView'
import FlightView from './components/FlightView'
import WaxView from './components/WaxView'
import SunView from './components/SunView'
import AcademyView from './components/academy/AcademyView'

const NAV_ITEMS: { id: ViewId; icon: typeof Feather; label: string; fullLabel: string }[] = [
  { id: 'wings', icon: Feather, label: 'WINGS', fullLabel: 'Script Library' },
  { id: 'forge', icon: Hammer, label: 'FORGE', fullLabel: 'Payload Builder' },
  { id: 'flight', icon: Plane, label: 'FLIGHT', fullLabel: 'Simulator' },
  { id: 'wax', icon: Shield, label: 'WAX', fullLabel: 'Encoder' },
  { id: 'sun', icon: Sun, label: 'SUN', fullLabel: 'Target Config' },
  { id: 'academy', icon: GraduationCap, label: 'ACADEMY', fullLabel: 'Training' },
]

function Sidebar() {
  const { activeView, setActiveView, soundEnabled, toggleSound } = useAppStore()

  return (
    <div className="w-16 h-full flex flex-col items-center py-4 border-r border-gold-muted/20 bg-bg-surface/50 backdrop-blur-sm">
      {/* Logo */}
      <div className="mb-6 relative group">
        <Feather className="w-8 h-8 text-gold glow-text" />
        <div className="absolute left-full ml-3 px-2 py-1 bg-bg-raised border border-gold-muted/30 rounded text-xs font-display text-gold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
          ICARUS
        </div>
      </div>

      {/* Nav Items */}
      <div className="flex-1 flex flex-col gap-1">
        {NAV_ITEMS.map(({ id, icon: Icon, label, fullLabel }, index) => {
          const isActive = activeView === id
          return (
            <motion.div
              key={id}
              className="relative group"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.08, duration: 0.3 }}
            >
              <motion.button
                whileHover={{ scale: 1.1, boxShadow: '0 0 12px rgba(234,179,8,0.15)' }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setActiveView(id)}
                className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all relative ${
                  isActive
                    ? 'text-gold bg-gold/10'
                    : 'text-text-tertiary hover:text-gold hover:bg-gold/5'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-gold rounded-r"
                    style={{
                      boxShadow: '0 0 8px rgba(234,179,8,0.6), 0 0 16px rgba(234,179,8,0.3)'
                    }}
                  />
                )}
                <Icon className="w-5 h-5" />
                {isActive && (
                  <div className="absolute inset-0 rounded-lg" style={{
                    boxShadow: '0 0 12px rgba(234,179,8,0.1) inset'
                  }} />
                )}
              </motion.button>
              {/* Tooltip */}
              <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2 py-1 bg-bg-raised border border-gold-muted/30 rounded text-xs font-display text-text-secondary whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                {label} <span className="text-text-tertiary ml-1 text-[10px]">{fullLabel}</span>
                <span className="text-text-tertiary ml-2 text-[10px]">Alt+{index + 1}</span>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Sound toggle */}
      <button
        onClick={toggleSound}
        className="w-10 h-10 rounded-lg flex items-center justify-center text-text-tertiary hover:text-gold transition-colors"
        title={soundEnabled ? 'Mute' : 'Unmute'}
      >
        {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
      </button>

      {/* Version */}
      <div className="mt-2 text-[9px] font-mono text-text-tertiary/30">v1.0.0</div>
    </div>
  )
}

function ViewRenderer({ view }: { view: ViewId }) {
  switch (view) {
    case 'wings': return <WingsView />
    case 'forge': return <ForgeView />
    case 'flight': return <FlightView />
    case 'wax': return <WaxView />
    case 'sun': return <SunView />
    case 'academy': return <AcademyView />
  }
}

export default function App() {
  const [booted, setBooted] = useState(false)
  const { activeView, setActiveView } = useAppStore()

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.altKey) {
        const num = parseInt(e.key)
        if (num >= 1 && num <= 6) {
          const views: ViewId[] = ['wings', 'forge', 'flight', 'wax', 'sun', 'academy']
          setActiveView(views[num - 1])
        }
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [setActiveView])

  if (!booted) return <BootSequence onComplete={() => setBooted(true)} />

  return (
    <div className="w-full h-full flex" style={{ background: '#0A0800' }}>
      <WaxParticles />
      <Sidebar />
      <main className="flex-1 h-full overflow-hidden relative" style={{ zIndex: 1 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            className="w-full h-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <ViewRenderer view={activeView} />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}
