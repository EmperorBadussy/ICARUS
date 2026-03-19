import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AcademyState {
  xp: number
  level: number
  streak: number
  lastActive: string | null
  completedLessons: string[]
  completedChallenges: string[]
  achievements: string[]
  currentTrack: string | null
  currentLesson: string | null
  addXP: (amount: number) => void
  completeLesson: (id: string) => void
  completeChallenge: (id: string) => void
  addAchievement: (id: string) => void
  setCurrentTrack: (id: string | null) => void
  setCurrentLesson: (id: string | null) => void
  updateStreak: () => void
}

const XP_PER_LEVEL = 100

export const useAcademyStore = create<AcademyState>()(
  persist(
    (set, get) => ({
      xp: 0,
      level: 1,
      streak: 0,
      lastActive: null,
      completedLessons: [],
      completedChallenges: [],
      achievements: [],
      currentTrack: null,
      currentLesson: null,

      addXP: (amount) => {
        const state = get()
        const newXP = state.xp + amount
        const newLevel = Math.floor(newXP / XP_PER_LEVEL) + 1
        const newAchievements = [...state.achievements]
        if (newLevel >= 10 && !newAchievements.includes('ICARUS_MASTER')) {
          newAchievements.push('ICARUS_MASTER')
        }
        set({ xp: newXP, level: newLevel, achievements: newAchievements })
      },

      completeLesson: (id) => {
        const state = get()
        if (state.completedLessons.includes(id)) return
        const newCompleted = [...state.completedLessons, id]
        const newAchievements = [...state.achievements]

        if (newCompleted.length === 1 && !newAchievements.includes('FIRST_FLIGHT')) {
          newAchievements.push('FIRST_FLIGHT')
        }

        const fundLessons = ['fund-1', 'fund-2', 'fund-3']
        const engLessons = ['eng-1', 'eng-2', 'eng-3']
        const advLessons = ['adv-1', 'adv-2', 'adv-3']
        const defLessons = ['def-1', 'def-2', 'def-3']

        if (fundLessons.every(l => newCompleted.includes(l)) && !newAchievements.includes('SCRIPTER')) {
          newAchievements.push('SCRIPTER')
        }
        if (engLessons.every(l => newCompleted.includes(l)) && !newAchievements.includes('ENGINEER')) {
          newAchievements.push('ENGINEER')
        }
        if (advLessons.every(l => newCompleted.includes(l)) && !newAchievements.includes('INFILTRATOR')) {
          newAchievements.push('INFILTRATOR')
        }
        if (defLessons.every(l => newCompleted.includes(l)) && !newAchievements.includes('DEFENDER')) {
          newAchievements.push('DEFENDER')
        }

        const allLessons = [...fundLessons, ...engLessons, ...advLessons, ...defLessons]
        if (allLessons.every(l => newCompleted.includes(l)) && !newAchievements.includes('WINGS_COMPLETE')) {
          newAchievements.push('WINGS_COMPLETE')
        }

        set({ completedLessons: newCompleted, achievements: newAchievements })
      },

      completeChallenge: (id) => {
        const state = get()
        if (state.completedChallenges.includes(id)) return
        const newCompleted = [...state.completedChallenges, id]
        const newAchievements = [...state.achievements]

        if (newCompleted.length >= 2 && !newAchievements.includes('CHALLENGE_HUNTER')) {
          newAchievements.push('CHALLENGE_HUNTER')
        }
        if (newCompleted.length >= 4 && !newAchievements.includes('PERFECT_FLIGHT')) {
          newAchievements.push('PERFECT_FLIGHT')
        }

        set({ completedChallenges: newCompleted, achievements: newAchievements })
      },

      addAchievement: (id) => {
        const state = get()
        if (state.achievements.includes(id)) return
        set({ achievements: [...state.achievements, id] })
      },

      setCurrentTrack: (id) => set({ currentTrack: id }),
      setCurrentLesson: (id) => set({ currentLesson: id }),

      updateStreak: () => {
        const state = get()
        const today = new Date().toISOString().split('T')[0]
        if (state.lastActive === today) return

        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
        const newStreak = state.lastActive === yesterday ? state.streak + 1 : 1
        const newAchievements = [...state.achievements]
        if (newStreak >= 3 && !newAchievements.includes('STREAK_3')) {
          newAchievements.push('STREAK_3')
        }
        set({ streak: newStreak, lastActive: today, achievements: newAchievements })
      }
    }),
    { name: 'icarus-academy' }
  )
)
