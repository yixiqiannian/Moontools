<template>
  <div class="container">
    <h2 class="title">批量巡检</h2>
    <el-card class="card">
      <div class="form-section">
        <el-button @click="selectDeviceFile">选择设备 Excel 文件</el-button>
        <span>{{ deviceFilePath || '未选择文件' }}</span>
      </div>
      <div class="form-section">
        <el-button @click="selectCommandFolder">选择命令文件夹</el-button>
        <span>{{ commandFolder || '未选择文件夹' }}</span>
      </div>

      <div class="form-section">
        <el-button @click="selectOutputFolder">选择导出目录</el-button>
        <span>{{ outputFolder || '未选择导出目录' }}</span>
      </div>

      <div class="form-section xunjian-button">
        <el-button type="primary" @click="startInspection" :disabled="!canStart">开始巡检</el-button>
        <el-button type="danger" @click="handleStop">停止巡检</el-button>
      </div>
    </el-card>

    <el-table :data="inspectStatus" style="width: 100%" v-if="inspectStatus.length">
      <el-table-column prop="ip" label="IP 地址" />
      <el-table-column prop="brand" label="品牌" />
      <el-table-column prop="status" label="巡检状态" />
    </el-table>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { usePathStore } from '../stores/pathStore'
import { useInspectionStore } from '../stores/inspection' // ✅ 恢复导入
const pathStore = usePathStore()
const store = useInspectionStore() // ✅ 使用巡检状态 store

const deviceFilePath = ref('')
const commandFolder = ref('')
const outputFolder = ref('')
const inspectStatus = ref([])

const canStart = computed(() =>
  deviceFilePath.value && commandFolder.value && outputFolder.value
)

const handleStop = () => {
  if (window.electronAPI?.stopInspection) {
    window.electronAPI.stopInspection().then(res => {
      console.log('[stop]', res)
    })
  } else {
    console.warn('electronAPI.stopInspection 不可用')
  }
}

// 选择 Excel 文件
const selectDeviceFile = async () => {
  const result = await window.electronAPI.selectFile()
  if (result) {
    deviceFilePath.value = result
    pathStore.setPaths({ devicePath: result })
  }
}

// 选择命令文件夹
const selectCommandFolder = async () => {
  const folder = await window.electronAPI.selectFolder()
  if (folder) {
    commandFolder.value = folder
    pathStore.setPaths({ commandFolder: folder })
  }
}

// 选择导出目录
const selectOutputFolder = async () => {
  const folder = await window.electronAPI.selectExport()
  if (folder) {
    outputFolder.value = folder
    pathStore.setPaths({ outputFolder: folder })
  }
}

// 启动巡检
const startInspection = async () => {
  inspectStatus.value = []

  if (!canStart.value) {
    ElMessage.error("请先选择设备文件、命令文件夹和导出目录")
    return
  }

  // ✅ 开始前清空旧日志并设置运行状态
  store.clearLogs()
  store.setRunning(true)

  await window.electronAPI.startBatchInspection({
    excelPath: deviceFilePath.value,
    commandDir: commandFolder.value,
    exportPath: outputFolder.value
  })
}

onMounted(() => {
  deviceFilePath.value = pathStore.devicePath
  commandFolder.value = pathStore.commandFolder
  outputFolder.value = pathStore.outputFolder

  window.electronAPI.onInspectionStatus((data) => {
    const index = inspectStatus.value.findIndex(item => item.ip === data.ip)
    if (index !== -1) {
      inspectStatus.value[index].status = data.status
    } else {
      inspectStatus.value.push({ ...data })
    }

    // ✅ 每条状态也写入 pinia 历史记录
    store.addLog(data)
  })

  window.electronAPI.onInspectionError((msg) => {
    console.error('Python 错误输出：', msg)
    ElMessage.error(msg)
  })

  window.electronAPI.onInspectionComplete((code) => {
    console.log('Python 脚本退出码：', code)
    store.setRunning(false) // ✅ 设置为已完成
  })
})
</script>


<style scoped>
.container {
  padding: 30px;
}

.title {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 20px;
}

.form-section {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.el-card {
  transition: all 0.3s ease;
}

.card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
  background-color: rgba(80, 245, 121, 0.1);
}

.form-section.xunjian-button {
  justify-content: center;
}

.el-card {
  margin-bottom: 20px;
  padding: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.el-button {
  width: 150px;
}
</style>
