<template>
  <div class="main">
    <div class="header">Moon, 微信公众号关注 “Moon杂选”</div>

    <div class="cards">
      <el-card class="card blue">

        <p>今日巡检设备数量：<span class="value blue">{{ totalDevices }} 台</span></p>
      </el-card>
      <el-card class="card green">
        <p>成功巡检数量：<span class="value green">{{ successTotal }} 台</span></p>
      </el-card>
      <el-card class="card red">
        <p>巡检失败数量：<span class="value red">{{ failedTotal }} 台</span></p>
      </el-card>
      <!-- <p style="text-align: center;">[调试] success: {{ successTotal }}, failed: {{ failedTotal }}, total: {{ totalDevices }}</p> -->

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useInspectionStore } from '../stores/inspection'

const store = useInspectionStore()
// 响应式数据
const successTotal = ref(0)
const failedTotal = ref(0)

// 计算属性：总设备数
const totalDevices = computed(() => successTotal.value + failedTotal.value)

onMounted(() => {
  // 被动监听巡检汇总推送
  window.electronAPI?.onDailySummary((data) => {
    console.log('✅ 收到 daily-summary 数据:', data)
    successTotal.value = data.success_total || 0
    failedTotal.value = data.failed_total || 0
    // store.addLog(data)
    store.setRunning(true)
  })
  window.electronAPI?.onInspectionComplete(() => {
    console.log('✅ 巡检已完成')
    store.setRunning(false)
    // store.setSummary(data)
  })
  // window.electronAPI?.onDailySummary((data) => {
  //   // store.setSummary(data)
  // })

  // 主动拉取当日汇总
  window.electronAPI?.getDailySummary()?.then(data => {
    console.log('📥 主动获取 summary:', data)
    successTotal.value = data.success_total || 0
    failedTotal.value = data.failed_total || 0
    store.setSummary(data)
  })
})


onBeforeUnmount(() => {
  window.electronAPI?.removeAllInspectionListeners?.()
})


</script>



<style scoped>
.main {
  flex: 1;
  background-color: #fcfcfc;
  padding: 30px;
}
.main-content {
  background-color:#ffff
}

.header {
  text-align: center;
  color: #a40000;
  font-weight: bold;
  font-size: 16px;
  margin-bottom: 40px;
  border-bottom: 1px solid #333;
  padding-bottom: 10px;
}

.cards {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 30px;
}

.card {
  width: 500px;
  text-align: center;
  font-size: 20px;
  transition: all 0.3s ease; /* 添加过渡效果使变化更平滑 */
  cursor: pointer; /* 鼠标悬停时显示手型指针 */
}
.card:hover {
  transform: translateY(-5px); /* 轻微上浮效果 */
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1); /* 添加阴影 */
}

.value {
  font-weight: bold;
}

.blue {
  /* border: 1px solid #00cfff; */
  color: #5a6fdc;
}

.green {
  /* border: 1px solid #2ecc71; */
  color: #2ecc71;
}

.red {
  /* border: 1px solid #e74c3c; */
  color: #e74c3c;
}
.blue:hover {
  background-color: rgba(90, 111, 220, 0.1); /* 半透明蓝色背景 */
}

.green:hover {
  background-color: rgba(46, 204, 113, 0.1); /* 半透明绿色背景 */
}

.red:hover {
  background-color: rgba(231, 76, 60, 0.1); /* 半透明红色背景 */
}
</style>