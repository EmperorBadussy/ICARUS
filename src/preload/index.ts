import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('icarus', {
  saveFile: (content: string, name: string) => ipcRenderer.invoke('file:save', content, name),
  openFile: () => ipcRenderer.invoke('file:open'),
  encodePayload: (script: string, method: string) => ipcRenderer.invoke('payload:encode', script, method),
  validateScript: (script: string) => ipcRenderer.invoke('payload:validate', script),
  copyToClipboard: (text: string) => ipcRenderer.invoke('clipboard:write', text)
})
