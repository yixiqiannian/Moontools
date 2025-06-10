const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  // 文件选择
  selectFile: () => ipcRenderer.invoke('selectFile'),
  selectFolder: () => ipcRenderer.invoke('selectFolder'),
  selectExport: () => ipcRenderer.invoke('select-export'),
  singleInspect: (deviceInfo) => ipcRenderer.invoke('single-inspect', deviceInfo),

  // 执行任务
  startBatchInspection: (args) => ipcRenderer.invoke('start-batch-inspection', args),
  stopInspection: () => ipcRenderer.invoke('stop-inspection'),

  // 巡检状态
  onInspectionStatus: (callback) => {
    ipcRenderer.on('inspection-status', (_event, data) => callback(data))
  },

  // Python 错误
  onInspectionError: (callback) => {
    ipcRenderer.on('inspection-error', (_event, errorMsg) => callback(errorMsg))
  },

  // 巡检结束
  onInspectionComplete: (callback) => {
    ipcRenderer.on('inspection-complete', (_event, code) => callback(code))
  },

  // 每日汇总
  onDailySummary: (callback) => {
    ipcRenderer.on('daily-summary', (_event, data) => callback(data))
  },
  getDailySummary: () => ipcRenderer.invoke('get-daily-summary'),

 

  

  // 清理所有监听器（防止内存泄漏）
  removeAllInspectionListeners: () => {
    ipcRenderer.removeAllListeners('inspection-status')
    ipcRenderer.removeAllListeners('inspection-error')
    ipcRenderer.removeAllListeners('inspection-complete')
    ipcRenderer.removeAllListeners('daily-summary')
  }
})


