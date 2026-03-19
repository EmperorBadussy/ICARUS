import { motion } from 'framer-motion'
import { CheckCircle, Circle, Lock, Zap, BookOpen, Swords } from 'lucide-react'
import { useAcademyStore } from '../../lib/stores/academyStore'
import type { Track } from './courseData'

interface Props {
  track: Track
  onSelectLesson: (id: string) => void
  onSelectChallenge: (id: string) => void
}

export default function CourseTrack({ track, onSelectLesson, onSelectChallenge }: Props) {
  const store = useAcademyStore()

  const allLessonsComplete = track.lessons.every(l => store.completedLessons.includes(l.id))
  const challengeComplete = store.completedChallenges.includes(track.challenge.id)

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Track header */}
      <div className="glass-panel-bright p-6 mb-6">
        <div className="flex items-center gap-4">
          <span className="text-4xl">{track.icon}</span>
          <div>
            <h1 className="font-display text-2xl text-gold glow-text">{track.name}</h1>
            <p className="text-sm text-text-secondary font-body mt-1">{track.description}</p>
          </div>
        </div>
      </div>

      {/* Skill tree / lesson list */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gold-muted/20" />

        <div className="space-y-4">
          {track.lessons.map((lesson, idx) => {
            const completed = store.completedLessons.includes(lesson.id)
            const prevCompleted = idx === 0 || store.completedLessons.includes(track.lessons[idx - 1].id)
            const locked = !prevCompleted && !completed

            return (
              <motion.button
                key={lesson.id}
                whileHover={!locked ? { scale: 1.01, x: 4 } : {}}
                whileTap={!locked ? { scale: 0.99 } : {}}
                onClick={() => !locked && onSelectLesson(lesson.id)}
                disabled={locked}
                className={`relative w-full flex items-center gap-4 pl-12 pr-4 py-4 text-left glass-panel transition-all ${
                  locked
                    ? 'opacity-40 cursor-not-allowed'
                    : completed
                    ? 'border-gold/20 hover:border-gold/40'
                    : 'hover:border-gold/30 cursor-pointer'
                }`}
              >
                {/* Node on the line */}
                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                  {completed ? (
                    <CheckCircle className="w-5 h-5 text-gold" />
                  ) : locked ? (
                    <Lock className="w-5 h-5 text-text-tertiary" />
                  ) : (
                    <Circle className="w-5 h-5 text-gold-bright" />
                  )}
                </div>

                <BookOpen className="w-5 h-5 text-gold-bright flex-shrink-0" />
                <div className="flex-1">
                  <div className="font-display text-sm text-text-primary">{lesson.title}</div>
                  <div className="text-xs text-text-tertiary font-mono">Lesson {idx + 1}</div>
                </div>
                <div className="flex items-center gap-1 text-xs font-mono text-gold-bright">
                  <Zap className="w-3 h-3" />
                  {lesson.xp} XP
                </div>
              </motion.button>
            )
          })}

          {/* Challenge */}
          <motion.button
            whileHover={allLessonsComplete ? { scale: 1.01, x: 4 } : {}}
            whileTap={allLessonsComplete ? { scale: 0.99 } : {}}
            onClick={() => allLessonsComplete && onSelectChallenge(track.challenge.id)}
            disabled={!allLessonsComplete}
            className={`relative w-full flex items-center gap-4 pl-12 pr-4 py-4 text-left glass-panel-bright transition-all ${
              !allLessonsComplete
                ? 'opacity-40 cursor-not-allowed'
                : challengeComplete
                ? 'border-gold/30 gold-glow-border'
                : 'hover:border-gold/40 cursor-pointer border-gold-bright/20'
            }`}
          >
            <div className="absolute left-4 top-1/2 -translate-y-1/2">
              {challengeComplete ? (
                <CheckCircle className="w-5 h-5 text-gold" />
              ) : !allLessonsComplete ? (
                <Lock className="w-5 h-5 text-text-tertiary" />
              ) : (
                <Swords className="w-5 h-5 text-gold-bright animate-pulse-glow" />
              )}
            </div>

            <Swords className="w-5 h-5 text-gold-bright flex-shrink-0" />
            <div className="flex-1">
              <div className="font-display text-sm text-gold-bright">CHALLENGE: {track.challenge.title}</div>
              <div className="text-xs text-text-tertiary font-mono">{track.challenge.description}</div>
            </div>
            <div className="flex items-center gap-1 text-xs font-mono text-gold-bright">
              <Zap className="w-3 h-3" />
              {track.challenge.xp} XP
            </div>
          </motion.button>
        </div>
      </div>
    </div>
  )
}
