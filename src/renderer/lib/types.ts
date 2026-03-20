export type ViewId = 'wings' | 'forge' | 'flight' | 'wax' | 'sun' | 'academy'

export interface DuckyScript {
  id: string
  name: string
  category: 'recon' | 'credentials' | 'reverse-shells' | 'persistence' | 'exfiltration' | 'network' | 'evasion' | 'pranks'
  description: string
  targetOS: ('windows' | 'macos' | 'linux')[]
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  executionTime: string
  detectionDifficulty: 'easy' | 'moderate' | 'hard' | 'very-hard'
  script: string
  notes?: string
  format: 'ducky' | 'flipper'
  flipperCompat?: boolean
}

export interface TargetProfile {
  os: 'windows' | 'macos' | 'linux'
  osVersion: string
  keyboardLayout: string
  defaultDelay: number
  postCommandDelay: number
  notes: Record<string, string>
}

export interface SimulationStep {
  type: 'keystroke' | 'delay' | 'command' | 'string'
  content: string
  timeMs: number
  warning?: string
}

declare global {
  interface Window {
    icarus: {
      saveFile: (content: string, name: string) => Promise<boolean>
      openFile: () => Promise<{ name: string; content: string } | null>
      encodePayload: (script: string, method: string) => Promise<string>
      validateScript: (script: string) => Promise<{ valid: boolean; errors: string[] }>
      copyToClipboard: (text: string) => Promise<void>
    }
  }
}

export {}
