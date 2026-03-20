import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Archive, RefreshCw, Download, Wifi, Monitor, Network, Lock, FileText,
  ChevronRight, ChevronDown, Copy, Save, Trash2, Eye, EyeOff, Usb, XCircle
} from 'lucide-react'
import { useAppStore } from '../lib/stores/app'
import { playOkBeep, playWarnTone } from '../lib/bootAudio'
import type { LootSession, LootFile, FlipperDevice } from '../lib/types'

type LootType = 'wifi' | 'sysinfo' | 'network' | 'credentials' | 'generic'

function detectLootType(filename: string, content: string): LootType {
  const fLower = filename.toLowerCase()
  const cLower = content.toLowerCase()
  if (fLower.includes('wifi') || cLower.includes('ssid') || cLower.includes('key content'))
    return 'wifi'
  if (fLower.includes('sysinfo') || cLower.includes('os name') || cLower.includes('systeminfo'))
    return 'sysinfo'
  if (cLower.includes('netstat') || cLower.includes('arp') || cLower.includes('ipconfig'))
    return 'network'
  if (cLower.includes('password') || cLower.includes('credential') || cLower.includes('token'))
    return 'credentials'
  return 'generic'
}

const LOOT_TYPE_META: Record<LootType, { icon: typeof FileText; label: string; color: string }> = {
  wifi: { icon: Wifi, label: 'WiFi', color: '#3B82F6' },
  sysinfo: { icon: Monitor, label: 'System Info', color: '#10B981' },
  network: { icon: Network, label: 'Network', color: '#06B6D4' },
  credentials: { icon: Lock, label: 'Credentials', color: '#EF4444' },
  generic: { icon: FileText, label: 'File', color: '#EAB308' },
}

function getFileIcon(filename: string) {
  const fLower = filename.toLowerCase()
  if (fLower.includes('wifi')) return Wifi
  if (fLower.includes('sysinfo') || fLower.includes('system')) return Monitor
  if (fLower.includes('network') || fLower.includes('net') || fLower.includes('ip')) return Network
  if (fLower.includes('pass') || fLower.includes('cred') || fLower.includes('token')) return Lock
  return FileText
}

function parseSessionName(session: string): { hostname: string; timestamp: string } {
  // Try to parse "HOSTNAME_YYYYMMDD_HHMM" format
  const parts = session.split('_')
  if (parts.length >= 3) {
    const hostname = parts.slice(0, -2).join('_')
    const date = parts[parts.length - 2]
    const time = parts[parts.length - 1]
    const formatted = date.length === 8
      ? `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)} ${time.slice(0, 2)}:${time.slice(2)}`
      : `${date} ${time}`
    return { hostname, timestamp: formatted }
  }
  return { hostname: session, timestamp: '' }
}

// --- WiFi Table Renderer ---
function WifiTable({ content }: { content: string }) {
  const [revealed, setRevealed] = useState<Set<number>>(new Set())

  const entries = content.split('\n')
    .filter(line => line.includes(':') || line.includes('\t'))
    .map(line => {
      const sep = line.includes('\t') ? '\t' : ':'
      const idx = line.indexOf(sep)
      if (idx === -1) return null
      const ssid = line.slice(0, idx).trim()
      const pass = line.slice(idx + 1).trim()
      if (!ssid) return null
      return { ssid, password: pass }
    })
    .filter(Boolean) as Array<{ ssid: string; password: string }>

  if (entries.length === 0) return <GenericViewer content={content} />

  return (
    <div className="overflow-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gold-muted/20">
            <th className="text-left py-2 px-3 text-gold font-display text-xs tracking-wider">SSID</th>
            <th className="text-left py-2 px-3 text-gold font-display text-xs tracking-wider">PASSWORD</th>
            <th className="w-20 py-2 px-3"></th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, i) => (
            <tr key={i} className="border-b border-gold-muted/10 hover:bg-gold/5 transition-colors">
              <td className="py-2 px-3 font-mono text-text-primary">
                <div className="flex items-center gap-2">
                  <Wifi className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                  {entry.ssid}
                </div>
              </td>
              <td className="py-2 px-3 font-mono">
                {revealed.has(i) ? (
                  <span className="text-red-400">{entry.password}</span>
                ) : (
                  <span className="text-text-tertiary select-none cursor-pointer" onClick={() => setRevealed(prev => new Set(prev).add(i))}>
                    {'*'.repeat(Math.max(entry.password.length, 8))}
                  </span>
                )}
              </td>
              <td className="py-2 px-3">
                <div className="flex gap-1">
                  <button
                    onClick={() => setRevealed(prev => {
                      const next = new Set(prev)
                      next.has(i) ? next.delete(i) : next.add(i)
                      return next
                    })}
                    className="p-1 rounded text-text-tertiary hover:text-gold transition-colors"
                    title={revealed.has(i) ? 'Hide' : 'Reveal'}
                  >
                    {revealed.has(i) ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => window.icarus.copyToClipboard(entry.password)}
                    className="p-1 rounded text-text-tertiary hover:text-gold transition-colors"
                    title="Copy password"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// --- System Info Renderer ---
function SysInfoViewer({ content }: { content: string }) {
  const lines = content.split('\n')

  return (
    <div className="font-mono text-sm overflow-auto p-4 space-y-0.5">
      {lines.map((line, i) => {
        const isHeader = line.startsWith('===') || line.startsWith('---') || line.startsWith('***') || /^[A-Z][A-Z\s]+:?\s*$/.test(line.trim())
        const isKeyValue = line.includes(':') && !isHeader
        if (isHeader) {
          return (
            <div key={i} className="text-gold font-display text-xs tracking-wider pt-3 pb-1 border-b border-gold-muted/20 mb-1">
              {line.replace(/[=\-*]/g, '').trim() || line}
            </div>
          )
        }
        if (isKeyValue) {
          const idx = line.indexOf(':')
          const key = line.slice(0, idx).trim()
          const val = line.slice(idx + 1).trim()
          return (
            <div key={i} className="flex gap-2 py-0.5 hover:bg-gold/5 px-2 -mx-2 rounded">
              <span className="text-text-tertiary min-w-[200px] flex-shrink-0">{key}</span>
              <span className="text-text-primary">{val}</span>
            </div>
          )
        }
        return <div key={i} className="text-text-secondary py-0.5 px-2 -mx-2">{line}</div>
      })}
    </div>
  )
}

// --- Network Data Renderer ---
function NetworkViewer({ content }: { content: string }) {
  return <SysInfoViewer content={content} />
}

// --- Credentials Renderer ---
function CredentialsViewer({ content }: { content: string }) {
  const [revealed, setRevealed] = useState(false)

  return (
    <div className="relative">
      {!revealed && (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center cursor-pointer backdrop-blur-md bg-bg-surface/60 rounded-lg"
          onClick={() => setRevealed(true)}
        >
          <div className="flex flex-col items-center gap-2 text-text-tertiary">
            <Lock className="w-8 h-8 text-red-400" />
            <span className="text-sm font-display tracking-wider">SENSITIVE DATA - CLICK TO REVEAL</span>
          </div>
        </div>
      )}
      <div className={revealed ? '' : 'filter blur-sm select-none'}>
        <GenericViewer content={content} />
      </div>
      {revealed && (
        <button
          onClick={() => setRevealed(false)}
          className="absolute top-2 right-2 p-1.5 rounded bg-bg-raised/80 text-text-tertiary hover:text-red-400 transition-colors"
          title="Hide"
        >
          <EyeOff className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}

// --- Generic Code Viewer ---
function GenericViewer({ content }: { content: string }) {
  const lines = content.split('\n')
  return (
    <div className="font-mono text-sm overflow-auto p-4">
      {lines.map((line, i) => (
        <div key={i} className="flex hover:bg-gold/5 -mx-2 px-2 rounded">
          <span className="text-text-tertiary/40 w-10 text-right mr-4 select-none flex-shrink-0 text-xs leading-6">{i + 1}</span>
          <span className="text-text-primary whitespace-pre leading-6">{line}</span>
        </div>
      ))}
    </div>
  )
}

// --- Content Renderer Switch ---
function LootContentRenderer({ filename, content }: { filename: string; content: string }) {
  const lootType = detectLootType(filename, content)

  switch (lootType) {
    case 'wifi': return <WifiTable content={content} />
    case 'sysinfo': return <SysInfoViewer content={content} />
    case 'network': return <NetworkViewer content={content} />
    case 'credentials': return <CredentialsViewer content={content} />
    default: return <GenericViewer content={content} />
  }
}

// ===== MAIN COMPONENT =====
export default function LootView() {
  const soundEnabled = useAppStore(s => s.soundEnabled)
  const [flipper, setFlipper] = useState<FlipperDevice>({ found: false, port: null })
  const [sessions, setSessions] = useState<LootSession[]>([])
  const [scanning, setScanning] = useState(false)
  const [pulling, setPulling] = useState(false)
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set())
  const [activeFile, setActiveFile] = useState<{ session: string; filename: string; path: string } | null>(null)
  const [fileContent, setFileContent] = useState<string>('')
  const [loadingFile, setLoadingFile] = useState(false)

  const scanAndLoad = useCallback(async () => {
    setScanning(true)
    try {
      const result = await window.icarus.detectFlipper()
      setFlipper(result as FlipperDevice)
      if (result.found) {
        const loot = await window.icarus.listLoot()
        setSessions(Array.isArray(loot) ? loot : [])
        if (soundEnabled) playOkBeep()
      } else {
        setSessions([])
        if (soundEnabled) playWarnTone()
      }
    } catch {
      setFlipper({ found: false, port: null })
      if (soundEnabled) playWarnTone()
    }
    setScanning(false)
  }, [soundEnabled])

  const pullAllLoot = useCallback(async () => {
    if (!flipper.found || sessions.length === 0) return
    setPulling(true)
    // Just refresh the listing
    try {
      const loot = await window.icarus.listLoot()
      setSessions(Array.isArray(loot) ? loot : [])
      if (soundEnabled) playOkBeep()
    } catch {
      if (soundEnabled) playWarnTone()
    }
    setPulling(false)
  }, [flipper, sessions, soundEnabled])

  const openFile = useCallback(async (sessionPath: string, filename: string) => {
    const fullPath = `${sessionPath}/${filename}`
    setActiveFile({ session: sessionPath, filename, path: fullPath })
    setLoadingFile(true)
    try {
      const result = await window.icarus.pullLoot(fullPath)
      setFileContent(result.content || '')
      if (soundEnabled) playOkBeep()
    } catch {
      setFileContent('[ERROR] Failed to read file from Flipper')
      if (soundEnabled) playWarnTone()
    }
    setLoadingFile(false)
  }, [soundEnabled])

  const toggleSession = (session: string) => {
    setExpandedSessions(prev => {
      const next = new Set(prev)
      next.has(session) ? next.delete(session) : next.add(session)
      return next
    })
  }

  const copyAll = () => {
    if (fileContent) window.icarus.copyToClipboard(fileContent)
  }

  const saveToDisk = async () => {
    if (!fileContent || !activeFile) return
    await window.icarus.saveFile(fileContent, activeFile.filename)
  }

  const deleteFromFlipper = async () => {
    if (!activeFile) return
    try {
      await window.icarus.removePayload(activeFile.path)
      setActiveFile(null)
      setFileContent('')
      // Refresh
      const loot = await window.icarus.listLoot()
      setSessions(Array.isArray(loot) ? loot : [])
      if (soundEnabled) playOkBeep()
    } catch {
      if (soundEnabled) playWarnTone()
    }
  }

  const totalFiles = sessions.reduce((acc, s) => acc + s.files.length, 0)

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-bg-surface/30">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gold-muted/20 bg-bg-surface/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Archive className="w-5 h-5 text-gold" />
          <h1 className="font-display text-gold text-lg tracking-wider">LOOT</h1>
          <span className="text-text-tertiary text-xs font-mono ml-2">Exfiltrated Data Viewer</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Connection status */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono ${
            flipper.found
              ? 'border-green-500/30 bg-green-500/5 text-green-400'
              : 'border-red-500/30 bg-red-500/5 text-red-400'
          }`}>
            <div className={`w-2 h-2 rounded-full ${flipper.found ? 'bg-green-400 animate-pulse' : 'bg-red-500'}`} />
            {flipper.found ? (
              <>
                <Usb className="w-3.5 h-3.5" />
                <span>{flipper.port}</span>
                <span className="text-text-tertiary">|</span>
                <span>{totalFiles} files</span>
              </>
            ) : (
              <span>NO FLIPPER</span>
            )}
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={pullAllLoot}
            disabled={!flipper.found || pulling}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg font-display text-xs tracking-wider bg-gold/10 text-gold border border-gold-muted/30 hover:bg-gold/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <Download className={`w-3.5 h-3.5 ${pulling ? 'animate-bounce' : ''}`} />
            PULL LOOT
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={scanAndLoad}
            disabled={scanning}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg font-display text-xs tracking-wider bg-bg-raised text-text-secondary border border-gold-muted/20 hover:text-gold hover:border-gold-muted/40 disabled:opacity-30 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${scanning ? 'animate-spin' : ''}`} />
            REFRESH
          </motion.button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Session Browser */}
        <div className="w-80 flex-shrink-0 border-r border-gold-muted/20 overflow-y-auto">
          <div className="p-3">
            <div className="text-xs font-display text-text-tertiary tracking-wider mb-3 px-2">
              SESSIONS ({sessions.length})
            </div>

            {sessions.length === 0 && !scanning && (
              <div className="text-center py-12 text-text-tertiary">
                <Archive className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No loot found</p>
                <p className="text-xs mt-1 opacity-60">Connect Flipper and scan</p>
              </div>
            )}

            {scanning && (
              <div className="text-center py-12">
                <RefreshCw className="w-8 h-8 mx-auto mb-3 text-gold animate-spin" />
                <p className="text-sm text-text-tertiary">Scanning Flipper...</p>
              </div>
            )}

            <AnimatePresence>
              {sessions.map((session, idx) => {
                const { hostname, timestamp } = parseSessionName(session.session)
                const isExpanded = expandedSessions.has(session.session)
                return (
                  <motion.div
                    key={session.session + session.path}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: idx * 0.05, duration: 0.2 }}
                    className="mb-2"
                  >
                    {/* Session Card */}
                    <button
                      onClick={() => toggleSession(session.session)}
                      className="w-full text-left p-3 rounded-lg border border-gold-muted/15 bg-bg-raised/50 backdrop-blur-sm hover:border-gold-muted/30 hover:bg-bg-raised/80 transition-all group"
                    >
                      <div className="flex items-center gap-2">
                        <motion.div animate={{ rotate: isExpanded ? 90 : 0 }} transition={{ duration: 0.15 }}>
                          <ChevronRight className="w-3.5 h-3.5 text-text-tertiary" />
                        </motion.div>
                        <Monitor className="w-4 h-4 text-gold" />
                        <span className="text-sm font-mono text-text-primary truncate flex-1">{hostname}</span>
                        <span className="text-[10px] font-mono text-text-tertiary bg-bg-surface/50 px-1.5 py-0.5 rounded">
                          {session.files.length}
                        </span>
                      </div>
                      {timestamp && (
                        <div className="text-[10px] font-mono text-text-tertiary mt-1 ml-8">{timestamp}</div>
                      )}
                    </button>

                    {/* Files List */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="ml-4 mt-1 space-y-0.5">
                            {session.files.map((file) => {
                              const FileIcon = getFileIcon(file.name)
                              const isActive = activeFile?.path === `${session.path}/${file.name}`
                              return (
                                <button
                                  key={file.name}
                                  onClick={() => openFile(session.path, file.name)}
                                  className={`w-full text-left flex items-center gap-2 px-3 py-1.5 rounded text-xs font-mono transition-all ${
                                    isActive
                                      ? 'bg-gold/10 text-gold border border-gold-muted/30'
                                      : 'text-text-secondary hover:text-text-primary hover:bg-gold/5 border border-transparent'
                                  }`}
                                >
                                  <FileIcon className="w-3.5 h-3.5 flex-shrink-0" />
                                  <span className="truncate flex-1">{file.name}</span>
                                  <span className="text-text-tertiary text-[10px]">{file.size}</span>
                                </button>
                              )
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Panel: File Viewer */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {activeFile ? (
            <>
              {/* File Header */}
              <div className="flex items-center justify-between px-5 py-2.5 border-b border-gold-muted/20 bg-bg-surface/30">
                <div className="flex items-center gap-3 min-w-0">
                  {(() => {
                    const type = fileContent ? detectLootType(activeFile.filename, fileContent) : 'generic'
                    const meta = LOOT_TYPE_META[type]
                    const TypeIcon = meta.icon
                    return (
                      <>
                        <div className="p-1.5 rounded" style={{ backgroundColor: `${meta.color}15` }}>
                          <TypeIcon className="w-4 h-4" style={{ color: meta.color }} />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-mono text-text-primary truncate">{activeFile.filename}</div>
                          <div className="text-[10px] text-text-tertiary font-mono truncate">{activeFile.path}</div>
                        </div>
                        <span className="text-[10px] font-display tracking-wider px-2 py-0.5 rounded-full border"
                          style={{ color: meta.color, borderColor: `${meta.color}40`, backgroundColor: `${meta.color}10` }}>
                          {meta.label.toUpperCase()}
                        </span>
                      </>
                    )
                  })()}
                </div>

                <div className="flex items-center gap-1.5">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={copyAll}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-display tracking-wider text-text-secondary hover:text-gold border border-gold-muted/20 hover:border-gold-muted/40 transition-all"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    COPY ALL
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={saveToDisk}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-display tracking-wider text-text-secondary hover:text-gold border border-gold-muted/20 hover:border-gold-muted/40 transition-all"
                  >
                    <Save className="w-3.5 h-3.5" />
                    SAVE TO DISK
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={deleteFromFlipper}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-display tracking-wider text-red-400/70 hover:text-red-400 border border-red-500/20 hover:border-red-500/40 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    DELETE
                  </motion.button>
                </div>
              </div>

              {/* File Content */}
              <div className="flex-1 overflow-auto">
                {loadingFile ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="flex flex-col items-center gap-3">
                      <Download className="w-8 h-8 text-gold animate-bounce" />
                      <span className="text-sm text-text-tertiary font-display tracking-wider">PULLING FILE...</span>
                    </div>
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="h-full"
                  >
                    <LootContentRenderer filename={activeFile.filename} content={fileContent} />
                  </motion.div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Archive className="w-16 h-16 mx-auto mb-4 text-gold/20" />
                <h2 className="font-display text-gold/40 text-lg tracking-wider mb-2">NO FILE SELECTED</h2>
                <p className="text-text-tertiary text-sm max-w-xs mx-auto">
                  {flipper.found
                    ? 'Select a file from the session browser to view its contents'
                    : 'Connect your Flipper Zero and press REFRESH to scan for loot'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
