import { useState, useEffect, useRef, useCallback } from 'react'
import { playCRTPowerOn, playKeystroke, playOkBeep, playWarnTone, playSolarFlare, playOnlineChime } from '../lib/bootAudio'
import { useAppStore } from '../lib/stores/app'

const BOOT_LINES = [
  '[BOOT] ICARUS v1.0.0 — USB PAYLOAD SYSTEM',
  '[INIT] Spreading wings...',
  '[WING] Script library .................... ONLINE',
  '[FORGE] Payload builder .................. ONLINE',
  '[FLIGHT] Deployment simulator ............ ONLINE',
  '[WAX] Encoder/obfuscator ................. ONLINE',
  '[SUN] Target configurator ................ ONLINE',
  '[SYS] DuckyScript templates: 200+',
  '[SYS] Supported targets: Win/Mac/Linux',
  '[NET] Payload database: LOADED',
  '[WARN] FLY RESPONSIBLY — AUTHORIZED TESTING ONLY',
  '[RDY] ALL SYSTEMS ONLINE',
  '',
  '██╗ ██████╗ █████╗ ██████╗ ██╗   ██╗███████╗',
  '██║██╔════╝██╔══██╗██╔══██╗██║   ██║██╔════╝',
  '██║██║     ███████║██████╔╝██║   ██║███████╗',
  '██║██║     ██╔══██║██╔══██╗██║   ██║╚════██║',
  '██║╚██████╗██║  ██║██║  ██║╚██████╔╝███████║',
  '╚═╝ ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝',
  '',
  'FLY TOO CLOSE TO THE SUN',
  '',
  '> PRESS ENTER TO PROCEED_'
]

const RED_KEYWORDS = ['WARN', 'CRITICAL', 'ERROR', 'OFFLINE', 'FAILED']
const GLOW_KEYWORDS = ['ONLINE', 'CONNECTED', 'LOADED']
const SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%^&*!<>{}[]'

interface Props {
  onComplete: () => void
}

export default function BootSequence({ onComplete }: Props) {
  const [displayedLines, setDisplayedLines] = useState<string[]>([])
  const [currentLineIdx, setCurrentLineIdx] = useState(0)
  const [scrambleText, setScrambleText] = useState('')
  const [bootDone, setBootDone] = useState(false)
  const [scanY, setScanY] = useState(0)
  const [crtFlash, setCrtFlash] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const soundEnabled = useAppStore((s) => s.soundEnabled)

  // CRT power-on flash effect
  useEffect(() => {
    const timer = setTimeout(() => setCrtFlash(false), 150)
    return () => clearTimeout(timer)
  }, [])

  // Wax drip particles on canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    interface Drop {
      x: number
      y: number
      vy: number
      radius: number
      opacity: number
    }

    const drops: Drop[] = []
    for (let i = 0; i < 60; i++) {
      drops.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height * -1,
        vy: 1 + Math.random() * 3,
        radius: 1 + Math.random() * 3,
        opacity: 0.3 + Math.random() * 0.7
      })
    }

    let animId: number
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (const d of drops) {
        d.y += d.vy
        if (d.y > canvas.height) {
          d.y = -10
          d.x = Math.random() * canvas.width
        }
        // Gold wax drop
        const grad = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, d.radius * 2)
        grad.addColorStop(0, `rgba(234, 179, 8, ${d.opacity})`)
        grad.addColorStop(0.5, `rgba(202, 138, 4, ${d.opacity * 0.5})`)
        grad.addColorStop(1, 'transparent')
        ctx.beginPath()
        ctx.arc(d.x, d.y, d.radius * 2, 0, Math.PI * 2)
        ctx.fillStyle = grad
        ctx.fill()

        // Trail
        ctx.beginPath()
        ctx.moveTo(d.x, d.y)
        ctx.lineTo(d.x, d.y - d.vy * 4)
        ctx.strokeStyle = `rgba(234, 179, 8, ${d.opacity * 0.3})`
        ctx.lineWidth = d.radius * 0.5
        ctx.stroke()
      }
      animId = requestAnimationFrame(animate)
    }
    animate()
    return () => cancelAnimationFrame(animId)
  }, [])

  // Scan line
  useEffect(() => {
    const interval = setInterval(() => {
      setScanY((prev) => (prev + 2) % window.innerHeight)
    }, 16)
    return () => clearInterval(interval)
  }, [])

  // Line-by-line scramble reveal
  useEffect(() => {
    if (currentLineIdx >= BOOT_LINES.length) {
      setBootDone(true)
      if (soundEnabled) playSolarFlare()
      return
    }

    const target = BOOT_LINES[currentLineIdx]

    if (target === '') {
      setDisplayedLines((prev) => [...prev, ''])
      setCurrentLineIdx((i) => i + 1)
      return
    }

    if (currentLineIdx === 0 && soundEnabled) playCRTPowerOn()
    if (target.includes('WARN') && soundEnabled) playWarnTone()
    if (target.includes('ONLINE') && soundEnabled) playOnlineChime()

    let iteration = 0
    const totalIterations = 12
    const interval = setInterval(() => {
      iteration++
      if (soundEnabled && iteration % 3 === 0) playKeystroke()

      if (iteration >= totalIterations) {
        clearInterval(interval)
        setScrambleText('')
        setDisplayedLines((prev) => [...prev, target])
        setCurrentLineIdx((i) => i + 1)
        return
      }

      const progress = iteration / totalIterations
      const revealedCount = Math.floor(target.length * progress)
      let text = ''
      for (let i = 0; i < target.length; i++) {
        if (i < revealedCount) {
          text += target[i]
        } else {
          text += SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)]
        }
      }
      setScrambleText(text)
    }, 50 + Math.random() * 30)

    return () => clearInterval(interval)
  }, [currentLineIdx, soundEnabled])

  // Auto-scroll
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [displayedLines, scrambleText])

  // Enter key handler
  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Enter' && bootDone) {
        onComplete()
      }
    },
    [bootDone, onComplete]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleKey])

  const colorize = (line: string) => {
    const hasRed = RED_KEYWORDS.some((kw) => line.includes(kw))
    const hasGlow = GLOW_KEYWORDS.some((kw) => line.includes(kw))
    const isAscii = line.startsWith('█') || line.startsWith('╚') || line.startsWith('╔') || line.startsWith('║') || line.startsWith('═')

    if (hasRed) return 'red'
    if (hasGlow) return 'green'
    if (isAscii) return 'bright'
    if (line.startsWith('>')) return 'bright'
    if (line === 'FLY TOO CLOSE TO THE SUN') return 'bright'
    return ''
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ background: '#0A0800', zIndex: 9999 }}
      onClick={() => bootDone && onComplete()}
    >
      {/* Wax rain canvas */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none"
        style={{ zIndex: 0 }}
      />

      {/* Scan lines */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 1 }}>
        <div
          className="absolute w-full"
          style={{
            top: scanY,
            height: '2px',
            background: 'linear-gradient(90deg, transparent, rgba(234,179,8,0.3), transparent)',
            boxShadow: '0 0 20px rgba(234,179,8,0.2)',
            transition: 'none'
          }}
        />
        <div className="absolute inset-0 crt-overlay" />
      </div>

      {/* Terminal content */}
      <div
        ref={containerRef}
        className="boot-terminal relative w-full max-w-3xl h-full max-h-[80vh] p-8 overflow-y-auto"
        style={{ zIndex: 2 }}
      >
        {displayedLines.map((line, i) => (
          <div key={i} className={colorize(line)}>
            {line || '\u00A0'}
          </div>
        ))}
        {scrambleText && (
          <div className="dim">{scrambleText}</div>
        )}
        {bootDone && (
          <div className="mt-2 bright animate-pulse-glow" style={{ cursor: 'pointer' }}>
            {''}
          </div>
        )}
      </div>

      {/* CRT power-on flash */}
      {crtFlash && (
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            background: 'rgba(255,255,255,0.8)',
            zIndex: 10,
            transition: 'opacity 0.15s ease-out'
          }}
        />
      )}

      {/* Vignette */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 50%, rgba(10,8,0,0.8) 100%)',
          zIndex: 3
        }}
      />
    </div>
  )
}
