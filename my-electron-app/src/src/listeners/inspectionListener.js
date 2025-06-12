import { useInspectionStore } from '../stores/inspection'
console.log('🚀 registerInspectionEvents() 已执行')


export function registerInspectionEvents() {
  const store = useInspectionStore()

  window.electronAPI.onInspectionStatus((data) => {
    // console.log('✅ 收到 inspection-status:', data)

    if (data.status === 'daily_cumulative_summary') {
      store.setSummary(data)
    } else if (data.ip && data.status) {
      store.addLog(data)
    }

    if (data.status === '巡检中') {
      store.setRunning(true)
    }
  })

  window.electronAPI.onInspectionComplete(() => {
    // console.log('✅ 巡检完成事件触发')
    store.setRunning(false)
  })

  window.electronAPI.onDailySummary((data) => {
    store.setSummary(data)
  })
}
