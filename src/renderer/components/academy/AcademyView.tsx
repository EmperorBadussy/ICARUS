import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GraduationCap, Trophy, Flame, Star, ChevronRight, Zap } from 'lucide-react'
import { useAcademyStore } from '../../lib/stores/academyStore'
import { TRACKS, ACHIEVEMENTS } from './courseData'
import CourseTrack from './CourseTrack'
import LessonView from './LessonView'
import ChallengeView from './ChallengeView'

export default function AcademyView() {
  const store = useAcademyStore()
  const [view, setView] = useState<'tracks' | 'track' | 'lesson' | 'challenge'>('tracks')
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null)
  const [selectedLesson, setSelectedLesson] = useState<string | null>(null)
  const [selectedChallenge, setSelectedChallenge] = useState<string | null>(null)
  const [xpPopup, setXpPopup] = useState<{ amount: number; id: number } | null>(null)

  useEffect(() => {
    store.updateStreak()
  }, [])

  const showXP = (amount: number) => {
    const id = Date.now()
    setXpPopup({ amount, id })
    setTimeout(() => setXpPopup(null), 1500)
  }

  const openTrack = (trackId: string) => {
    setSelectedTrack(trackId)
    setView('track')
  }

  const openLesson = (lessonId: string) => {
    setSelectedLesson(lessonId)
    setView('lesson')
  }

  const openChallenge = (challengeId: string) => {
    setSelectedChallenge(challengeId)
    setView('challenge')
  }

  const goBack = () => {
    if (view === 'lesson' || view === 'challenge') setView('track')
    else if (view === 'track') setView('tracks')
  }

  const track = selectedTrack ? TRACKS.find(t => t.id === selectedTrack) : null

  const getTrackProgress = (trackId: string) => {
    const t = TRACKS.find(tr => tr.id === trackId)
    if (!t) return 0
    const total = t.lessons.length + 1
    const completed = t.lessons.filter(l => store.completedLessons.includes(l.id)).length +
      (store.completedChallenges.includes(t.challenge.id) ? 1 : 0)
    return Math.round((completed / total) * 100)
  }

  return (
    <motion.div className="h-full flex flex-col relative" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      {/* XP Popup */}
      <AnimatePresence>
        {xpPopup && (
          <motion.div
            key={xpPopup.id}
            initial={{ opacity: 0, y: 0, scale: 0.5 }}
            animate={{ opacity: 1, y: -60, scale: 1 }}
            exit={{ opacity: 0, y: -100 }}
            className="fixed top-20 right-20 z-50 flex items-center gap-2 px-4 py-2 bg-gold/30 border border-gold/50 rounded-lg"
          >
            <Zap className="w-5 h-5 text-gold-bright" />
            <span className="font-display text-xl text-gold-bright glow-text-bright">+{xpPopup.amount} XP</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gold-muted/30">
        <div className="flex items-center gap-3">
          <GraduationCap className="w-6 h-6 text-gold" />
          <h1 className="font-display text-xl text-gold glow-text tracking-wider">ACADEMY</h1>
          {view !== 'tracks' && (
            <button onClick={goBack} className="text-text-tertiary hover:text-text-secondary text-xs font-mono ml-2">
              &larr; Back
            </button>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-xs font-mono text-gold">
            {Array.from({ length: Math.min(store.streak, 5) }).map((_, i) => (
              <Flame key={i} className="w-3 h-3 text-gold" style={{ opacity: 0.5 + (i / 5) * 0.5 }} />
            ))}
            <span>{store.streak} day{store.streak !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-mono text-gold-bright">
            <Star className="w-4 h-4" />
            <span>Lv.{store.level}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-mono text-text-secondary">
            <Zap className="w-4 h-4 text-gold" />
            <span>{store.xp} XP</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {view === 'tracks' && (
            <motion.div key="tracks" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-4 space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-4 gap-3">
                <div className="glass-panel p-3 text-center">
                  <div className="text-2xl font-display text-gold glow-text">{store.level}</div>
                  <div className="text-xs font-mono text-text-tertiary">Level</div>
                </div>
                <div className="glass-panel p-3 text-center">
                  <div className="text-2xl font-display text-gold-bright">{store.xp}</div>
                  <div className="text-xs font-mono text-text-tertiary">Total XP</div>
                </div>
                <div className="glass-panel p-3 text-center">
                  <div className="text-2xl font-display text-gold-light">{store.completedLessons.length}</div>
                  <div className="text-xs font-mono text-text-tertiary">Lessons</div>
                </div>
                <div className="glass-panel p-3 text-center">
                  <div className="text-2xl font-display text-gold-light">{store.completedChallenges.length}</div>
                  <div className="text-xs font-mono text-text-tertiary">Challenges</div>
                </div>
              </div>

              {/* XP Progress bar */}
              <div className="glass-panel p-3">
                <div className="flex justify-between text-xs font-mono text-text-tertiary mb-1">
                  <span>Level {store.level}</span>
                  <span>{store.xp % 100} / 100 XP</span>
                  <span>Level {store.level + 1}</span>
                </div>
                <div className="w-full h-2 bg-bg-void rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-gold-muted via-gold to-gold-bright"
                    animate={{ width: `${store.xp % 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>

              {/* Tracks */}
              <div>
                <h2 className="font-display text-sm text-gold-bright tracking-wider mb-3">LEARNING TRACKS</h2>
                <div className="grid grid-cols-2 gap-4">
                  {TRACKS.map((t, index) => {
                    const progress = getTrackProgress(t.id)
                    return (
                      <motion.button
                        key={t.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.08, duration: 0.4 }}
                        whileHover={{ scale: 1.02, boxShadow: '0 0 18px rgba(234,179,8,0.2)' }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => openTrack(t.id)}
                        className="glass-panel-bright p-4 text-left transition-all hover:border-gold/30 cursor-pointer"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-2xl">{t.icon}</span>
                          <div>
                            <div className="font-display text-sm text-gold">{t.name}</div>
                            <div className="text-xs text-text-tertiary font-body">{t.description}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                          <div className="flex-1 h-1.5 bg-bg-void rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gold transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-xs font-mono text-text-tertiary">{progress}%</span>
                          <ChevronRight className="w-4 h-4 text-gold-muted" />
                        </div>
                      </motion.button>
                    )
                  })}
                </div>
              </div>

              {/* Achievements */}
              <div>
                <h2 className="font-display text-sm text-gold-bright tracking-wider mb-3">ACHIEVEMENTS</h2>
                <div className="grid grid-cols-5 gap-3">
                  {ACHIEVEMENTS.map((a, index) => {
                    const earned = store.achievements.includes(a.id)
                    return (
                      <motion.div
                        key={a.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: earned ? 1 : 0.4, scale: 1 }}
                        transition={{ delay: index * 0.04, duration: 0.3 }}
                        whileHover={earned ? { scale: 1.08, boxShadow: '0 0 20px rgba(234,179,8,0.35)' } : {}}
                        className={`glass-panel p-3 text-center transition-all ${earned ? 'border-gold/30 gold-glow-border' : ''}`}
                        title={a.description}
                      >
                        <div className="text-2xl mb-1">{a.icon}</div>
                        <div className="text-xs font-mono text-text-secondary">{a.name}</div>
                        {earned && <Trophy className="w-3 h-3 text-gold mx-auto mt-1" />}
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {view === 'track' && track && (
            <motion.div key="track" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <CourseTrack
                track={track}
                onSelectLesson={openLesson}
                onSelectChallenge={openChallenge}
              />
            </motion.div>
          )}

          {view === 'lesson' && selectedLesson && (
            <motion.div key="lesson" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <LessonView
                lessonId={selectedLesson}
                onComplete={(xp) => showXP(xp)}
                onBack={goBack}
              />
            </motion.div>
          )}

          {view === 'challenge' && selectedChallenge && (
            <motion.div key="challenge" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ChallengeView
                challengeId={selectedChallenge}
                onComplete={(xp) => showXP(xp)}
                onBack={goBack}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
