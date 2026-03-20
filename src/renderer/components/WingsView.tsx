import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Copy, Download, Hammer, X, Monitor, Apple, Terminal, AlertTriangle, Shield, ChevronDown } from 'lucide-react'
import { DUCKY_SCRIPTS } from '../lib/duckyScripts'
import { useAppStore } from '../lib/stores/app'
import type { DuckyScript } from '../lib/types'

const CATEGORIES = [
  { id: 'all', label: 'ALL', color: '#EAB308' },
  { id: 'recon', label: 'RECON', color: '#3B82F6' },
  { id: 'credentials', label: 'CREDENTIALS', color: '#EF4444' },
  { id: 'reverse-shells', label: 'REVERSE SHELLS', color: '#8B5CF6' },
  { id: 'persistence', label: 'PERSISTENCE', color: '#F97316' },
  { id: 'exfiltration', label: 'EXFILTRATION', color: '#EC4899' },
  { id: 'network', label: 'NETWORK', color: '#06B6D4' },
  { id: 'evasion', label: 'EVASION', color: '#10B981' },
  { id: 'pranks', label: 'PRANKS', color: '#FACC15' }
]

const RISK_COLORS: Record<string, string> = {
  low: '#4ADE80',
  medium: '#FACC15',
  high: '#FB923C',
  critical: '#EF4444'
}

const FORMAT_FILTERS = [
  { id: 'all', label: 'ALL' },
  { id: 'ducky', label: 'DUCKY' },
  { id: 'flipper', label: 'FLIPPER' },
]

const OS_ICONS: Record<string, typeof Monitor> = {
  windows: Monitor,
  macos: Apple,
  linux: Terminal
}

function highlightDucky(code: string): JSX.Element[] {
  return code.split('\n').map((line, i) => {
    const trimmed = line.trimStart()
    let className = ''
    if (trimmed.startsWith('REM ')) className = 'ducky-comment'
    else if (trimmed.startsWith('STRING ')) className = 'ducky-string'
    else if (trimmed.startsWith('WAIT_FOR_BUTTON_PRESS')) className = 'ducky-flipper'
    else if (trimmed.startsWith('DEFAULT_DELAY ') || trimmed.startsWith('STRINGDELAY ') || trimmed.startsWith('STRING_DELAY ')) className = 'ducky-flipper'
    else if (/^(HOLD|RELEASE)\s/.test(trimmed) || trimmed === 'HOLD' || trimmed === 'RELEASE') className = 'ducky-flipper'
    else if (/^(ALTCHAR|ALTSTRING|ALTCODE|SYSRQ)\s/.test(trimmed)) className = 'ducky-flipper'
    else if (trimmed.startsWith('DELAY ')) className = 'ducky-delay'
    else if (/^(GUI|WINDOWS|ALT|CTRL|CONTROL|SHIFT|ENTER|TAB|ESCAPE|ESC|CAPSLOCK|DELETE|BACKSPACE|SPACE|MENU|F\d+|REPEAT|DOWNARROW|UPARROW|LEFTARROW|RIGHTARROW|UP|DOWN|LEFT|RIGHT|HOME|END|INSERT|PAGEUP|PAGEDOWN|PRINTSCREEN|NUMLOCK|SCROLLLOCK|PAUSE|BREAK)/.test(trimmed)) className = 'ducky-command'

    return (
      <div key={i} className="flex">
        <span className="inline-block w-8 text-right mr-3 text-text-tertiary/50 select-none text-xs">{i + 1}</span>
        <span className={className}>{line || '\u00A0'}</span>
      </div>
    )
  })
}

export default function WingsView() {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [activeFormat, setActiveFormat] = useState('all')
  const [selectedScript, setSelectedScript] = useState<DuckyScript | null>(null)
  const [copyFeedback, setCopyFeedback] = useState(false)
  const { setActiveView, setForgeScript } = useAppStore()

  const filtered = useMemo(() => {
    let scripts = DUCKY_SCRIPTS
    if (activeCategory !== 'all') {
      scripts = scripts.filter(s => s.category === activeCategory)
    }
    if (activeFormat === 'flipper') {
      scripts = scripts.filter(s => s.format === 'flipper' || s.flipperCompat)
    } else if (activeFormat === 'ducky') {
      scripts = scripts.filter(s => s.format === 'ducky')
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      scripts = scripts.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q)
      )
    }
    return scripts
  }, [search, activeCategory, activeFormat])

  const handleCopy = async (script: string) => {
    try {
      await window.icarus.copyToClipboard(script)
    } catch {
      await navigator.clipboard.writeText(script)
    }
    setCopyFeedback(true)
    setTimeout(() => setCopyFeedback(false), 1500)
  }

  const handleDownload = async (script: DuckyScript) => {
    try {
      await window.icarus.saveFile(script.script, `${script.id}.txt`)
    } catch {
      // Fallback: create blob download
      const blob = new Blob([script.script], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${script.id}.txt`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  const handleSendToForge = (script: DuckyScript) => {
    setForgeScript(script.script)
    setActiveView('forge')
  }

  const catColor = (cat: string) => CATEGORIES.find(c => c.id === cat)?.color || '#EAB308'

  return (
    <div className="h-full flex">
      {/* Category sidebar */}
      <div className="w-48 h-full border-r border-gold-muted/20 bg-bg-surface/50 p-3 flex flex-col gap-1 overflow-y-auto flex-shrink-0">
        <h2 className="font-display text-xs text-gold tracking-wider mb-2 glow-text">CATEGORIES</h2>
        {CATEGORIES.map((cat, idx) => (
          <motion.button
            key={cat.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.04 }}
            onClick={() => setActiveCategory(cat.id)}
            className={`w-full text-left px-3 py-2 rounded-md text-xs font-mono transition-all flex items-center gap-2 ${
              activeCategory === cat.id
                ? 'bg-gold/10 text-gold'
                : 'text-text-tertiary hover:text-text-secondary hover:bg-gold/5'
            }`}
          >
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: cat.color, boxShadow: activeCategory === cat.id ? `0 0 6px ${cat.color}` : 'none' }}
            />
            {cat.label}
            <span className="ml-auto text-text-tertiary/50">
              {cat.id === 'all' ? DUCKY_SCRIPTS.length : DUCKY_SCRIPTS.filter(s => s.category === cat.id).length}
            </span>
          </motion.button>
        ))}
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gold-muted/20 flex items-center gap-3">
          <Shield className="w-5 h-5 text-gold" />
          <h1 className="font-display text-lg text-gold glow-text tracking-wider">WINGS</h1>
          <span className="text-xs text-text-tertiary font-mono">Script Library</span>
          <div className="flex items-center gap-1 ml-4">
            {FORMAT_FILTERS.map(f => (
              <button
                key={f.id}
                onClick={() => setActiveFormat(f.id)}
                className={`px-3 py-1 text-[10px] font-display rounded-md border transition-all ${
                  activeFormat === f.id
                    ? f.id === 'flipper'
                      ? 'bg-orange-500/20 border-orange-500/40 text-orange-400'
                      : f.id === 'ducky'
                        ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400'
                        : 'bg-gold/10 border-gold/30 text-gold'
                    : 'border-gold-muted/20 text-text-tertiary hover:text-text-secondary hover:border-gold-muted/30'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="flex-1" />
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search scripts..."
              className="pl-9 pr-4 py-2 bg-bg-void/50 border border-gold-muted/20 rounded-lg text-sm font-mono text-text-primary w-64 placeholder:text-text-tertiary/50"
            />
          </div>
          <span className="text-xs font-mono text-text-tertiary">{filtered.length} scripts</span>
        </div>

        {/* Script grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
            {filtered.map((script, idx) => (
              <motion.button
                key={script.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(idx * 0.03, 0.5) }}
                whileHover={{ scale: 1.02, boxShadow: `0 0 16px ${catColor(script.category)}20` }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedScript(script)}
                className="glass-panel p-4 text-left cursor-pointer hover:border-gold/20 transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-display text-xs text-text-primary leading-tight pr-2">{script.name}</h3>
                  <span
                    className="text-[10px] font-mono px-1.5 py-0.5 rounded flex-shrink-0"
                    style={{
                      color: RISK_COLORS[script.riskLevel],
                      border: `1px solid ${RISK_COLORS[script.riskLevel]}40`,
                      background: `${RISK_COLORS[script.riskLevel]}10`
                    }}
                  >
                    {script.riskLevel.toUpperCase()}
                  </span>
                </div>
                <p className="text-[11px] text-text-tertiary font-body line-clamp-2 mb-3">{script.description}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                    style={{ color: catColor(script.category), border: `1px solid ${catColor(script.category)}30` }}
                  >
                    {script.category}
                  </span>
                  {script.format === 'flipper' && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded text-orange-400 border border-orange-400/30 bg-orange-400/10">
                      FLIPPER
                    </span>
                  )}
                  {script.format === 'ducky' && script.flipperCompat && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded text-green-400 border border-green-400/30 bg-green-400/10">
                      FLIPPER OK
                    </span>
                  )}
                  <div className="flex gap-1 ml-auto">
                    {script.targetOS.map(os => {
                      const Icon = OS_ICONS[os] || Terminal
                      return <Icon key={os} className="w-3 h-3 text-text-tertiary" title={os} />
                    })}
                  </div>
                  <span className="text-[10px] text-text-tertiary font-mono">{script.executionTime}</span>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Script detail modal */}
      <AnimatePresence>
        {selectedScript && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-8"
            onClick={() => setSelectedScript(null)}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="glass-panel-bright relative w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="p-5 border-b border-gold-muted/20 flex items-start gap-4">
                <div className="flex-1">
                  <h2 className="font-display text-lg text-gold glow-text">{selectedScript.name}</h2>
                  <p className="text-sm text-text-secondary font-body mt-1">{selectedScript.description}</p>
                  <div className="flex items-center gap-3 mt-3">
                    <span
                      className="text-xs font-mono px-2 py-0.5 rounded"
                      style={{ color: catColor(selectedScript.category), border: `1px solid ${catColor(selectedScript.category)}40` }}
                    >
                      {selectedScript.category}
                    </span>
                    <span
                      className="text-xs font-mono px-2 py-0.5 rounded"
                      style={{ color: RISK_COLORS[selectedScript.riskLevel], border: `1px solid ${RISK_COLORS[selectedScript.riskLevel]}40` }}
                    >
                      {selectedScript.riskLevel}
                    </span>
                    <div className="flex items-center gap-1">
                      {selectedScript.targetOS.map(os => (
                        <span key={os} className="text-xs font-mono text-text-tertiary px-1.5 py-0.5 bg-bg-void/50 rounded">{os}</span>
                      ))}
                    </div>
                    {selectedScript.format === 'flipper' && (
                      <span className="text-xs font-mono px-2 py-0.5 rounded text-orange-400 border border-orange-400/40 bg-orange-400/10">
                        FLIPPER ZERO
                      </span>
                    )}
                    {selectedScript.format === 'ducky' && selectedScript.flipperCompat && (
                      <span className="text-xs font-mono px-2 py-0.5 rounded text-green-400 border border-green-400/40 bg-green-400/10">
                        FLIPPER COMPAT
                      </span>
                    )}
                    <span className="text-xs font-mono text-text-tertiary">{selectedScript.executionTime}</span>
                    <span className="text-xs font-mono text-text-tertiary">Detection: {selectedScript.detectionDifficulty}</span>
                  </div>
                </div>
                <button onClick={() => setSelectedScript(null)} className="text-text-tertiary hover:text-text-primary p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Script code */}
              <div className="flex-1 overflow-y-auto p-5">
                <div className="bg-bg-void rounded-lg border border-gold-muted/10 p-4 font-mono text-xs leading-relaxed overflow-x-auto">
                  {highlightDucky(selectedScript.script)}
                </div>
                {selectedScript.notes && (
                  <div className="mt-3 flex items-start gap-2 p-3 bg-gold/5 border border-gold/10 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-text-secondary font-body">{selectedScript.notes}</p>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="p-4 border-t border-gold-muted/20 flex items-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleCopy(selectedScript.script)}
                  className="flex items-center gap-2 px-4 py-2 bg-gold/10 border border-gold/30 rounded-lg text-gold text-xs font-display hover:bg-gold/20 transition-all"
                >
                  <Copy className="w-4 h-4" />
                  {copyFeedback ? 'COPIED!' : 'COPY'}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleDownload(selectedScript)}
                  className="flex items-center gap-2 px-4 py-2 bg-gold/10 border border-gold/30 rounded-lg text-gold text-xs font-display hover:bg-gold/20 transition-all"
                >
                  <Download className="w-4 h-4" />
                  DOWNLOAD
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { handleSendToForge(selectedScript); setSelectedScript(null) }}
                  className="flex items-center gap-2 px-4 py-2 bg-gold/20 border border-gold/40 rounded-lg text-gold-bright text-xs font-display hover:bg-gold/30 transition-all gold-glow-border"
                >
                  <Hammer className="w-4 h-4" />
                  SEND TO FORGE
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
