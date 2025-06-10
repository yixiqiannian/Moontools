import { defineStore } from 'pinia'

export const useInspectionStore = defineStore('inspection', {
  state: () => ({
    running: false,
    inspectionLogs: [],       // 最终状态，每台设备 1 条
    inspectionHistory: [],    // 所有状态变化历史
    summary: null
  }),
  actions: {
    setRunning(val) {
      this.running = val
    },
    clearLogs() {
      this.inspectionLogs = []
      this.inspectionHistory = []
    },
    setSummary(data) {
      this.summary = data
    },
    addLog(log) {
      const fullLog = {
        ...log,
        timestamp: new Date().toLocaleString()
      }
    
      // 添加到历史记录
      this.inspectionHistory.push(fullLog)
    
      // 查找是否已存在该设备（按 ip + brand）
      const index = this.inspectionLogs.findIndex(
        item => item.ip === log.ip && item.brand === log.brand
      )
    
      if (index !== -1) {
        // 关键：替换并强制响应式更新
        this.inspectionLogs.splice(index, 1, fullLog)
      } else {
        this.inspectionLogs.push(fullLog)
      }
    }

  },
  persist: true
})
