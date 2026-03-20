import { useState } from 'react'
import { motion } from 'framer-motion'
import { Shield, Copy, ArrowRight, Gauge, Shuffle, Clock, MessageSquareOff, Variable, Zap, Minimize2, Download } from 'lucide-react'

const ENCODING_OPTIONS = [
  { id: 'char-split', label: 'String Splitting', icon: Shuffle, description: 'Break STRING commands into character-by-character typing' },
  { id: 'random-delay', label: 'Random Delay Injection', icon: Clock, description: 'Add random delays (50-200ms) between keystrokes' },
  { id: 'strip-comments', label: 'Comment Stripping', icon: MessageSquareOff, description: 'Remove all REM (comment) lines' },
  { id: 'compress', label: 'Payload Compression', icon: Minimize2, description: 'Minimize delays, remove blank lines' },
  { id: 'keystroke-jitter', label: 'Keystroke Jitter', icon: Zap, description: 'Randomize timing between all keystrokes (50-200ms)' },
  { id: 'flipper-convert', label: 'Flipper Zero Export', icon: Download, description: 'Convert to Flipper Zero BadUSB format (.txt for /badusb/ on SD)' },
]

export default function WaxView() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [selectedMethods, setSelectedMethods] = useState<string[]>([])
  const [encoding, setEncoding] = useState(false)
  const [copyFeedback, setCopyFeedback] = useState(false)

  const toggleMethod = (id: string) => {
    setSelectedMethods(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    )
  }

  const handleEncode = async () => {
    if (!input.trim() || selectedMethods.length === 0) return
    setEncoding(true)

    let result = input
    for (const method of selectedMethods) {
      if (method === 'flipper-convert') {
        // Convert standard DuckyScript to Flipper Zero BadUSB format
        const lines = result.split('\n')
        const converted: string[] = []
        let hasDefaultDelay = false

        for (const line of lines) {
          const trimmed = line.trim()
          if (trimmed.startsWith('DEFAULT_DELAY')) {
            hasDefaultDelay = true
          }
        }

        // Add DEFAULT_DELAY if not present
        if (!hasDefaultDelay) {
          converted.push('DEFAULT_DELAY 20')
        }

        for (const line of lines) {
          const trimmed = line.trim()
          // Replace WINDOWS with GUI (Flipper prefers GUI)
          if (trimmed.startsWith('WINDOWS ')) {
            converted.push(line.replace('WINDOWS ', 'GUI '))
          }
          // Replace CONTROL with CTRL
          else if (trimmed.startsWith('CONTROL ')) {
            converted.push(line.replace('CONTROL ', 'CTRL '))
          }
          // Replace ESC with ESCAPE
          else if (trimmed === 'ESC') {
            converted.push('ESCAPE')
          }
          // BREAK -> PAUSE (Flipper uses PAUSE)
          else if (trimmed === 'BREAK') {
            converted.push('PAUSE')
          }
          else {
            converted.push(line)
          }
        }

        result = converted.join('\n')
      } else if (method === 'keystroke-jitter') {
        // Client-side: add random delays between all lines
        const lines = result.split('\n')
        const jittered: string[] = []
        for (const line of lines) {
          jittered.push(line)
          if (line.trim() && !line.trim().startsWith('REM') && !line.trim().startsWith('DELAY')) {
            const delay = 50 + Math.floor(Math.random() * 150)
            jittered.push(`DELAY ${delay}`)
          }
        }
        result = jittered.join('\n')
      } else {
        try {
          result = await window.icarus.encodePayload(result, method)
        } catch {
          // Fallback for methods not available via IPC
          if (method === 'strip-comments') {
            result = result.split('\n').filter(l => !l.trimStart().startsWith('REM ')).join('\n')
          } else if (method === 'compress') {
            result = result.split('\n')
              .filter(l => l.trim() !== '')
              .map(l => {
                const m = l.match(/^DELAY\s+(\d+)$/)
                if (m && parseInt(m[1]) > 200) return 'DELAY 100'
                return l
              })
              .join('\n')
          }
        }
      }
    }

    setOutput(result)
    setEncoding(false)
  }

  const handleCopy = async () => {
    try {
      await window.icarus.copyToClipboard(output)
    } catch {
      await navigator.clipboard.writeText(output)
    }
    setCopyFeedback(true)
    setTimeout(() => setCopyFeedback(false), 1500)
  }

  // Calculate encoding strength
  const strengthScore = (() => {
    let score = 0
    if (selectedMethods.includes('char-split')) score += 30
    if (selectedMethods.includes('random-delay')) score += 25
    if (selectedMethods.includes('keystroke-jitter')) score += 20
    if (selectedMethods.includes('strip-comments')) score += 10
    if (selectedMethods.includes('compress')) score += 15
    return Math.min(score, 100)
  })()

  const strengthColor = strengthScore < 30 ? '#EF4444' : strengthScore < 60 ? '#FACC15' : '#4ADE80'

  return (
    <motion.div className="h-full flex flex-col" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      {/* Header */}
      <div className="p-4 border-b border-gold-muted/20 flex items-center gap-3">
        <Shield className="w-5 h-5 text-gold" />
        <h1 className="font-display text-lg text-gold glow-text tracking-wider">WAX</h1>
        <span className="text-xs text-text-tertiary font-mono">Encoder / Obfuscator</span>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Encoding options */}
        <div className="w-64 border-r border-gold-muted/20 bg-bg-surface/50 p-4 overflow-y-auto flex-shrink-0">
          <h3 className="font-display text-xs text-gold-dark tracking-wider mb-3">ENCODING METHODS</h3>
          <div className="space-y-2">
            {ENCODING_OPTIONS.map((opt, idx) => {
              const Icon = opt.icon
              const selected = selectedMethods.includes(opt.id)
              return (
                <motion.button
                  key={opt.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => toggleMethod(opt.id)}
                  className={`w-full text-left p-3 rounded-lg transition-all ${
                    selected
                      ? 'glass-panel-bright border-gold/30 gold-glow-border'
                      : 'glass-panel hover:border-gold/15'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className={`w-4 h-4 ${selected ? 'text-gold' : 'text-text-tertiary'}`} />
                    <span className={`text-xs font-display ${selected ? 'text-gold' : 'text-text-secondary'}`}>{opt.label}</span>
                  </div>
                  <p className="text-[10px] text-text-tertiary font-body pl-6">{opt.description}</p>
                </motion.button>
              )
            })}
          </div>

          {/* Strength meter */}
          <div className="mt-6">
            <h3 className="font-display text-xs text-gold-dark tracking-wider mb-2">ENCODING STRENGTH</h3>
            <div className="glass-panel p-3">
              <div className="flex items-center justify-between mb-2">
                <Gauge className="w-4 h-4" style={{ color: strengthColor }} />
                <span className="font-display text-lg" style={{ color: strengthColor }}>{strengthScore}</span>
                <span className="text-xs text-text-tertiary font-mono">/ 100</span>
              </div>
              <div className="w-full h-2 bg-bg-void rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  animate={{ width: `${strengthScore}%` }}
                  style={{ background: strengthColor }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          </div>

          {/* Encode button */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleEncode}
            disabled={!input.trim() || selectedMethods.length === 0 || encoding}
            className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 bg-gold/20 border border-gold/40 rounded-lg text-gold text-xs font-display hover:bg-gold/30 disabled:opacity-30 gold-glow-border"
          >
            {encoding ? 'ENCODING...' : 'ENCODE PAYLOAD'}
          </motion.button>
        </div>

        {/* Before / After panels */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 flex overflow-hidden">
            {/* Input */}
            <div className="flex-1 flex flex-col border-r border-gold-muted/10">
              <div className="p-2 border-b border-gold-muted/10 flex items-center gap-2">
                <span className="text-xs font-display text-text-tertiary tracking-wider">INPUT (RAW)</span>
                <span className="text-[10px] font-mono text-text-tertiary/50 ml-auto">{input.split('\n').length} lines</span>
              </div>
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Paste your DuckyScript payload here..."
                className="flex-1 bg-bg-void/20 p-4 font-mono text-xs text-text-primary resize-none outline-none placeholder:text-text-tertiary/40 leading-relaxed"
                spellCheck={false}
              />
            </div>

            {/* Arrow */}
            <div className="flex items-center px-2">
              <ArrowRight className="w-5 h-5 text-gold-muted" />
            </div>

            {/* Output */}
            <div className="flex-1 flex flex-col">
              <div className="p-2 border-b border-gold-muted/10 flex items-center gap-2">
                <span className="text-xs font-display text-text-tertiary tracking-wider">OUTPUT (ENCODED)</span>
                <span className="text-[10px] font-mono text-text-tertiary/50 ml-auto">{output.split('\n').length} lines</span>
                {output && (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleCopy}
                      className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono text-gold bg-gold/10 rounded border border-gold/20 hover:bg-gold/20"
                    >
                      <Copy className="w-3 h-3" />
                      {copyFeedback ? 'Copied!' : 'Copy'}
                    </motion.button>
                    {selectedMethods.includes('flipper-convert') && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          const blob = new Blob([output], { type: 'text/plain' })
                          const url = URL.createObjectURL(blob)
                          const a = document.createElement('a')
                          a.href = url
                          a.download = 'payload.txt'
                          a.click()
                          URL.revokeObjectURL(url)
                        }}
                        className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono text-orange-400 bg-orange-400/10 rounded border border-orange-400/20 hover:bg-orange-400/20"
                      >
                        <Download className="w-3 h-3" />
                        Flipper .txt
                      </motion.button>
                    )}
                  </>
                )}
              </div>
              <div className="flex-1 bg-bg-void/20 p-4 overflow-y-auto font-mono text-xs text-text-primary leading-relaxed whitespace-pre-wrap">
                {output || <span className="text-text-tertiary/40">Encoded output will appear here...</span>}
              </div>
            </div>
          </div>

          {/* Diff stats */}
          {output && (
            <div className="p-3 border-t border-gold-muted/10 flex items-center gap-6">
              <span className="text-xs font-mono text-text-tertiary">
                Input: <span className="text-text-secondary">{input.length} chars, {input.split('\n').length} lines</span>
              </span>
              <span className="text-xs font-mono text-text-tertiary">
                Output: <span className="text-text-secondary">{output.length} chars, {output.split('\n').length} lines</span>
              </span>
              <span className="text-xs font-mono text-text-tertiary">
                Change: <span className={output.length > input.length ? 'text-red-400' : 'text-green-400'}>
                  {output.length > input.length ? '+' : ''}{((output.length - input.length) / Math.max(input.length, 1) * 100).toFixed(0)}%
                </span>
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
