import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('icarus', {
  saveFile: (content: string, name: string) => ipcRenderer.invoke('file:save', content, name),
  openFile: () => ipcRenderer.invoke('file:open'),
  encodePayload: (script: string, method: string) => ipcRenderer.invoke('payload:encode', script, method),
  validateScript: (script: string) => ipcRenderer.invoke('payload:validate', script),
  copyToClipboard: (text: string) => ipcRenderer.invoke('clipboard:write', text),
  detectFlipper: () => ipcRenderer.invoke('flipper:detect'),
  listDeployed: () => ipcRenderer.invoke('flipper:list-deployed'),
  deployPayload: (category: string, filename: string, content: string) => ipcRenderer.invoke('flipper:deploy', category, filename, content),
  removePayload: (filePath: string) => ipcRenderer.invoke('flipper:remove', filePath)
})
