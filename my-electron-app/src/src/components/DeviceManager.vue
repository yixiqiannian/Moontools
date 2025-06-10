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
     <!-- <div class="form-section">
      <el-button type="primary" @click="startInspection" :disabled="!canStart">开始巡检</el-button>
      
    </div> -->
    <div class="form-section xunjian-button"> <el-button type="primary" @click="startInspection" :disabled="!canStart">开始巡检</el-button>
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
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'


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
    const formData = new FormData()
    const file = await window.electronAPI.readFile(result)
    formData.append('file', new File([file], 'devices.xlsx'))

    // await axios.post('http://localhost:5000/upload-devices', formData)
  }
}

// 选择命令文件夹
const selectCommandFolder = async () => {
  const folder = await window.electronAPI.selectFolder()
  if (folder) {
    commandFolder.value = folder
    // await axios.post('http://localhost:5000/set-command-folder', { folder })
  }
}

// 选择导出目录
const selectOutputFolder = async () => {
  const folder = await window.electronAPI.selectExport()
  if (folder) {
    outputFolder.value = folder
    // await axios.post('http://localhost:5000/set-output-folder', { folder })
  }
}

// 启动巡检
// 启动巡检（调用主进程）
const startInspection = async () => {
  inspectStatus.value = []

  if (!deviceFilePath.value || !commandFolder.value || !outputFolder.value) {
    ElMessage.error("请先选择设备文件、命令文件夹和导出目录")
    return
  }

  await window.electronAPI.startBatchInspection({
    excelPath: deviceFilePath.value,
    commandDir: commandFolder.value,
    exportPath: outputFolder.value
  })
}




onMounted(() => {
  window.electronAPI.onInspectionStatus((data) => {
    const index = inspectStatus.value.findIndex(item => item.ip === data.ip)
    if (index !== -1) {
      inspectStatus.value[index].status = data.status
    } else {
      inspectStatus.value.push({ ...data })
    }
  })

  window.electronAPI.onInspectionError((msg) => {
    console.error('Python 错误输出：', msg)
    ElMessage.error(msg)
  })

  window.electronAPI.onInspectionComplete((code) => {
    console.log('Python 脚本退出码：', code)
  })
})

onBeforeUnmount(() => {
  // window.electronAPI.removeAllInspectionListeners()
})

</script>

<style scoped>
.container {
  padding: 30px;
  /* margin-left: 240px; */
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

  transition: all 0.3s ease; /* 添加过渡效果使变化更平滑 */
}
.card:hover {
  transform: translateY(-5px); /* 轻微上浮效果 */
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1); /* 添加阴影 */
  background-color: rgba(80, 245, 121, 0.1); /* 半透明蓝色背景 */
}
/* 开始巡检按钮 */
.form-section.xunjian-button {
  justify-content: center; /* 水平居中 */
}

/* 调整 El-card 的样式 */
.el-card {
  margin-bottom: 20px;
  padding: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.el-button {
  width: 150px; /* 统一按钮宽度 */
}
</style> 