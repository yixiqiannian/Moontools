<template>
  <div class="batch-container">
    <h2>批量巡检</h2>

    <el-form label-position="top" class="form-area">
      <el-form-item label="选择设备信息 Excel 文件路径">
        <el-input v-model="deviceFilePath" placeholder="点击右边按钮选择文件" readonly>
          <template #append>
            <el-button @click="selectDeviceFile">选择</el-button>
          </template>
        </el-input>
      </el-form-item>

      <el-form-item label="选择巡检命令文件夹路径">
        <el-input v-model="commandFolderPath" placeholder="点击右边按钮选择文件夹" readonly>
          <template #append>
            <el-button @click="selectCommandFolder">选择</el-button>
          </template>
        </el-input>
      </el-form-item>

      <el-form-item label="选择导出目录">
        <el-input v-model="outputFolderPath" placeholder="点击右边按钮选择文件夹" readonly>
          <template #append>
            <el-button @click="selectOutputFolder">选择</el-button>
          </template>
        </el-input>
      </el-form-item>

      <el-form-item>
        <el-button type="primary" @click="startInspection" :loading="isLoading">开始巡检</el-button>
      </el-form-item>
    </el-form>

    <div class="status-area" v-if="logs.length">
      <h3>实时巡检状态</h3>
      <el-table :data="logs" style="width: 100%">
        <el-table-column prop="ip" label="设备 IP" width="180" />
        <el-table-column prop="brand" label="品牌" width="120" />
        <el-table-column prop="status" label="状态">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="timestamp" label="时间" width="180" />
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useInspectionStore } from '../stores/inspection'

const deviceFilePath = ref('')
const commandFolderPath = ref('')
const outputFolderPath = ref('')
const isLoading = ref(false)

const store = useInspectionStore()
const logs = computed(() => store.inspectionLogs || [])

const selectDeviceFile = async () => {
  const result = await window.electronAPI.selectFile()
  if (result) deviceFilePath.value = result
}

const selectCommandFolder = async () => {
  const result = await window.electronAPI.selectFolder()
  if (result) commandFolderPath.value = result
}

const selectOutputFolder = async () => {
  const result = await window.electronAPI.selectFolder()
  if (result) outputFolderPath.value = result
}

const startInspection = async () => {
  if (!deviceFilePath.value || !commandFolderPath.value || !outputFolderPath.value) {
    ElMessage.warning('请先选择所有路径！')
    return
  }

  store.clearLogs()
  store.setRunning(true)
  isLoading.value = true

  try {
    await window.electronAPI.startBatchInspection({
      excelPath: deviceFilePath.value,
      commandDir: commandFolderPath.value,
      exportPath: outputFolderPath.value
    })

    // 状态推送由 App.vue 统一监听，store 会自动更新
    ElMessage.success('巡检任务已启动')
  } catch (err) {
    console.error('启动巡检失败:', err)
    ElMessage.error('启动失败')
  } finally {
    isLoading.value = false
  }
}

const statusType = (status) => {
  if (!status) return ''
  if (status.includes('失败') || status === 'failed') return 'danger'
  if (status.includes('成功') || status === 'completed') return 'success'
  if (status.includes('巡检中')) return 'warning'
  return ''
}
</script>

<style scoped>
.batch-container {
  padding: 20px 40px;
}

.form-area {
  max-width: 600px;
}

.status-area {
  margin-top: 40px;
}
</style>
