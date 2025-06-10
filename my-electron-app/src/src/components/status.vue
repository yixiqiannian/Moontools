<template>
  <div class="inspection-status">
    <el-card class="card" shadow="hover">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center">
          <span>巡检状态</span>
          <div>
            <el-button size="small" @click="showHistory = false">最新状态</el-button>
            <el-button size="small" @click="showHistory = true">所有记录</el-button>
            <el-tag :type="running ? 'success' : 'info'" class="status-tag">
              {{ running ? '正在巡检中' : '已完成' }}
            </el-tag>
          </div>
        </div>
      </template>

      <div v-if="running">
        <p>当前巡检任务进行中，请稍候查看结果。</p>
      </div>
      <div v-else>
        <p v-if="displayLogs && displayLogs.length">以下是最近一次巡检的{{ showHistory ? '完整记录' : '最终状态' }}：</p>

        <p v-else>暂无巡检记录。</p>
      </div>

      <el-table
        v-if="displayLogs.length"
        :data="displayLogs"
        stripe
        border
        style="width: 100%; margin-top: 16px"
      >
        <el-table-column prop="ip" label="设备 IP" width="200" />
        <el-table-column prop="brand" label="厂商" width="120" />
        <el-table-column prop="status" label="状态">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="timestamp" label="时间" width="200" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useInspectionStore } from '../stores/inspection'

const store = useInspectionStore()
const running = computed(() => store.running)
const showHistory = ref(false)

const displayLogs = computed(() =>
  showHistory.value ? (store.inspectionHistory || []) : (store.inspectionLogs || [])
)

const statusType = (status) => {
  if (!status) return ''
  if (status.includes('失败') || status === 'failed') return 'danger'
  if (status.includes('成功') || status === 'completed') return 'success'
  if (status.includes('巡检中')) return 'warning'
  return ''
}
</script>

<style scoped>
.inspection-status {
  padding: 30px;
}
.card {
  max-width: 900px;
  margin: 0 auto;
}
.status-tag {
  margin-left: 10px;
}
</style>
