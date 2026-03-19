import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plane, Play, Square, Monitor, Apple, Terminal, Clock, AlertTriangle, CheckCircle, RotateCcw } from 'lucide-react'

interface SimStep {
  line: number
  command: string
  action: string
  delayMs: number
  warning?: string
}

const OS_OPTIONS = [
  { id: 'win10', label: 'Windows 10', icon: Monitor },
  { id: 'win11', label: 'Windows 11', icon: Monitor },
  { id: 'macos', label: 'macOS Sonoma', icon: Apple },
  { id: 'linux', label: 'Linux (Ubuntu)', icon: Terminal },
]

const KEYBOARD_LAYOUTS = ['US (QWERTY)', 'UK', 'German (QWERTZ)', 'French (AZERTY)', 'Spanish', 'Nordic']

function parseScript(script: string): SimStep[] {
  const lines = script.split('\n')
  const steps: SimStep[] = []
  let defaultDelay = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const parts = line.split(/\s+/)
    const cmd = parts[0].toUpperCase()
    const rest = parts.slice(1).join(' ')

    if (cmd === 'DEFAULT_DELAY' || cmd === 'DEFAULTDELAY') {
      defaultDelay = parseInt(rest) || 0
      steps.push({ line: i + 1, command: line, action: `Set default delay to ${rest}ms`, delayMs: 0 })
      continue
    }

    if (cmd === 'REM') {
      steps.push({ line: i + 1, command: line, action: `Comment: ${rest}`, delayMs: 0 })
      continue
    }

    if (cmd === 'DELAY') {
      const ms = parseInt(rest) || 0
      const warning = ms < 100 ? 'Very short delay - may cause timing issues' : ms > 10000 ? 'Long delay - user may notice' : undefined
      steps.push({ line: i + 1, command: line, action: `Wait ${ms}ms`, delayMs: ms, warning })
      continue
    }

    if (cmd === 'STRING') {
      const charTime = rest.length * 20
      const warning = rest.length > 200 ? 'Very long string - consider breaking into multiple lines' : undefined
      steps.push({ line: i + 1, command: line, action: `Type: "${rest.slice(0, 60)}${rest.length > 60 ? '...' : ''}"`, delayMs: charTime + defaultDelay, warning })
      continue
    }

    if (cmd === 'ENTER') {
      steps.push({ line: i + 1, command: line, action: 'Press ENTER', delayMs: 50 + defaultDelay })
      continue
    }

    if (cmd === 'GUI' || cmd === 'WINDOWS') {
      steps.push({ line: i + 1, command: line, action: `Press Win+${rest || ''}`, delayMs: 50 + defaultDelay })
      continue
    }

    if (cmd === 'ALT') {
      const action = rest === 'y' ? 'Press Alt+Y (UAC accept)' : `Press Alt+${rest}`
      steps.push({ line: i + 1, command: line, action, delayMs: 50 + defaultDelay })
      continue
    }

    if (cmd === 'CTRL') {
      steps.push({ line: i + 1, command: line, action: `Press Ctrl+${rest}`, delayMs: 50 + defaultDelay })
      continue
    }

    if (cmd === 'REPEAT') {
      steps.push({ line: i + 1, command: line, action: `Repeat previous command ${rest}x`, delayMs: 0 })
      continue
    }

    steps.push({ line: i + 1, command: line, action: `Execute: ${line}`, delayMs: 50 + defaultDelay })
  }

  return steps
}

export default function FlightView() {
  const [script, setScript] = useState('')
  const [os, setOs] = useState('win11')
  const [layout, setLayout] = useState('US (QWERTY)')
  const [running, setRunning] = useState(false)
  const [currentStep, setCurrentStep] = useState(-1)
  const [steps, setSteps] = useState<SimStep[]>([])
  const [terminalLines, setTerminalLines] = useState<string[]>([])
  const termRef = useRef<HTMLDivElement>(null)
  const runRef = useRef(false)

  const totalTime = steps.reduce((sum, s) => sum + s.delayMs, 0)
  const warnings = steps.filter(s => s.warning)

  const detectRisk = (): { level: string; color: string; reasons: string[] } => {
    const reasons: string[] = []
    const text = script.toLowerCase()
    if (text.includes('mimikatz') || text.includes('sam')) reasons.push('Credential dumping detected')
    if (text.includes('reverse') || text.includes('4444') || text.includes('tcp')) reasons.push('Reverse shell detected')
    if (text.includes('defender') || text.includes('amsi')) reasons.push('AV evasion detected')
    if (text.includes('-verb runas') || text.includes('fodhelper')) reasons.push('Privilege escalation detected')
    if (text.includes('exfil') || text.includes('webhook') || text.includes('upload')) reasons.push('Data exfiltration detected')

    if (reasons.length >= 3) return { level: 'CRITICAL', color: '#EF4444', reasons }
    if (reasons.length >= 2) return { level: 'HIGH', color: '#FB923C', reasons }
    if (reasons.length >= 1) return { level: 'MEDIUM', color: '#FACC15', reasons }
    return { level: 'LOW', color: '#4ADE80', reasons: ['No high-risk operations detected'] }
  }

  const handleParse = () => {
    const parsed = parseScript(script)
    setSteps(parsed)
    setCurrentStep(-1)
    setTerminalLines([])
  }

  const handleDryRun = async () => {
    if (steps.length === 0) return
    setRunning(true)
    runRef.current = true
    setTerminalLines([])
    setCurrentStep(0)

    for (let i = 0; i < steps.length; i++) {
      if (!runRef.current) break
      setCurrentStep(i)
      setTerminalLines(prev => [...prev, `[${String(i + 1).padStart(3, '0')}] ${steps[i].action}`])

      const delay = Math.min(steps[i].delayMs, 2000) // Cap at 2s for simulation
      if (delay > 0) {
        await new Promise(r => setTimeout(r, Math.max(delay / 5, 100)))
      } else {
        await new Promise(r => setTimeout(r, 80))
      }
    }

    setTerminalLines(prev => [...prev, '', '--- SIMULATION COMPLETE ---'])
    setRunning(false)
    runRef.current = false
  }

  const handleStop = () => {
    runRef.current = false
    setRunning(false)
  }

  useEffect(() => {
    if (termRef.current) {
      termRef.current.scrollTop = termRef.current.scrollHeight
    }
  }, [terminalLines])

  const risk = detectRisk()

  return (
    <motion.div className="h-full flex flex-col" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      {/* Header */}
      <div className="p-4 border-b border-gold-muted/20 flex items-center gap-3">
        <Plane className="w-5 h-5 text-gold" />
        <h1 className="font-display text-lg text-gold glow-text tracking-wider">FLIGHT</h1>
        <span className="text-xs text-text-tertiary font-mono">Deployment Simulator</span>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Script input + config */}
        <div className="w-96 border-r border-gold-muted/20 flex flex-col flex-shrink-0">
          {/* Config bar */}
          <div className="p-3 border-b border-gold-muted/10 space-y-2">
            <div className="flex gap-2">
              {OS_OPTIONS.map(opt => {
                const Icon = opt.icon
                return (
                  <button
                    key={opt.id}
                    onClick={() => setOs(opt.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono transition-all ${
                      os === opt.id
                        ? 'bg-gold/15 text-gold border border-gold/30'
                        : 'text-text-tertiary hover:text-text-secondary border border-transparent hover:border-gold-muted/20'
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    {opt.label}
                  </button>
                )
              })}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-tertiary font-mono">Layout:</span>
              <select
                value={layout}
                onChange={e => setLayout(e.target.value)}
                className="flex-1 px-2 py-1 bg-bg-void/50 border border-gold-muted/20 rounded text-xs font-mono text-text-primary"
              >
                {KEYBOARD_LAYOUTS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>

          {/* Script input */}
          <div className="flex-1 overflow-hidden">
            <textarea
              value={script}
              onChange={e => { setScript(e.target.value); setSteps([]) }}
              placeholder="Paste your DuckyScript here to simulate..."
              className="w-full h-full bg-bg-void/30 p-4 font-mono text-xs text-text-primary resize-none outline-none placeholder:text-text-tertiary/40 leading-relaxed"
              spellCheck={false}
            />
          </div>

          {/* Controls */}
          <div className="p-3 border-t border-gold-muted/10 flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleParse}
              className="px-4 py-2 bg-gold/10 border border-gold/30 rounded text-gold text-xs font-display hover:bg-gold/20"
            >
              PARSE
            </motion.button>
            {!running ? (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleDryRun}
                disabled={steps.length === 0}
                className="flex items-center gap-1.5 px-4 py-2 bg-gold/20 border border-gold/40 rounded text-gold-bright text-xs font-display hover:bg-gold/30 disabled:opacity-30 animate-gold-pulse"
              >
                <Play className="w-3.5 h-3.5" /> LAUNCH
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleStop}
                className="flex items-center gap-1.5 px-4 py-2 bg-red-500/20 border border-red-500/40 rounded text-red-400 text-xs font-display hover:bg-red-500/30"
              >
                <Square className="w-3.5 h-3.5" /> STOP
              </motion.button>
            )}
            <div className="flex-1" />
            <div className="flex items-center gap-1.5 text-xs font-mono text-text-tertiary">
              <Clock className="w-3.5 h-3.5" />
              {(totalTime / 1000).toFixed(1)}s
            </div>
          </div>
        </div>

        {/* Right: Simulation output */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Timeline */}
          {steps.length > 0 && (
            <div className="p-3 border-b border-gold-muted/10">
              <div className="flex items-center gap-1">
                {steps.map((step, i) => {
                  const isActive = i === currentStep
                  const isDone = i < currentStep
                  const isDelay = step.command.startsWith('DELAY')
                  const width = Math.max(4, Math.min(40, (step.delayMs / totalTime) * 100))

                  return (
                    <div
                      key={i}
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${width}%`,
                        minWidth: '4px',
                        background: isActive ? '#EAB308' : isDone ? '#CA8A04' : isDelay ? 'rgba(34,211,238,0.2)' : 'rgba(234,179,8,0.1)',
                        boxShadow: isActive ? '0 0 8px rgba(234,179,8,0.5)' : 'none'
                      }}
                      title={`Line ${step.line}: ${step.action}`}
                    />
                  )
                })}
              </div>
              <div className="flex justify-between mt-1 text-[10px] font-mono text-text-tertiary">
                <span>0s</span>
                <span>Step {Math.max(0, currentStep + 1)} / {steps.length}</span>
                <span>{(totalTime / 1000).toFixed(1)}s</span>
              </div>
            </div>
          )}

          {/* Simulated terminal */}
          <div ref={termRef} className="flex-1 overflow-y-auto p-4 bg-bg-void/20 font-mono text-xs">
            {terminalLines.length === 0 && steps.length === 0 && (
              <div className="text-text-tertiary/50 text-center mt-20">
                <Plane className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="font-body text-sm">Paste a DuckyScript and click PARSE to begin simulation</p>
              </div>
            )}
            {terminalLines.map((line, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                className={`leading-relaxed ${
                  line.includes('COMPLETE') ? 'text-green-400 glow-text' :
                  line.includes('Wait') ? 'text-cyan-400/70' :
                  line.startsWith('---') ? 'text-gold glow-text' :
                  'text-text-primary'
                }`}
              >
                {line || '\u00A0'}
              </motion.div>
            ))}
            {running && (
              <div className="text-gold animate-pulse-glow mt-1">{'> executing..._'}</div>
            )}
          </div>

          {/* Risk assessment */}
          <div className="p-3 border-t border-gold-muted/10">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" style={{ color: risk.color }} />
                <span className="text-xs font-display tracking-wider" style={{ color: risk.color }}>
                  DETECTION RISK: {risk.level}
                </span>
              </div>
              <div className="flex-1 flex flex-wrap gap-1.5">
                {risk.reasons.map((r, i) => (
                  <span key={i} className="text-[10px] font-mono px-2 py-0.5 rounded bg-bg-void/50 text-text-tertiary border border-gold-muted/10">
                    {r}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
