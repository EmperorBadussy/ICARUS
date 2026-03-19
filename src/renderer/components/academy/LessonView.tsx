import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, CheckCircle, Zap } from 'lucide-react'
import { useAcademyStore } from '../../lib/stores/academyStore'
import { playXPGain } from '../../lib/bootAudio'
import { useAppStore } from '../../lib/stores/app'
import { TRACKS } from './courseData'

interface Props {
  lessonId: string
  onComplete: (xp: number) => void
  onBack: () => void
}

function renderInline(text: string): (string | JSX.Element)[] {
  const parts: (string | JSX.Element)[] = []
  const regex = /(\*\*[^*]+\*\*|`[^`]+`)/g
  let lastIdx = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      parts.push(text.slice(lastIdx, match.index))
    }
    const m = match[0]
    if (m.startsWith('**')) {
      parts.push(<strong key={match.index} className="text-gold-bright font-semibold">{m.slice(2, -2)}</strong>)
    } else if (m.startsWith('`')) {
      parts.push(<code key={match.index} className="bg-bg-void/50 px-1.5 py-0.5 rounded text-xs font-mono text-gold-light">{m.slice(1, -1)}</code>)
    }
    lastIdx = match.index + m.length
  }
  if (lastIdx < text.length) parts.push(text.slice(lastIdx))
  return parts
}

function renderContent(content: string) {
  const lines = content.split('\n')
  const elements: JSX.Element[] = []

  let inCodeBlock = false
  let codeLines: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    if (line.startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <pre key={`code-${i}`} className="bg-bg-void border border-gold-muted/20 rounded p-4 my-3 overflow-x-auto text-xs font-mono text-gold-bright">
            {codeLines.join('\n')}
          </pre>
        )
        codeLines = []
        inCodeBlock = false
      } else {
        inCodeBlock = true
      }
      continue
    }

    if (inCodeBlock) {
      codeLines.push(line)
      continue
    }

    if (line.startsWith('# ')) {
      elements.push(<h1 key={i} className="text-2xl font-display text-gold glow-text mt-6 mb-3">{line.slice(2)}</h1>)
    } else if (line.startsWith('## ')) {
      elements.push(<h2 key={i} className="text-lg font-display text-gold-bright mt-5 mb-2">{line.slice(3)}</h2>)
    } else if (line.startsWith('### ')) {
      elements.push(<h3 key={i} className="text-sm font-display text-gold-light mt-4 mb-2">{line.slice(4)}</h3>)
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      elements.push(
        <div key={i} className="flex gap-2 ml-4 my-0.5 text-sm font-body text-text-primary">
          <span className="text-gold mt-1">-</span>
          <span>{renderInline(line.slice(2))}</span>
        </div>
      )
    } else if (/^\d+\. /.test(line)) {
      const match = line.match(/^(\d+)\. (.+)/)
      if (match) {
        elements.push(
          <div key={i} className="flex gap-2 ml-4 my-0.5 text-sm font-body text-text-primary">
            <span className="text-gold-bright font-mono text-xs min-w-[20px]">{match[1]}.</span>
            <span>{renderInline(match[2])}</span>
          </div>
        )
      }
    } else if (line.startsWith('|') && line.includes('|')) {
      const cells = line.split('|').filter(c => c.trim()).map(c => c.trim())
      if (cells.some(c => /^-+$/.test(c))) continue
      elements.push(
        <div key={i} className="flex gap-4 py-1 px-2 text-xs font-mono text-text-primary border-b border-gold-muted/10">
          {cells.map((cell, ci) => (
            <span key={ci} className="flex-1">{cell}</span>
          ))}
        </div>
      )
    } else if (line.startsWith('---')) {
      elements.push(<hr key={i} className="border-gold-muted/20 my-4" />)
    } else if (line.trim() === '') {
      elements.push(<div key={i} className="h-2" />)
    } else {
      elements.push(<p key={i} className="text-sm font-body text-text-primary leading-relaxed my-1">{renderInline(line)}</p>)
    }
  }

  return elements
}

export default function LessonView({ lessonId, onComplete, onBack }: Props) {
  const store = useAcademyStore()
  const soundEnabled = useAppStore(s => s.soundEnabled)

  const { lesson, trackLessons, currentIdx } = useMemo(() => {
    for (const track of TRACKS) {
      const idx = track.lessons.findIndex(l => l.id === lessonId)
      if (idx !== -1) {
        return { lesson: track.lessons[idx], trackLessons: track.lessons, currentIdx: idx }
      }
    }
    return { lesson: null, trackLessons: [], currentIdx: -1 }
  }, [lessonId])

  if (!lesson) return null

  const isCompleted = store.completedLessons.includes(lesson.id)

  const handleComplete = () => {
    if (!isCompleted) {
      store.completeLesson(lesson.id)
      store.addXP(lesson.xp)
      store.updateStreak()
      if (soundEnabled) playXPGain()
      onComplete(lesson.xp)
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="flex items-center gap-1 text-xs font-mono text-text-tertiary hover:text-text-secondary">
          <ChevronLeft className="w-4 h-4" /> Back to track
        </button>
        <span className="text-xs font-mono text-text-tertiary">
          {currentIdx + 1} / {trackLessons.length}
        </span>
      </div>

      {/* Lesson content */}
      <div className="glass-panel-bright p-8">
        {renderContent(lesson.content).map((element, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.02, duration: 0.3 }}
          >
            {element}
          </motion.div>
        ))}
      </div>

      {/* Complete button */}
      <div className="mt-6 flex justify-center">
        {isCompleted ? (
          <div className="flex items-center gap-2 px-6 py-3 glass-panel border-gold/30 text-gold font-display tracking-wider">
            <CheckCircle className="w-5 h-5" />
            COMPLETED
          </div>
        ) : (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleComplete}
            className="flex items-center gap-2 px-8 py-3 bg-gold/20 border border-gold/50 rounded-lg text-gold font-display tracking-wider hover:bg-gold/30 transition-all gold-glow-border"
          >
            <Zap className="w-5 h-5" />
            MARK COMPLETE (+{lesson.xp} XP)
          </motion.button>
        )}
      </div>
    </div>
  )
}
