import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Swords, CheckCircle, XCircle, Lightbulb, Zap, ChevronLeft, ChevronRight } from 'lucide-react'
import { useAcademyStore } from '../../lib/stores/academyStore'
import { playOkBeep, playWarnTone, playXPGain } from '../../lib/bootAudio'
import { useAppStore } from '../../lib/stores/app'
import { TRACKS } from './courseData'

interface Props {
  challengeId: string
  onComplete: (xp: number) => void
  onBack: () => void
}

export default function ChallengeView({ challengeId, onComplete, onBack }: Props) {
  const store = useAcademyStore()
  const soundEnabled = useAppStore(s => s.soundEnabled)

  const challenge = useMemo(() => {
    for (const track of TRACKS) {
      if (track.challenge.id === challengeId) return track.challenge
    }
    return null
  }, [challengeId])

  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [hintsUsed, setHintsUsed] = useState(0)
  const [visibleHints, setVisibleHints] = useState<number[]>([])
  const [finished, setFinished] = useState(false)
  const [shakeQuestion, setShakeQuestion] = useState(false)
  const [glowCorrect, setGlowCorrect] = useState(false)

  if (!challenge) return null

  const isCompleted = store.completedChallenges.includes(challenge.id)
  const question = challenge.questions[currentQuestion]
  const isCorrect = selectedAnswer === question.correctAnswer

  const handleSubmit = () => {
    if (selectedAnswer === null) return
    setShowResult(true)
    if (selectedAnswer === question.correctAnswer) {
      setCorrectCount(c => c + 1)
      setGlowCorrect(true)
      setTimeout(() => setGlowCorrect(false), 800)
      if (soundEnabled) playOkBeep()
    } else {
      setShakeQuestion(true)
      setTimeout(() => setShakeQuestion(false), 500)
      if (soundEnabled) playWarnTone()
    }
  }

  const handleNext = () => {
    if (currentQuestion < challenge.questions.length - 1) {
      setCurrentQuestion(q => q + 1)
      setSelectedAnswer(null)
      setShowResult(false)
      setVisibleHints([])
    } else {
      setFinished(true)
      if (correctCount >= 3 && !isCompleted) {
        const xp = Math.max(0, challenge.xp - hintsUsed * 5)
        store.completeChallenge(challenge.id)
        store.addXP(xp)
        store.updateStreak()
        if (soundEnabled) playXPGain()
        onComplete(xp)
      }
    }
  }

  const revealHint = () => {
    const nextHintIdx = visibleHints.length
    if (nextHintIdx < question.hints.length) {
      setVisibleHints([...visibleHints, nextHintIdx])
      setHintsUsed(h => h + 1)
    }
  }

  if (finished) {
    const passed = correctCount >= 3
    const xpEarned = passed ? Math.max(0, challenge.xp - hintsUsed * 5) : 0

    return (
      <div className="max-w-2xl mx-auto p-6">
        <button onClick={onBack} className="flex items-center gap-1 text-xs font-mono text-text-tertiary hover:text-text-secondary mb-4">
          <ChevronLeft className="w-4 h-4" /> Back to track
        </button>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`glass-panel-bright p-8 text-center ${passed ? 'border-gold/30' : 'border-red-500/20'}`}
        >
          {passed ? (
            <>
              <CheckCircle className="w-16 h-16 text-gold mx-auto mb-4" />
              <h2 className="font-display text-2xl text-gold glow-text mb-2">CHALLENGE COMPLETE</h2>
              <p className="text-text-secondary font-body mb-4">
                You answered {correctCount} out of {challenge.questions.length} correctly.
              </p>
              <div className="flex items-center justify-center gap-2 text-gold-bright font-display text-xl">
                <Zap className="w-5 h-5" />
                +{xpEarned} XP earned
              </div>
              {hintsUsed > 0 && (
                <p className="text-xs text-text-tertiary font-mono mt-2">(-{hintsUsed * 5} XP for {hintsUsed} hint{hintsUsed > 1 ? 's' : ''} used)</p>
              )}
            </>
          ) : (
            <>
              <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h2 className="font-display text-2xl text-red-400 mb-2">NOT QUITE</h2>
              <p className="text-text-secondary font-body mb-4">
                You got {correctCount} out of {challenge.questions.length}. You need at least 3 correct to pass.
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setCurrentQuestion(0)
                  setSelectedAnswer(null)
                  setShowResult(false)
                  setCorrectCount(0)
                  setHintsUsed(0)
                  setVisibleHints([])
                  setFinished(false)
                }}
                className="px-6 py-2 bg-gold/20 border border-gold/40 rounded text-gold font-display hover:bg-gold/30"
              >
                TRY AGAIN
              </motion.button>
            </>
          )}
        </motion.div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <button onClick={onBack} className="flex items-center gap-1 text-xs font-mono text-text-tertiary hover:text-text-secondary mb-4">
        <ChevronLeft className="w-4 h-4" /> Back to track
      </button>

      {/* Challenge header */}
      <div className="glass-panel p-4 mb-4 flex items-center gap-3">
        <Swords className="w-6 h-6 text-gold-bright" />
        <div>
          <h1 className="font-display text-lg text-gold">{challenge.title}</h1>
          <p className="text-xs text-text-tertiary font-body">{challenge.description}</p>
        </div>
        <div className="ml-auto text-xs font-mono text-text-tertiary">
          {currentQuestion + 1} / {challenge.questions.length}
        </div>
      </div>

      {/* Progress dots */}
      <div className="flex gap-2 mb-4 justify-center">
        {challenge.questions.map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-all ${
              i === currentQuestion ? 'bg-gold scale-125' : i < currentQuestion ? 'bg-gold-muted' : 'bg-bg-void border border-gold-muted/30'
            }`}
          />
        ))}
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="space-y-4"
        >
          <div className={`glass-panel-bright p-6 ${shakeQuestion ? 'animate-shake' : ''} ${glowCorrect ? 'animate-green-glow' : ''}`}>
            <p className="text-sm font-body text-text-primary leading-relaxed whitespace-pre-line">{question.prompt}</p>
          </div>

          {/* Options */}
          <div className="space-y-2">
            {question.options?.map((option, i) => {
              const isSelected = selectedAnswer === i
              const isCorrectOption = i === question.correctAnswer
              let cls = 'glass-panel p-4 cursor-pointer transition-all text-left w-full flex items-center gap-3'

              if (showResult) {
                if (isCorrectOption) cls += ' border-green-500/50 bg-green-900/10'
                else if (isSelected && !isCorrectOption) cls += ' border-red-500/50 bg-red-900/10'
              } else {
                if (isSelected) cls += ' border-gold/50 bg-gold/10'
                else cls += ' hover:border-gold/20'
              }

              return (
                <motion.button
                  key={i}
                  whileHover={!showResult ? { scale: 1.01 } : {}}
                  onClick={() => !showResult && setSelectedAnswer(i)}
                  className={cls}
                  disabled={showResult}
                >
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-mono ${
                    showResult && isCorrectOption ? 'border-green-400 text-green-400' :
                    showResult && isSelected && !isCorrectOption ? 'border-red-400 text-red-400' :
                    isSelected ? 'border-gold text-gold' : 'border-gold-muted/40 text-text-tertiary'
                  }`}>
                    {showResult && isCorrectOption ? <CheckCircle className="w-4 h-4" /> :
                     showResult && isSelected && !isCorrectOption ? <XCircle className="w-4 h-4" /> :
                     String.fromCharCode(65 + i)}
                  </div>
                  <span className="text-sm font-body text-text-primary">{option}</span>
                </motion.button>
              )
            })}
          </div>

          {/* Explanation */}
          <AnimatePresence>
            {showResult && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={`glass-panel p-4 border ${isCorrect ? 'border-green-500/30' : 'border-red-500/30'}`}
              >
                <p className="text-sm font-body text-text-primary">{question.explanation}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Hints */}
          {!showResult && (
            <div className="space-y-2">
              {visibleHints.map(hIdx => (
                <motion.div
                  key={hIdx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-panel p-3 flex items-center gap-2 border-yellow-500/20"
                >
                  <Lightbulb className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                  <span className="text-xs font-body text-text-secondary">{question.hints[hIdx]}</span>
                </motion.div>
              ))}
              {visibleHints.length < question.hints.length && (
                <button
                  onClick={revealHint}
                  className="text-xs font-mono text-yellow-400/60 hover:text-yellow-400 flex items-center gap-1"
                >
                  <Lightbulb className="w-3 h-3" />
                  Hint ({visibleHints.length + 1}/{question.hints.length}) — costs 5 XP
                </button>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex justify-end gap-3">
            {!showResult ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleSubmit}
                disabled={selectedAnswer === null}
                className="px-6 py-2 bg-gold/20 border border-gold/40 rounded text-gold font-display tracking-wider hover:bg-gold/30 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                SUBMIT
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleNext}
                className="px-6 py-2 bg-gold/20 border border-gold/40 rounded text-gold font-display tracking-wider hover:bg-gold/30 flex items-center gap-2"
              >
                {currentQuestion < challenge.questions.length - 1 ? (
                  <>NEXT <ChevronRight className="w-4 h-4" /></>
                ) : (
                  'FINISH'
                )}
              </motion.button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
