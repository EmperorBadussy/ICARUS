import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Hammer, Play, Copy, Download, FileUp, CheckCircle, XCircle, Clock, Type, Keyboard, RotateCcw, MessageSquare, Timer } from 'lucide-react'
import { useAppStore } from '../lib/stores/app'

const COMMAND_BLOCKS = [
  { cmd: 'DELAY', icon: Timer, label: 'Delay', color: '#22D3EE', hasInput: true, inputType: 'number' as const, placeholder: 'ms' },
  { cmd: 'STRING', icon: Type, label: 'String', color: '#4ADE80', hasInput: true, inputType: 'text' as const, placeholder: 'text to type' },
  { cmd: 'ENTER', icon: Keyboard, label: 'Enter', color: '#EAB308', hasInput: false },
  { cmd: 'TAB', icon: Keyboard, label: 'Tab', color: '#FB923C', hasInput: false },
  { cmd: 'ESCAPE', icon: Keyboard, label: 'Escape', color: '#FB923C', hasInput: false },
  { cmd: 'GUI r', icon: Keyboard, label: 'GUI+R (Run)', color: '#EAB308', hasInput: false },
  { cmd: 'GUI', icon: Keyboard, label: 'GUI+Key', color: '#EAB308', hasInput: true, inputType: 'text' as const, placeholder: 'key' },
  { cmd: 'CTRL', icon: Keyboard, label: 'Ctrl+Key', color: '#EAB308', hasInput: true, inputType: 'text' as const, placeholder: 'key' },
  { cmd: 'ALT', icon: Keyboard, label: 'Alt+Key', color: '#EAB308', hasInput: true, inputType: 'text' as const, placeholder: 'key' },
  { cmd: 'REPEAT', icon: RotateCcw, label: 'Repeat', color: '#A78BFA', hasInput: true, inputType: 'number' as const, placeholder: 'count' },
  { cmd: 'REM', icon: MessageSquare, label: 'Comment', color: '#6B7280', hasInput: true, inputType: 'text' as const, placeholder: 'comment' },
]

function highlightLine(line: string): string {
  const trimmed = line.trimStart()
  if (trimmed.startsWith('REM ')) return 'ducky-comment'
  if (trimmed.startsWith('STRING ')) return 'ducky-string'
  if (trimmed.startsWith('DELAY ') || trimmed.startsWith('DEFAULT_DELAY ')) return 'ducky-delay'
  if (/^(GUI|WINDOWS|ALT|CTRL|CONTROL|SHIFT|ENTER|TAB|ESCAPE|ESC|DELETE|BACKSPACE|SPACE|F\d+|REPEAT|DOWNARROW|UPARROW|LEFTARROW|RIGHTARROW|UP|DOWN|LEFT|RIGHT|HOME|END|INSERT|PAGEUP|PAGEDOWN|CAPSLOCK|NUMLOCK|SCROLLLOCK|PRINTSCREEN|PAUSE|BREAK|MENU|APP)/.test(trimmed)) return 'ducky-command'
  return ''
}

export default function ForgeView() {
  const { forgeScript, setForgeScript } = useAppStore()
  const [script, setScript] = useState(forgeScript || '')
  const [validation, setValidation] = useState<{ valid: boolean; errors: string[] } | null>(null)
  const [copyFeedback, setCopyFeedback] = useState(false)
  const [blockInput, setBlockInput] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (forgeScript) {
      setScript(forgeScript)
      setForgeScript('')
    }
  }, [forgeScript, setForgeScript])

  const lineCount = script.split('\n').length
  const charCount = script.length

  const insertCommand = (cmd: string, input: string) => {
    const line = input ? `${cmd} ${input}` : cmd
    const newScript = script ? script + '\n' + line : line
    setScript(newScript)
    setBlockInput('')
  }

  const handleValidate = async () => {
    try {
      const result = await window.icarus.validateScript(script)
      setValidation(result)
    } catch {
      setValidation({ valid: false, errors: ['Validation unavailable'] })
    }
  }

  const handleCopy = async () => {
    try {
      await window.icarus.copyToClipboard(script)
    } catch {
      await navigator.clipboard.writeText(script)
    }
    setCopyFeedback(true)
    setTimeout(() => setCopyFeedback(false), 1500)
  }

  const handleSave = async () => {
    try {
      await window.icarus.saveFile(script, 'payload.txt')
    } catch {
      const blob = new Blob([script], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'payload.txt'
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  const handleOpen = async () => {
    try {
      const file = await window.icarus.openFile()
      if (file) setScript(file.content)
    } catch {
      // No fallback for file open
    }
  }

  const lines = script.split('\n')

  // Estimated execution time
  const estimatedMs = lines.reduce((acc, line) => {
    const m = line.trim().match(/^DELAY\s+(\d+)$/i)
    if (m) return acc + parseInt(m[1])
    if (line.trim().startsWith('STRING ')) return acc + line.length * 15
    if (line.trim()) return acc + 50
    return acc
  }, 0)
  const estimatedTime = `${(estimatedMs / 1000).toFixed(1)}s`

  return (
    <motion.div
      className="h-full flex flex-col"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div className="p-4 border-b border-gold-muted/20 flex items-center gap-3">
        <Hammer className="w-5 h-5 text-gold" />
        <h1 className="font-display text-lg text-gold glow-text tracking-wider">FORGE</h1>
        <span className="text-xs text-text-tertiary font-mono">Payload Builder</span>
        <div className="flex-1" />
        <span className="text-xs font-mono text-text-tertiary">{lineCount} lines | {charCount} chars | <span className="text-gold">{estimatedTime} est.</span></span>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Command blocks sidebar */}
        <div className="w-52 border-r border-gold-muted/20 bg-bg-surface/50 p-3 overflow-y-auto flex-shrink-0">
          <h3 className="font-display text-xs text-gold-dark tracking-wider mb-3">COMMAND BLOCKS</h3>
          <div className="space-y-2">
            {COMMAND_BLOCKS.map((block) => {
              const Icon = block.icon
              return (
                <div key={block.cmd} className="space-y-1">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      if (!block.hasInput) {
                        insertCommand(block.cmd, '')
                      }
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-md glass-panel hover:border-gold/20 cursor-pointer text-left"
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" style={{ color: block.color }} />
                    <span className="text-xs font-mono text-text-primary">{block.label}</span>
                  </motion.button>
                  {block.hasInput && (
                    <div className="flex gap-1">
                      <input
                        type={block.inputType}
                        placeholder={block.placeholder}
                        className="flex-1 px-2 py-1 bg-bg-void/50 border border-gold-muted/20 rounded text-xs font-mono text-text-primary placeholder:text-text-tertiary/50 min-w-0"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            insertCommand(block.cmd, (e.target as HTMLInputElement).value);
                            (e.target as HTMLInputElement).value = ''
                          }
                        }}
                      />
                      <button
                        onClick={(e) => {
                          const input = (e.currentTarget.previousElementSibling as HTMLInputElement)
                          insertCommand(block.cmd, input.value)
                          input.value = ''
                        }}
                        className="px-2 py-1 bg-gold/10 border border-gold/20 rounded text-gold text-xs hover:bg-gold/20"
                      >+</button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Editor area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center gap-2 p-2 border-b border-gold-muted/10 bg-bg-surface/30">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleOpen} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-text-secondary hover:text-gold bg-bg-void/30 rounded border border-gold-muted/10 hover:border-gold/20">
              <FileUp className="w-3.5 h-3.5" /> Open
            </motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleSave} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-text-secondary hover:text-gold bg-bg-void/30 rounded border border-gold-muted/10 hover:border-gold/20">
              <Download className="w-3.5 h-3.5" /> Save
            </motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleCopy} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-text-secondary hover:text-gold bg-bg-void/30 rounded border border-gold-muted/10 hover:border-gold/20">
              <Copy className="w-3.5 h-3.5" /> {copyFeedback ? 'Copied!' : 'Copy'}
            </motion.button>
            <div className="flex-1" />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleValidate}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-display text-gold bg-gold/10 rounded border border-gold/30 hover:bg-gold/20"
            >
              <CheckCircle className="w-3.5 h-3.5" /> Validate
            </motion.button>
          </div>

          {/* Code editor */}
          <div className="flex-1 overflow-y-auto relative">
            <div className="flex h-full">
              {/* Line numbers */}
              <div className="flex-shrink-0 py-3 pl-2 pr-1 bg-bg-void/30 border-r border-gold-muted/10 select-none">
                {lines.map((_, i) => (
                  <div key={i} className="text-right text-[11px] font-mono text-text-tertiary/40 leading-[1.65] pr-2">
                    {i + 1}
                  </div>
                ))}
              </div>

              {/* Highlighted overlay */}
              <div className="absolute left-10 top-0 right-0 pointer-events-none py-3 px-3">
                {lines.map((line, i) => (
                  <div key={i} className={`text-xs font-mono leading-[1.65] whitespace-pre ${highlightLine(line)}`}>
                    {line || '\u00A0'}
                  </div>
                ))}
              </div>

              {/* Actual textarea */}
              <textarea
                ref={textareaRef}
                value={script}
                onChange={e => setScript(e.target.value)}
                className="flex-1 bg-transparent text-transparent caret-gold p-3 font-mono text-xs leading-[1.65] resize-none outline-none"
                spellCheck={false}
                placeholder="Write your DuckyScript here or use the command blocks..."
              />
            </div>
          </div>

          {/* Validation results */}
          {validation && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="border-t border-gold-muted/20 p-3 max-h-32 overflow-y-auto"
            >
              {validation.valid ? (
                <div className="flex items-center gap-2 text-green-400 text-xs font-mono">
                  <CheckCircle className="w-4 h-4" />
                  Script is valid! No syntax errors found.
                </div>
              ) : (
                <div className="space-y-1">
                  {validation.errors.map((err, i) => (
                    <div key={i} className="flex items-center gap-2 text-red-400 text-xs font-mono">
                      <XCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      {err}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Preview panel */}
        <div className="w-72 border-l border-gold-muted/20 bg-bg-surface/30 p-4 overflow-y-auto flex-shrink-0">
          <h3 className="font-display text-xs text-gold-dark tracking-wider mb-3">EXECUTION PREVIEW</h3>
          {lines.filter(l => l.trim()).length === 0 ? (
            <p className="text-xs text-text-tertiary font-body">Enter commands to see the execution flow preview.</p>
          ) : (
            <div className="space-y-1.5">
              {lines.map((line, i) => {
                const trimmed = line.trim()
                if (!trimmed) return null
                const parts = trimmed.split(/\s+/)
                const cmd = parts[0]
                const rest = parts.slice(1).join(' ')

                let icon = <Keyboard className="w-3 h-3 text-gold" />
                let label = trimmed
                let timing = ''

                if (cmd === 'DELAY') {
                  icon = <Clock className="w-3 h-3 text-cyan-400" />
                  timing = `${rest}ms`
                  label = `Wait ${rest}ms`
                } else if (cmd === 'STRING') {
                  icon = <Type className="w-3 h-3 text-green-400" />
                  label = `Type: "${rest.slice(0, 40)}${rest.length > 40 ? '...' : ''}"`
                } else if (cmd === 'REM') {
                  icon = <MessageSquare className="w-3 h-3 text-gray-500" />
                  label = `// ${rest.slice(0, 40)}`
                } else if (cmd === 'ENTER') {
                  label = 'Press ENTER'
                } else if (cmd === 'GUI' || cmd === 'WINDOWS') {
                  label = `Win+${rest}`
                } else if (cmd === 'REPEAT') {
                  icon = <RotateCcw className="w-3 h-3 text-purple-400" />
                  label = `Repeat ${rest}x`
                }

                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 5 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className="flex items-center gap-2 py-1 px-2 rounded bg-bg-void/30 border border-gold-muted/5"
                  >
                    {icon}
                    <span className="text-[10px] font-mono text-text-secondary flex-1 truncate">{label}</span>
                    {timing && <span className="text-[9px] font-mono text-cyan-400/60">{timing}</span>}
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
