<template>
  <div class="layout">
    <Sidebar />
    <div class="main-content">
      <router-view :key="$route.fullPath" />
    </div>
  </div>
</template>

<script setup>
import Sidebar from './components/Sidebar.vue'
import { onMounted, onBeforeUnmount } from 'vue'
import { useInspectionStore } from './stores/inspection'

const store = useInspectionStore()

onMounted(() => {
  // ✅ 全局监听设备状态
  window.electronAPI.onInspectionStatus((data) => {
    console.log('✅ 收到 inspection-status 数据:', data)
    if (data.status === 'daily_cumulative_summary') {
      store.setSummary(data)
    } else if (data.ip && data.status) {
      store.addLog(data)
      console.log('App mounted')
      //   {
      //   ...data,
      //   timestamp: new Date().toLocaleString()
      // }
    // )
    }

    // 状态变为“巡检中”时自动设置 running
    if (data.status === '巡检中' && !store.running) {
      store.setRunning(true)
    }
  })

  // ✅ 巡检结束
  window.electronAPI.onInspectionComplete(() => {
    store.setRunning(false)
  })

  // ✅ 每日汇总数据
  window.electronAPI.onDailySummary((data) => {
    store.setSummary(data)
  })
})

// onBeforeUnmount(() => {
//   window.electronAPI.removeAllInspectionListeners()
// })
</script>

<style scoped>
.layout {
  display: flex;
  height: 100vh;
}
.main-content {
  flex: 1;
  margin-left: 220px;
  padding: 30px 40px;
  background-color: #f7f7f7;
}
</style>
