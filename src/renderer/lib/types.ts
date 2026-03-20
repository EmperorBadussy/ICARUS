export type ViewId = 'wings' | 'forge' | 'flight' | 'wax' | 'sun' | 'academy' | 'deploy'

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

export interface FlipperDevice {
  found: boolean
  path: string | null
  type: 'sd' | 'ext' | null
}

export interface DeployedPayload {
  name: string
  path: string
  category: string
  size: number
}

declare global {
  interface Window {
    icarus: {
      saveFile: (content: string, name: string) => Promise<boolean>
      openFile: () => Promise<{ name: string; content: string } | null>
      encodePayload: (script: string, method: string) => Promise<string>
      validateScript: (script: string) => Promise<{ valid: boolean; errors: string[] }>
      copyToClipboard: (text: string) => Promise<void>
      detectFlipper: () => Promise<{ found: boolean; path: string | null; type: string | null }>
      listDeployed: (path: string) => Promise<Array<{ name: string; path: string; category: string; size: number }>>
      deployPayload: (path: string, filename: string, content: string, category: string) => Promise<{ success: boolean; path: string }>
      deployBatch: (path: string, payloads: Array<{ filename: string; content: string; category: string }>) => Promise<{ success: boolean; count: number }>
      removePayload: (filePath: string) => Promise<{ success: boolean }>
    }
  }
}

export {}
