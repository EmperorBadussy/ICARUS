import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sun, Monitor, Apple, Terminal, Save, Trash2, Settings, ChevronRight, Keyboard } from 'lucide-react'
import type { TargetProfile } from '../lib/types'

const OS_CONFIGS = {
  windows: {
    label: 'Windows',
    icon: Monitor,
    versions: ['Windows 10 (21H2)', 'Windows 10 (22H2)', 'Windows 11 (23H2)', 'Windows 11 (24H2)', 'Windows Server 2019', 'Windows Server 2022'],
    notes: {
      uacLevel: { label: 'UAC Level', options: ['Disabled', 'Low', 'Default', 'Always Notify'] },
      psPolicy: { label: 'PS Execution Policy', options: ['Restricted', 'AllSigned', 'RemoteSigned', 'Unrestricted', 'Bypass'] },
      defender: { label: 'Defender Status', options: ['Disabled', 'Enabled (No Tamper Protection)', 'Enabled (Full)'] },
      edgeProfile: { label: 'Default Browser', options: ['Chrome', 'Firefox', 'Edge', 'Other'] }
    }
  },
  macos: {
    label: 'macOS',
    icon: Apple,
    versions: ['macOS Ventura (13)', 'macOS Sonoma (14)', 'macOS Sequoia (15)'],
    notes: {
      gatekeeper: { label: 'Gatekeeper', options: ['Disabled', 'App Store Only', 'App Store + Known Devs'] },
      sip: { label: 'SIP Status', options: ['Enabled', 'Disabled'] },
      terminal: { label: 'Terminal Access', options: ['Full Disk Access', 'Limited', 'Restricted'] },
      fileVault: { label: 'FileVault', options: ['Enabled', 'Disabled'] }
    }
  },
  linux: {
    label: 'Linux',
    icon: Terminal,
    versions: ['Ubuntu 22.04 LTS', 'Ubuntu 24.04 LTS', 'Kali Linux 2024', 'Debian 12', 'CentOS/RHEL 9', 'Fedora 40'],
    notes: {
      sudo: { label: 'Sudo Requirements', options: ['Passwordless', 'Password Required', 'No Sudo Access'] },
      desktop: { label: 'Desktop Environment', options: ['GNOME', 'KDE Plasma', 'XFCE', 'i3/Sway', 'None (Server)'] },
      selinux: { label: 'SELinux/AppArmor', options: ['Enforcing', 'Permissive', 'Disabled'] },
      firewall: { label: 'Firewall', options: ['UFW Active', 'iptables', 'firewalld', 'Disabled'] }
    }
  }
}

const KEYBOARD_LAYOUTS = [
  { id: 'us', label: 'US (QWERTY)', region: 'North America' },
  { id: 'uk', label: 'UK', region: 'Europe' },
  { id: 'de', label: 'German (QWERTZ)', region: 'Europe' },
  { id: 'fr', label: 'French (AZERTY)', region: 'Europe' },
  { id: 'es', label: 'Spanish', region: 'Europe' },
  { id: 'it', label: 'Italian', region: 'Europe' },
  { id: 'pt', label: 'Portuguese (BR)', region: 'South America' },
  { id: 'jp', label: 'Japanese', region: 'Asia' },
  { id: 'kr', label: 'Korean', region: 'Asia' },
  { id: 'ru', label: 'Russian', region: 'Europe' },
  { id: 'no', label: 'Norwegian', region: 'Europe' },
  { id: 'se', label: 'Swedish', region: 'Europe' },
]

interface SavedProfile {
  name: string
  profile: TargetProfile
}

export default function SunView() {
  const [os, setOs] = useState<'windows' | 'macos' | 'linux'>('windows')
  const [osVersion, setOsVersion] = useState(OS_CONFIGS.windows.versions[0])
  const [layout, setLayout] = useState('us')
  const [defaultDelay, setDefaultDelay] = useState(100)
  const [postCommandDelay, setPostCommandDelay] = useState(500)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [profiles, setProfiles] = useState<SavedProfile[]>([])
  const [profileName, setProfileName] = useState('')

  const config = OS_CONFIGS[os]
  const Icon = config.icon

  const handleOsChange = (newOs: 'windows' | 'macos' | 'linux') => {
    setOs(newOs)
    setOsVersion(OS_CONFIGS[newOs].versions[0])
    setNotes({})
  }

  const handleSaveProfile = () => {
    if (!profileName.trim()) return
    const profile: TargetProfile = {
      os,
      osVersion,
      keyboardLayout: layout,
      defaultDelay,
      postCommandDelay,
      notes
    }
    setProfiles(prev => [...prev, { name: profileName, profile }])
    setProfileName('')
  }

  const loadProfile = (saved: SavedProfile) => {
    setOs(saved.profile.os)
    setOsVersion(saved.profile.osVersion)
    setLayout(saved.profile.keyboardLayout)
    setDefaultDelay(saved.profile.defaultDelay)
    setPostCommandDelay(saved.profile.postCommandDelay)
    setNotes(saved.profile.notes)
  }

  const deleteProfile = (idx: number) => {
    setProfiles(prev => prev.filter((_, i) => i !== idx))
  }

  // Generate config object
  const configOutput = JSON.stringify({
    os, osVersion, keyboardLayout: layout,
    defaultDelay, postCommandDelay, notes,
    generated: new Date().toISOString()
  }, null, 2)

  return (
    <motion.div className="h-full flex flex-col" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      {/* Header */}
      <div className="p-4 border-b border-gold-muted/20 flex items-center gap-3">
        <Sun className="w-5 h-5 text-gold" />
        <h1 className="font-display text-lg text-gold glow-text tracking-wider">SUN</h1>
        <span className="text-xs text-text-tertiary font-mono">Target Configurator</span>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* OS Selector */}
          <div>
            <h3 className="font-display text-xs text-gold-dark tracking-wider mb-3">TARGET OPERATING SYSTEM</h3>
            <div className="grid grid-cols-3 gap-3">
              {(Object.entries(OS_CONFIGS) as [keyof typeof OS_CONFIGS, typeof OS_CONFIGS.windows][]).map(([key, cfg]) => {
                const OsIcon = cfg.icon
                const selected = os === key
                return (
                  <motion.button
                    key={key}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleOsChange(key as 'windows' | 'macos' | 'linux')}
                    className={`p-4 rounded-lg text-center transition-all ${
                      selected
                        ? 'glass-panel-bright border-gold/30 gold-glow-border'
                        : 'glass-panel hover:border-gold/15 cursor-pointer'
                    }`}
                  >
                    <OsIcon className={`w-8 h-8 mx-auto mb-2 ${selected ? 'text-gold' : 'text-text-tertiary'}`} />
                    <span className={`font-display text-sm ${selected ? 'text-gold' : 'text-text-secondary'}`}>{cfg.label}</span>
                  </motion.button>
                )
              })}
            </div>
          </div>

          {/* OS Version */}
          <div>
            <h3 className="font-display text-xs text-gold-dark tracking-wider mb-3">OS VERSION</h3>
            <select
              value={osVersion}
              onChange={e => setOsVersion(e.target.value)}
              className="w-full px-4 py-2.5 bg-bg-void/50 border border-gold-muted/20 rounded-lg text-sm font-mono text-text-primary"
            >
              {config.versions.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>

          {/* Keyboard Layout */}
          <div>
            <h3 className="font-display text-xs text-gold-dark tracking-wider mb-3 flex items-center gap-2">
              <Keyboard className="w-4 h-4" /> KEYBOARD LAYOUT
            </h3>
            <div className="grid grid-cols-4 gap-2">
              {KEYBOARD_LAYOUTS.map(kb => (
                <button
                  key={kb.id}
                  onClick={() => setLayout(kb.id)}
                  className={`px-3 py-2 rounded text-xs font-mono transition-all ${
                    layout === kb.id
                      ? 'bg-gold/15 text-gold border border-gold/30'
                      : 'text-text-tertiary hover:text-text-secondary bg-bg-void/30 border border-gold-muted/10 hover:border-gold-muted/20'
                  }`}
                >
                  {kb.label}
                </button>
              ))}
            </div>
          </div>

          {/* Delay Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-display text-xs text-gold-dark tracking-wider mb-3">DEFAULT DELAY (ms)</h3>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={500}
                  step={10}
                  value={defaultDelay}
                  onChange={e => setDefaultDelay(parseInt(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm font-mono text-gold w-14 text-right">{defaultDelay}</span>
              </div>
            </div>
            <div>
              <h3 className="font-display text-xs text-gold-dark tracking-wider mb-3">POST-COMMAND DELAY (ms)</h3>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={100}
                  max={2000}
                  step={50}
                  value={postCommandDelay}
                  onChange={e => setPostCommandDelay(parseInt(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm font-mono text-gold w-14 text-right">{postCommandDelay}</span>
              </div>
            </div>
          </div>

          {/* OS-Specific Notes */}
          <div>
            <h3 className="font-display text-xs text-gold-dark tracking-wider mb-3 flex items-center gap-2">
              <Settings className="w-4 h-4" /> TARGET-SPECIFIC SETTINGS
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(config.notes).map(([key, noteConfig]) => (
                <div key={key} className="glass-panel p-3">
                  <label className="text-xs font-display text-text-secondary mb-1.5 block">{noteConfig.label}</label>
                  <select
                    value={notes[key] || noteConfig.options[0]}
                    onChange={e => setNotes(prev => ({ ...prev, [key]: e.target.value }))}
                    className="w-full px-3 py-1.5 bg-bg-void/50 border border-gold-muted/20 rounded text-xs font-mono text-text-primary"
                  >
                    {noteConfig.options.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Save Profile */}
          <div className="glass-panel-bright p-4">
            <h3 className="font-display text-xs text-gold tracking-wider mb-3">SAVE PROFILE</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={profileName}
                onChange={e => setProfileName(e.target.value)}
                placeholder="Profile name..."
                className="flex-1 px-3 py-2 bg-bg-void/50 border border-gold-muted/20 rounded text-sm font-mono text-text-primary placeholder:text-text-tertiary/50"
                onKeyDown={e => e.key === 'Enter' && handleSaveProfile()}
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSaveProfile}
                disabled={!profileName.trim()}
                className="flex items-center gap-1.5 px-4 py-2 bg-gold/20 border border-gold/40 rounded text-gold text-xs font-display hover:bg-gold/30 disabled:opacity-30"
              >
                <Save className="w-3.5 h-3.5" /> SAVE
              </motion.button>
            </div>
          </div>
        </div>

        {/* Right panel: Generated config + saved profiles */}
        <div className="w-80 border-l border-gold-muted/20 bg-bg-surface/30 flex flex-col overflow-hidden flex-shrink-0">
          {/* Generated Config */}
          <div className="p-4 border-b border-gold-muted/10 flex-1 overflow-y-auto">
            <h3 className="font-display text-xs text-gold-dark tracking-wider mb-3">GENERATED CONFIG</h3>
            <pre className="bg-bg-void/50 rounded-lg border border-gold-muted/10 p-3 font-mono text-[10px] text-text-secondary leading-relaxed overflow-x-auto">
              {configOutput}
            </pre>
          </div>

          {/* Saved Profiles */}
          <div className="p-4 overflow-y-auto">
            <h3 className="font-display text-xs text-gold-dark tracking-wider mb-3">SAVED PROFILES ({profiles.length})</h3>
            {profiles.length === 0 ? (
              <p className="text-xs text-text-tertiary/50 font-body">No saved profiles yet.</p>
            ) : (
              <div className="space-y-2">
                {profiles.map((p, i) => {
                  const PIcon = OS_CONFIGS[p.profile.os].icon
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="glass-panel p-3 flex items-center gap-2"
                    >
                      <PIcon className="w-4 h-4 text-gold-dark flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-display text-text-primary truncate">{p.name}</div>
                        <div className="text-[10px] font-mono text-text-tertiary">{p.profile.osVersion}</div>
                      </div>
                      <button
                        onClick={() => loadProfile(p)}
                        className="text-gold/60 hover:text-gold p-1"
                        title="Load"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteProfile(i)}
                        className="text-red-400/40 hover:text-red-400 p-1"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
