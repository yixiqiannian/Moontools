import { defineStore } from 'pinia'

export const useInspectionStore = defineStore('inspection', {
  state: () => ({
    running: false,                // 是否正在巡检中
    inspectionLogs: [],           // 当前这次巡检的最新状态（一个 IP 一条）
    inspectionHistory: [],        // 所有历史记录（可以包含多个同一 IP 的状态）
    summary: null                 // 每日统计摘要数据
  }),
  actions: {
    // 设置是否正在巡检中
    setRunning(val) {
      this.running = val
    },

    // 清空本轮巡检数据（开始新一轮前调用）
    clearLogs() {
      this.inspectionLogs = []
      this.inspectionHistory = []
    },

    // 设置每日汇总统计
    setSummary(data) {
      this.summary = data
    },

    // 添加一条巡检记录
    addLog(log) {
      const fullLog = {
        ...log,
        timestamp: new Date().toLocaleString()
      }

      console.log('📌 store.addLog 被调用:', fullLog)

      // 追加到历史记录中（用于“所有记录”）
      this.inspectionHistory.push(fullLog)

      // 用于“最新状态”：更新或插入
      const index = this.inspectionLogs.findIndex(
        item => item.ip === fullLog.ip && item.brand === fullLog.brand
      )
      if (index !== -1) {
        // 更新已有记录
        this.inspectionLogs.splice(index, 1, fullLog)
      } else {
        // 新增记录
        this.inspectionLogs.push(fullLog)
      }
    }
  },

  // 开启 localStorage 持久化
  persist: true
})
