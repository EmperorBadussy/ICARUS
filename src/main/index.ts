import { app, BrowserWindow, ipcMain, dialog, clipboard } from 'electron'
import { join } from 'path'
import * as path from 'path'
import { readFile, writeFile } from 'fs/promises'
import * as fs from 'fs'
import { execSync } from 'child_process'

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    backgroundColor: '#0A0800',
    show: false,
    frame: false,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#0A0800',
      symbolColor: '#EAB308',
      height: 36
    },
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// IPC Handlers
ipcMain.handle('file:save', async (_e, content: string, name: string) => {
  try {
    const { filePath } = await dialog.showSaveDialog(mainWindow!, {
      defaultPath: name,
      filters: [
        { name: 'DuckyScript', extensions: ['txt', 'duck'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    })
    if (filePath) {
      await writeFile(filePath, content, 'utf-8')
      return true
    }
    return false
  } catch {
    return false
  }
})

ipcMain.handle('file:open', async () => {
  try {
    const { filePaths } = await dialog.showOpenDialog(mainWindow!, {
      filters: [
        { name: 'DuckyScript', extensions: ['txt', 'duck'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: ['openFile']
    })
    if (filePaths.length > 0) {
      const content = await readFile(filePaths[0], 'utf-8')
      const name = filePaths[0].split(/[\\/]/).pop() || 'untitled.txt'
      return { name, content }
    }
    return null
  } catch {
    return null
  }
})

ipcMain.handle('file:open-dialog', async (_e, filters: { name: string; extensions: string[] }[]) => {
  try {
    const { filePaths } = await dialog.showOpenDialog(mainWindow!, {
      filters: filters || [{ name: 'All Files', extensions: ['*'] }],
      properties: ['openFile']
    })
    if (filePaths.length > 0) {
      return await readFile(filePaths[0], 'utf-8')
    }
    return null
  } catch {
    return null
  }
})

ipcMain.handle('payload:encode', async (_e, script: string, method: string) => {
  try {
    switch (method) {
      case 'base64':
        return Buffer.from(script).toString('base64')
      case 'hex':
        return Buffer.from(script).toString('hex')
      case 'char-split': {
        const lines = script.split('\n')
        const result: string[] = []
        for (const line of lines) {
          if (line.startsWith('STRING ')) {
            const text = line.slice(7)
            for (const ch of text) {
              result.push(`STRING ${ch}`)
            }
          } else {
            result.push(line)
          }
        }
        return result.join('\n')
      }
      case 'random-delay': {
        const lines = script.split('\n')
        const result: string[] = []
        for (const line of lines) {
          result.push(line)
          if (line.startsWith('STRING ') || line.startsWith('ENTER') || line.startsWith('TAB')) {
            const delay = 50 + Math.floor(Math.random() * 150)
            result.push(`DELAY ${delay}`)
          }
        }
        return result.join('\n')
      }
      case 'strip-comments':
        return script.split('\n').filter(l => !l.trimStart().startsWith('REM ')).join('\n')
      case 'compress': {
        return script.split('\n')
          .filter(l => l.trim() !== '')
          .map(l => {
            const match = l.match(/^DELAY\s+(\d+)$/)
            if (match && parseInt(match[1]) > 200) {
              return `DELAY 100`
            }
            return l
          })
          .join('\n')
      }
      default:
        return script
    }
  } catch {
    return script
  }
})

ipcMain.handle('payload:validate', async (_e, script: string) => {
  const errors: string[] = []
  const validCommands = [
    'REM', 'DELAY', 'STRING', 'ENTER', 'GUI', 'WINDOWS', 'ALT', 'CTRL', 'CONTROL',
    'SHIFT', 'TAB', 'ESCAPE', 'ESC', 'PAUSE', 'BREAK', 'CAPSLOCK', 'DELETE', 'DEL',
    'END', 'HOME', 'INSERT', 'NUMLOCK', 'PAGEUP', 'PAGEDOWN', 'PRINTSCREEN',
    'SCROLLLOCK', 'SPACE', 'BACKSPACE', 'DOWNARROW', 'DOWN', 'LEFTARROW', 'LEFT',
    'RIGHTARROW', 'RIGHT', 'UPARROW', 'UP', 'MENU', 'APP', 'F1', 'F2', 'F3', 'F4',
    'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12', 'REPEAT', 'DEFAULT_DELAY',
    'DEFAULTDELAY'
  ]

  const lines = script.split('\n')
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (line === '') continue

    const parts = line.split(/\s+/)
    const cmd = parts[0].toUpperCase()

    if (!validCommands.includes(cmd)) {
      // Check for combo keys like CTRL-ALT, GUI r, etc.
      const baseCmd = cmd.split('-')[0]
      if (!validCommands.includes(baseCmd)) {
        errors.push(`Line ${i + 1}: Unknown command '${parts[0]}'`)
      }
    }

    if ((cmd === 'DELAY' || cmd === 'DEFAULT_DELAY' || cmd === 'DEFAULTDELAY') && parts.length > 1) {
      const val = parseInt(parts[1])
      if (isNaN(val) || val < 0) {
        errors.push(`Line ${i + 1}: Invalid delay value '${parts[1]}'`)
      }
      if (val > 30000) {
        errors.push(`Line ${i + 1}: Warning - very long delay (${val}ms)`)
      }
    }

    if (cmd === 'REPEAT' && parts.length > 1) {
      const val = parseInt(parts[1])
      if (isNaN(val) || val < 1) {
        errors.push(`Line ${i + 1}: Invalid repeat count '${parts[1]}'`)
      }
    }
  }

  return { valid: errors.length === 0, errors }
})

ipcMain.handle('clipboard:write', async (_e, text: string) => {
  try {
    clipboard.writeText(text)
  } catch {
    // Silently fail
  }
})

// === Flipper Zero Serial IPC Handlers ===

const FLIPPER_SCRIPT = path.join(__dirname, '..', '..', 'src', 'main', 'flipper-serial.py')

function runFlipperCommand(args: string, options?: { input?: string; timeout?: number }): string {
  const timeout = options?.timeout || 5000
  // Try python3 first, fall back to python
  try {
    return execSync(`python3 "${FLIPPER_SCRIPT}" ${args}`, {
      timeout,
      input: options?.input,
      encoding: 'utf-8'
    }).trim()
  } catch {
    return execSync(`python "${FLIPPER_SCRIPT}" ${args}`, {
      timeout,
      input: options?.input,
      encoding: 'utf-8'
    }).trim()
  }
}

ipcMain.handle('flipper:detect', async () => {
  try {
    const result = runFlipperCommand('detect')
    return JSON.parse(result)
  } catch {
    return { found: false, port: null }
  }
})

ipcMain.handle('flipper:list-deployed', async () => {
  try {
    const result = runFlipperCommand('list', { timeout: 10000 })
    return JSON.parse(result)
  } catch {
    return []
  }
})

ipcMain.handle('flipper:deploy', async (_event, category: string, filename: string, content: string) => {
  try {
    const result = runFlipperCommand(`deploy "${category}" "${filename}"`, {
      input: content,
      timeout: 10000
    })
    return JSON.parse(result)
  } catch (e) {
    return { success: false, error: String(e) }
  }
})

ipcMain.handle('flipper:remove', async (_event, filepath: string) => {
  try {
    const result = runFlipperCommand(`remove "${filepath}"`)
    return JSON.parse(result)
  } catch {
    return { success: false }
  }
})

ipcMain.handle('flipper:list-loot', async () => {
  try {
    const result = runFlipperCommand('list-loot', { timeout: 15000 })
    return JSON.parse(result)
  } catch {
    return []
  }
})

ipcMain.handle('flipper:pull-loot', async (_event, filepath: string) => {
  try {
    const result = runFlipperCommand(`pull-loot "${filepath}"`, { timeout: 10000 })
    return JSON.parse(result)
  } catch (e) {
    return { content: '', path: filepath, error: String(e) }
  }
})

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
