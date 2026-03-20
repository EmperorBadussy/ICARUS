import { useState, useMemo, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Usb, Trash2, CheckCircle, XCircle, ChevronRight, RefreshCw,
  HardDrive, File, FolderOpen, Monitor, Apple, Terminal, Zap
} from 'lucide-react'
import { DUCKY_SCRIPTS } from '../lib/duckyScripts'
import { useAppStore } from '../lib/stores/app'
import { playOkBeep, playWarnTone } from '../lib/bootAudio'
import type { DuckyScript, FlipperDevice, DeployedPayload } from '../lib/types'

const CATEGORIES = [
  { id: 'all', label: 'ALL', color: '#EAB308' },
  { id: 'recon', label: 'RECON', color: '#3B82F6' },
  { id: 'credentials', label: 'CREDENTIALS', color: '#EF4444' },
  { id: 'reverse-shells', label: 'REV SHELLS', color: '#8B5CF6' },
  { id: 'persistence', label: 'PERSISTENCE', color: '#F97316' },
  { id: 'exfiltration', label: 'EXFIL', color: '#EC4899' },
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

const OS_ICONS: Record<string, typeof Monitor> = {
  windows: Monitor,
  macos: Apple,
  linux: Terminal
}

const FORMAT_FILTERS = [
  { id: 'all', label: 'ALL' },
  { id: 'ducky', label: 'DUCKY' },
  { id: 'flipper', label: 'FLIPPER' },
]

function convertToFlipperFormat(script: string): string {
  let lines = script.split('\n')

  // Add DEFAULT_DELAY if not present
  const hasDefaultDelay = lines.some(l => /^DEFAULT_DELAY\s/i.test(l.trim()) || /^DEFAULTDELAY\s/i.test(l.trim()))
  if (!hasDefaultDelay) {
    lines = ['DEFAULT_DELAY 20', ...lines]
  }

  // Normalize commands
  lines = lines.map(line => {
    const trimmed = line.trim()
    if (trimmed.startsWith('WINDOWS ') || trimmed === 'WINDOWS') {
      return line.replace(/WINDOWS/, 'GUI')
    }
    if (trimmed.startsWith('CONTROL ') || trimmed === 'CONTROL') {
      return line.replace(/CONTROL/, 'CTRL')
    }
    if (trimmed === 'ESC' || trimmed.startsWith('ESC ')) {
      return line.replace(/^(\s*)ESC/, '$1ESCAPE')
    }
    if (trimmed === 'BREAK' || trimmed.startsWith('BREAK ')) {
      return line.replace(/^(\s*)BREAK/, '$1PAUSE')
    }
    return line
  })

  return lines.join('\n')
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  return `${(bytes / 1024).toFixed(1)} KB`
}

export default function DeployView() {
  const soundEnabled = useAppStore(s => s.soundEnabled)
  const [flipper, setFlipper] = useState<FlipperDevice>({ found: false, path: null, type: null })
  const [deployed, setDeployed] = useState<DeployedPayload[]>([])
  const [scanning, setScanning] = useState(false)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [activeFormat, setActiveFormat] = useState('all')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [deployingIds, setDeployingIds] = useState<Set<string>>(new Set())
  const [deployedIds, setDeployedIds] = useState<Set<string>>(new Set())
  const [batchProgress, setBatchProgress] = useState<{ total: number; done: number } | null>(null)
  const [flyingPayload, setFlyingPayload] = useState<string | null>(null)

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

  const scanForFlipper = useCallback(async () => {
    setScanning(true)
    try {
      const result = await window.icarus.detectFlipper()
      setFlipper(result as FlipperDevice)
      if (result.found && result.path) {
        const files = await window.icarus.listDeployed(result.path)
        setDeployed(files)
        if (soundEnabled) playOkBeep()
      } else {
        setDeployed([])
        if (soundEnabled) playWarnTone()
      }
    } catch {
      setFlipper({ found: false, path: null, type: null })
      if (soundEnabled) playWarnTone()
    }
    setScanning(false)
  }, [soundEnabled])

  const refreshDeployed = useCallback(async () => {
    if (!flipper.found || !flipper.path) return
    try {
      const files = await window.icarus.listDeployed(flipper.path)
      setDeployed(files)
    } catch {}
  }, [flipper])

  const deploySingle = useCallback(async (script: DuckyScript) => {
    if (!flipper.found || !flipper.path) return
    setDeployingIds(prev => new Set(prev).add(script.id))
    setFlyingPayload(script.id)

    const content = script.format === 'ducky' ? convertToFlipperFormat(script.script) : script.script
    const filename = `${script.id}.txt`

    try {
      await window.icarus.deployPayload(flipper.path!, filename, content, script.category)
      setDeployedIds(prev => new Set(prev).add(script.id))
      if (soundEnabled) playOkBeep()
      await refreshDeployed()
    } catch {
      if (soundEnabled) playWarnTone()
    }

    setTimeout(() => {
      setDeployingIds(prev => {
        const next = new Set(prev)
        next.delete(script.id)
        return next
      })
      setFlyingPayload(null)
    }, 600)

    setTimeout(() => {
      setDeployedIds(prev => {
        const next = new Set(prev)
        next.delete(script.id)
        return next
      })
    }, 2000)
  }, [flipper, soundEnabled, refreshDeployed])

  const deploySelected = useCallback(async () => {
    if (!flipper.found || !flipper.path || selected.size === 0) return
    const scripts = DUCKY_SCRIPTS.filter(s => selected.has(s.id))
    setBatchProgress({ total: scripts.length, done: 0 })

    const payloads = scripts.map(s => ({
      filename: `${s.id}.txt`,
      content: s.format === 'ducky' ? convertToFlipperFormat(s.script) : s.script,
      category: s.category
    }))

    try {
      await window.icarus.deployBatch(flipper.path!, payloads)
      setBatchProgress({ total: scripts.length, done: scripts.length })
      if (soundEnabled) playOkBeep()
      setSelected(new Set())
      await refreshDeployed()
    } catch {
      if (soundEnabled) playWarnTone()
    }

    setTimeout(() => setBatchProgress(null), 2000)
  }, [flipper, selected, soundEnabled, refreshDeployed])

  const deployAll = useCallback(async () => {
    if (!flipper.found || !flipper.path) return
    const scripts = DUCKY_SCRIPTS
    setBatchProgress({ total: scripts.length, done: 0 })

    const payloads = scripts.map(s => ({
      filename: `${s.id}.txt`,
      content: s.format === 'ducky' ? convertToFlipperFormat(s.script) : s.script,
      category: s.category
    }))

    try {
      await window.icarus.deployBatch(flipper.path!, payloads)
      setBatchProgress({ total: scripts.length, done: scripts.length })
      if (soundEnabled) playOkBeep()
      await refreshDeployed()
    } catch {
      if (soundEnabled) playWarnTone()
    }

    setTimeout(() => setBatchProgress(null), 2000)
  }, [flipper, soundEnabled, refreshDeployed])

  const removePayload = useCallback(async (filePath: string) => {
    try {
      await window.icarus.removePayload(filePath)
      await refreshDeployed()
    } catch {}
  }, [refreshDeployed])

  const clearAll = useCallback(async () => {
    for (const p of deployed) {
      await window.icarus.removePayload(p.path)
    }
    await refreshDeployed()
  }, [deployed, refreshDeployed])

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filtered.map(s => s.id)))
    }
  }

  useEffect(() => {
    scanForFlipper()
  }, [])

  const totalDeployedSize = deployed.reduce((acc, p) => acc + p.size, 0)

  return (
    <div className="h-full flex flex-col">
      {/* Top bar */}
      <div className="flex-shrink-0 border-b border-gold-muted/20 bg-bg-surface/50 backdrop-blur-sm px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              animate={flipper.found ? { boxShadow: ['0 0 4px #4ADE80', '0 0 12px #4ADE80', '0 0 4px #4ADE80'] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex items-center gap-2"
            >
              <div className={`w-2.5 h-2.5 rounded-full ${flipper.found ? 'bg-green-400' : 'bg-red-500'}`}
                style={flipper.found ? { boxShadow: '0 0 8px #4ADE80' } : { boxShadow: '0 0 8px #EF4444' }}
              />
              <span className="text-xs font-mono text-text-secondary">
                {flipper.found ? 'FLIPPER CONNECTED' : 'NO FLIPPER DETECTED'}
              </span>
            </motion.div>
            {flipper.found && flipper.path && (
              <span className="text-xs font-mono text-text-tertiary flex items-center gap-1">
                <HardDrive className="w-3 h-3" />
                {flipper.path}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={scanForFlipper}
              disabled={scanning}
              className="px-3 py-1.5 rounded-md border border-gold-muted/30 text-xs font-display text-gold hover:bg-gold/10 transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${scanning ? 'animate-spin' : ''}`} />
              SCAN FOR FLIPPER
            </motion.button>
            {flipper.found && (
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(234,179,8,0.3)' }}
                whileTap={{ scale: 0.95 }}
                onClick={deployAll}
                className="px-3 py-1.5 rounded-md bg-gold/20 border border-gold/40 text-xs font-display text-gold hover:bg-gold/30 transition-all flex items-center gap-1.5"
                style={{ boxShadow: '0 0 12px rgba(234,179,8,0.15)' }}
              >
                <Zap className="w-3 h-3" />
                DEPLOY ALL
              </motion.button>
            )}
          </div>
        </div>

        {/* Batch progress bar */}
        <AnimatePresence>
          {batchProgress && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-2"
            >
              <div className="flex items-center gap-2 text-xs font-mono text-gold">
                <span>{batchProgress.done}/{batchProgress.total} deployed</span>
                <div className="flex-1 h-1.5 bg-bg-raised rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: 'linear-gradient(90deg, #EAB308, #F59E0B)', boxShadow: '0 0 8px #EAB308' }}
                    initial={{ width: '0%' }}
                    animate={{ width: `${(batchProgress.done / batchProgress.total) * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                {batchProgress.done === batchProgress.total && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-green-400 flex items-center gap-1"
                  >
                    <CheckCircle className="w-3 h-3" /> COMPLETE
                  </motion.span>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main content */}
      <div className="flex-1 flex min-h-0">
        {/* Left panel — Payload Library */}
        <div className="flex-1 flex flex-col min-h-0 border-r border-gold-muted/20">
          {/* Search & filters */}
          <div className="flex-shrink-0 p-3 border-b border-gold-muted/10 space-y-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-tertiary" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search payloads..."
                className="w-full pl-8 pr-3 py-1.5 rounded-md bg-bg-raised border border-gold-muted/20 text-xs font-mono text-text-primary placeholder:text-text-tertiary focus:border-gold/40 focus:outline-none transition-colors"
              />
            </div>

            {/* Category pills */}
            <div className="flex flex-wrap gap-1">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all ${
                    activeCategory === cat.id
                      ? 'text-white'
                      : 'text-text-tertiary hover:text-text-secondary'
                  }`}
                  style={activeCategory === cat.id ? {
                    background: `${cat.color}22`,
                    border: `1px solid ${cat.color}55`,
                    boxShadow: `0 0 6px ${cat.color}33`
                  } : {
                    background: 'transparent',
                    border: '1px solid transparent'
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Format filter + select all */}
            <div className="flex items-center justify-between">
              <div className="flex gap-1">
                {FORMAT_FILTERS.map(f => (
                  <button
                    key={f.id}
                    onClick={() => setActiveFormat(f.id)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-all ${
                      activeFormat === f.id
                        ? 'text-gold border-gold/40 bg-gold/10'
                        : 'text-text-tertiary border-transparent hover:text-text-secondary'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={selectAll}
                  className="text-[10px] font-mono text-text-tertiary hover:text-gold transition-colors"
                >
                  {selected.size === filtered.length ? 'DESELECT ALL' : 'SELECT ALL'}
                </button>
                <span className="text-[10px] font-mono text-text-tertiary">
                  {filtered.length} payloads
                </span>
              </div>
            </div>
          </div>

          {/* Payload list */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            <AnimatePresence mode="popLayout">
              {filtered.map((script, idx) => {
                const isDeploying = deployingIds.has(script.id)
                const isDeployed = deployedIds.has(script.id)
                const isSelected = selected.has(script.id)
                const catColor = CATEGORIES.find(c => c.id === script.category)?.color || '#EAB308'

                return (
                  <motion.div
                    key={script.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{
                      opacity: flyingPayload === script.id ? 0.3 : 1,
                      y: 0,
                      x: flyingPayload === script.id ? 200 : 0,
                      scale: flyingPayload === script.id ? 0.8 : 1
                    }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3, delay: idx < 20 ? idx * 0.02 : 0 }}
                    className={`group relative rounded-lg border p-2.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-gold/40 bg-gold/5'
                        : 'border-gold-muted/10 bg-bg-surface/30 hover:border-gold-muted/30 hover:bg-bg-surface/60'
                    }`}
                    style={isDeployed ? { boxShadow: '0 0 16px rgba(234,179,8,0.2)', borderColor: 'rgba(234,179,8,0.5)' } : {}}
                  >
                    <div className="flex items-start gap-2">
                      {/* Checkbox */}
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleSelect(script.id) }}
                        className={`mt-0.5 w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-all ${
                          isSelected
                            ? 'border-gold bg-gold/20 text-gold'
                            : 'border-gold-muted/30 text-transparent hover:border-gold-muted/50'
                        }`}
                      >
                        {isSelected && <CheckCircle className="w-3 h-3" />}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-display text-text-primary truncate">{script.name}</span>
                          <span
                            className="flex-shrink-0 px-1.5 py-0 rounded text-[9px] font-mono"
                            style={{ background: `${catColor}22`, color: catColor, border: `1px solid ${catColor}44` }}
                          >
                            {script.category}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* OS badges */}
                          <div className="flex gap-0.5">
                            {script.targetOS.map(os => {
                              const OsIcon = OS_ICONS[os] || Monitor
                              return <OsIcon key={os} className="w-3 h-3 text-text-tertiary" />
                            })}
                          </div>
                          {/* Risk */}
                          <span
                            className="text-[9px] font-mono px-1 rounded"
                            style={{ color: RISK_COLORS[script.riskLevel], background: `${RISK_COLORS[script.riskLevel]}15` }}
                          >
                            {script.riskLevel}
                          </span>
                          {/* Format */}
                          <span className="text-[9px] font-mono text-text-tertiary">
                            {script.format === 'flipper' ? 'FLIPPER' : 'DUCKY'}
                          </span>
                        </div>
                      </div>

                      {/* Deploy button */}
                      <motion.button
                        whileHover={{ scale: 1.1, boxShadow: '0 0 16px rgba(234,179,8,0.4)' }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => { e.stopPropagation(); deploySingle(script) }}
                        disabled={!flipper.found || isDeploying}
                        className={`flex-shrink-0 px-2.5 py-1 rounded-md text-[10px] font-display transition-all flex items-center gap-1 ${
                          isDeployed
                            ? 'bg-green-500/20 border border-green-500/40 text-green-400'
                            : isDeploying
                            ? 'bg-gold/10 border border-gold/30 text-gold animate-pulse'
                            : flipper.found
                            ? 'bg-gold/15 border border-gold/30 text-gold hover:bg-gold/25 opacity-0 group-hover:opacity-100'
                            : 'bg-bg-raised border border-gold-muted/10 text-text-tertiary cursor-not-allowed opacity-0 group-hover:opacity-100'
                        }`}
                        style={isDeployed ? { boxShadow: '0 0 12px rgba(74,222,128,0.2)' } : flipper.found && !isDeploying ? { boxShadow: '0 0 8px rgba(234,179,8,0.15)' } : {}}
                      >
                        {isDeployed ? (
                          <><CheckCircle className="w-3 h-3" /> DONE</>
                        ) : isDeploying ? (
                          <><ChevronRight className="w-3 h-3" /> ...</>
                        ) : (
                          <><Zap className="w-3 h-3" /> DEPLOY</>
                        )}
                      </motion.button>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>

          {/* Bottom bar for batch */}
          <AnimatePresence>
            {selected.size > 0 && flipper.found && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="flex-shrink-0 p-3 border-t border-gold-muted/20 bg-bg-surface/80 backdrop-blur-sm"
              >
                <motion.button
                  whileHover={{ scale: 1.02, boxShadow: '0 0 24px rgba(234,179,8,0.3)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={deploySelected}
                  className="w-full py-2 rounded-lg bg-gold/20 border border-gold/40 text-sm font-display text-gold hover:bg-gold/30 transition-all flex items-center justify-center gap-2"
                  style={{ boxShadow: '0 0 16px rgba(234,179,8,0.15)' }}
                >
                  <Zap className="w-4 h-4" />
                  DEPLOY SELECTED ({selected.size})
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right panel — Flipper Status */}
        <div className="w-80 flex-shrink-0 flex flex-col min-h-0 bg-bg-surface/30">
          <div className="flex-shrink-0 p-3 border-b border-gold-muted/10">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-display text-gold tracking-wider flex items-center gap-1.5">
                <Usb className="w-3.5 h-3.5" />
                FLIPPER SD CARD
              </h3>
              {deployed.length > 0 && (
                <button
                  onClick={clearAll}
                  className="text-[10px] font-mono text-red-400/70 hover:text-red-400 transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  CLEAR ALL
                </button>
              )}
            </div>
            <div className="flex items-center gap-3 text-[10px] font-mono text-text-tertiary">
              <span className="flex items-center gap-1">
                <File className="w-3 h-3" />
                {deployed.length} payloads
              </span>
              <span className="flex items-center gap-1">
                <HardDrive className="w-3 h-3" />
                {formatSize(totalDeployedSize)}
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {!flipper.found ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <motion.div
                  animate={{ opacity: [0.3, 0.7, 0.3] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <Usb className="w-10 h-10 text-text-tertiary/30 mb-3" />
                </motion.div>
                <p className="text-xs font-mono text-text-tertiary mb-1">No Flipper detected</p>
                <p className="text-[10px] font-mono text-text-tertiary/50">
                  Insert Flipper Zero SD card and click SCAN
                </p>
              </div>
            ) : deployed.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <FolderOpen className="w-10 h-10 text-text-tertiary/30 mb-3" />
                <p className="text-xs font-mono text-text-tertiary mb-1">No payloads deployed</p>
                <p className="text-[10px] font-mono text-text-tertiary/50">
                  Deploy payloads from the library
                </p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {/* Group by category */}
                {Object.entries(
                  deployed.reduce((acc, p) => {
                    if (!acc[p.category]) acc[p.category] = []
                    acc[p.category].push(p)
                    return acc
                  }, {} as Record<string, DeployedPayload[]>)
                ).map(([category, payloads]) => (
                  <motion.div
                    key={category}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="mb-2"
                  >
                    <div className="flex items-center gap-1.5 mb-1 px-1">
                      <FolderOpen className="w-3 h-3 text-gold/50" />
                      <span className="text-[10px] font-display text-gold/70 tracking-wider uppercase">{category}</span>
                      <span className="text-[9px] font-mono text-text-tertiary/50">({payloads.length})</span>
                    </div>
                    {payloads.map((p) => (
                      <motion.div
                        key={p.path}
                        layout
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20, scale: 0.9 }}
                        className="group flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-gold/5 transition-all"
                      >
                        <File className="w-3 h-3 text-text-tertiary/50 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <span className="text-[11px] font-mono text-text-secondary truncate block">{p.name}</span>
                          <span className="text-[9px] font-mono text-text-tertiary/50">{formatSize(p.size)}</span>
                        </div>
                        <button
                          onClick={() => removePayload(p.path)}
                          className="flex-shrink-0 p-1 rounded text-red-400/0 group-hover:text-red-400/60 hover:!text-red-400 hover:bg-red-500/10 transition-all"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                      </motion.div>
                    ))}
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
