export type ViewId = 'wings' | 'forge' | 'flight' | 'wax' | 'sun' | 'academy' | 'deploy' | 'loot'

export interface DuckyScript {
  id: string
  name: string
  category: 'recon' | 'credentials' | 'reverse-shells' | 'persistence' | 'exfiltration' | 'network' | 'evasion' | 'pranks' | 'test'
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
  port: string | null
}

export interface DeployedPayload {
  name: string
  path: string
  category: string
  size: string
}

export interface LootSession {
  session: string  // e.g., "DESKTOP-ABC_20260320_1530"
  path: string
  files: Array<{name: string, size: string}>
}

export interface LootFile {
  content: string
  path: string
}

declare global {
  interface Window {
    icarus: {
      saveFile: (content: string, name: string) => Promise<boolean>
      openFile: () => Promise<{ name: string; content: string } | null>
      encodePayload: (script: string, method: string) => Promise<string>
      validateScript: (script: string) => Promise<{ valid: boolean; errors: string[] }>
      copyToClipboard: (text: string) => Promise<void>
      detectFlipper: () => Promise<{ found: boolean; port: string | null }>
      listDeployed: () => Promise<Array<{ name: string; path: string; category: string; size: string }>>
      deployPayload: (category: string, filename: string, content: string) => Promise<{ success: boolean; path: string }>
      removePayload: (filePath: string) => Promise<{ success: boolean }>
      listLoot: () => Promise<LootSession[]>
      pullLoot: (filepath: string) => Promise<LootFile>
    }
  }
}

export {}
