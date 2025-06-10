<template>
  <div class="inspection-task">
    <div class="task-header">
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

      <div class="form-section">
        <el-button type="primary" @click="startInspection" :loading="isInspecting" :disabled="!canStart">
          开始巡检
        </el-button>
        <el-input-number v-model="maxWorkers" :min="1" :max="20" label="并发数" style="margin-left: 10px;"></el-input-number>
        <span style="margin-left: 5px;">最大并发数: {{ maxWorkers }}</span>
      </div>

      <div class="daily-summary" v-if="dailyCumulativeSummary.timestamp">
        <el-tag type="info">每日累计成功: {{ dailyCumulativeSummary.success_total }}台</el-tag>
        <el-tag type="danger" style="margin-left: 10px;">每日累计失败: {{ dailyCumulativeSummary.failed_total }}台</el-tag>
        <span style="margin-left: 10px;">更新时间: {{ dailyCumulativeSummary.timestamp }}</span>
      </div>
    </div>

    <el-table :data="inspectionStatus" style="width: 100%; margin-top: 20px">
      <el-table-column prop="ip" label="IP地址" />
      <el-table-column prop="brand" label="品牌" /> <el-table-column prop="status" label="状态">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)">
            {{ getStatusText(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="进度">
        <template #default="{ row }">
          <el-progress
            :percentage="row.progress"
            :status="getProgressStatus(row.status)"
          />
        </template>
      </el-table-column>
      <el-table-column label="操作">
        <template #default="{ row }">
          <el-button
            v-if="row.status === 'completed' || row.status === '已完成'"
            type="primary"
            size="small"
            @click="viewResults(row)"
          >
            查看结果
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog
      v-model="resultDialogVisible"
      title="巡检结果"
      width="80%"
    >
      <pre class="result-content">{{ currentResult }}</pre>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'

const deviceFilePath = ref('')
const commandFolder = ref('')
const outputFolder = ref('')
const inspectionStatus = ref([])
const isInspecting = ref(false)
const resultDialogVisible = ref(false)
const currentResult = ref('')
const maxWorkers = ref(5) // 默认最大并发数
const dailyCumulativeSummary = ref({ // 每日累计汇总数据
  success_total: 0,
  failed_total: 0,
  timestamp: ''
})

let statusInterval = null // 巡检状态轮询定时器
let dailySummaryInterval = null // 每日汇总轮询定时器

// 计算属性：是否可以开始巡检
const canStart = computed(() =>
  deviceFilePath.value && commandFolder.value && outputFolder.value && !isInspecting.value
)

// 状态标签类型
const getStatusType = (status) => {
  const types = {
    pending: 'info',
    等待中: 'info',
    running: 'warning',
    巡检中: 'warning',
    completed: 'success',
    已完成: 'success',
    failed: 'danger',
    失败: 'danger'
  }
  return types[status] || 'info'
}

// 状态文本
const getStatusText = (status) => {
  const texts = {
    pending: '等待中',
    等待中: '等待中',
    running: '巡检中',
    巡检中: '巡检中',
    completed: '已完成',
    已完成: '已完成',
    failed: '失败',
    失败: '失败'
  }
  return texts[status] || status
}

// 进度条状态
const getProgressStatus = (status) => {
  if (status === 'failed' || status === '失败') return 'exception'
  if (status === 'completed' || status === '已完成') return 'success'
  return ''
}

// 选择设备 Excel 文件
const selectDeviceFile = async () => {
  try {
    const result = await window.electronAPI.selectFile();
    if (result) {
      deviceFilePath.value = result;
      const fileContent = await window.electronAPI.readFile(result); // 通过 Electron 读取文件内容
      const formData = new FormData();
      formData.append('file', new File([fileContent], 'devices.xlsx'));
      await axios.post('http://localhost:5000/upload-devices', formData); // 上传到 Flask
      ElMessage.success('设备文件上传成功');
      await updateStatus(); // 上传成功后，更新状态以加载新设备列表
    }
  } catch (error) {
    ElMessage.error('选择或上传设备文件失败');
    console.error('选择或上传设备文件失败:', error);
  }
};

// 选择命令文件夹
const selectCommandFolder = async () => {
  try {
    const folder = await window.electronAPI.selectFolder();
    if (folder) {
      commandFolder.value = folder;
      await axios.post('http://localhost:5000/set-command-folder', { folder }); // 发送路径给 Flask 保存
      ElMessage.success('命令文件夹路径设置成功');
    }
  } catch (error) {
    ElMessage.error('选择或设置命令文件夹失败');
    console.error('选择或设置命令文件夹失败:', error);
  }
};

// 选择导出目录
const selectOutputFolder = async () => {
  try {
    const folder = await window.electronAPI.selectExport();
    if (folder) {
      outputFolder.value = folder;
      await axios.post('http://localhost:5000/set-output-folder', { folder }); // 发送路径给 Flask 保存
      ElMessage.success('导出目录路径设置成功');
    }
  } catch (error) {
    ElMessage.error('选择或设置导出目录失败');
    console.error('选择或设置导出目录失败:', error);
  }
};

// 启动巡检
const startInspection = async () => {
  try {
    if (!deviceFilePath.value || !commandFolder.value || !outputFolder.value) {
      ElMessage.warning("请先选择所有必要的文件/文件夹！");
      return;
    }
    isInspecting.value = true;
    inspectionStatus.value = []; // 清空旧状态
    
    // 向 Flask 后端发送开始巡检请求，只发送并发数，Flask 会使用已保存的路径
    const response = await axios.post('http://localhost:5000/api/inspection/start', {
      maxWorkers: maxWorkers.value // 传递配置的并发数
    });
    
    // Flask 应该返回所有设备的初始状态
    inspectionStatus.value = Object.entries(response.data).map(([ip, data]) => ({
      ip,
      ...data,
      // 根据初始状态设置进度条初始值
      progress: data.status === 'pending' || data.status === '等待中' ? 0 : 
                (data.status === 'running' || data.status === '巡检中' ? 50 : 100) 
    }));

    startStatusPolling(); // 开始轮询状态
    ElMessage.success('巡检任务已启动');
  } catch (error) {
    ElMessage.error(`启动巡检失败: ${error.response?.data?.error || error.message}`);
    console.error('启动巡检失败:', error);
  } finally {
    isInspecting.value = false;
  }
};

// 更新巡检状态（轮询）
const updateStatus = async () => {
  try {
    const response = await axios.get('http://localhost:5000/api/inspection/status');
    const newStatusMap = response.data; // Flask 返回一个对象 {ip: {status, progress, brand, reason}}

    // 遍历新状态，更新或添加设备
    Object.entries(newStatusMap).forEach(([ip, data]) => {
      const existingIndex = inspectionStatus.value.findIndex(item => item.ip === ip);
      if (existingIndex !== -1) {
        // 如果设备已存在，合并更新其数据
        inspectionStatus.value[existingIndex] = { ...inspectionStatus.value[existingIndex], ...data };
      } else {
        // 如果是新设备，添加到列表中
        inspectionStatus.value.push({ ip, ...data });
      }
    });

    // 检查所有任务是否都已完成或失败，如果是则停止轮询
    const allDone = Object.values(newStatusMap).every(item => 
      item.status === 'completed' || item.status === '已完成' || 
      item.status === 'failed' || item.status === '失败'
    );
    if (allDone && inspectionStatus.value.length > 0) {
      stopStatusPolling();
      ElMessage.success('所有巡检任务已完成');
      updateDailySummary(); // 所有任务完成后，最后更新一次每日汇总
    }

  } catch (error) {
    console.error('更新状态失败:', error);
    stopStatusPolling(); // 如果轮询失败，停止轮询
  }
};

// 获取每日累计汇总
const updateDailySummary = async () => {
  try {
    const response = await axios.get('http://localhost:5000/api/daily-summary');
    if (response.data) {
      dailyCumulativeSummary.value = response.data;
    }
  } catch (error) {
    console.error('获取每日汇总失败:', error);
  }
}

// 启动状态轮询
const startStatusPolling = () => {
  stopStatusPolling(); // 清除任何现有的定时器
  statusInterval = setInterval(updateStatus, 2000); // 每2秒轮询一次巡检状态
  dailySummaryInterval = setInterval(updateDailySummary, 5000); // 每5秒轮询一次每日汇总
};

// 停止状态轮询
const stopStatusPolling = () => {
  if (statusInterval) {
    clearInterval(statusInterval);
    statusInterval = null;
  }
  if (dailySummaryInterval) {
    clearInterval(dailySummaryInterval);
    dailySummaryInterval = null;
  }
};

// 查看巡检结果
const viewResults = async (row) => {
  try {
    const response = await axios.get(`http://localhost:5000/api/inspection/results?device_ip=${row.ip}`);
    currentResult.value = response.data.results;
    resultDialogVisible.value = true;
  } catch (error) {
    ElMessage.error(`获取 ${row.ip} 巡检结果失败: ${error.response?.data?.error || error.message}`);
    console.error('获取巡检结果失败:', error);
  }
};

// 组件挂载时执行
onMounted(() => {
  // 尝试从 Flask 后端加载之前选择的路径配置
  axios.get('http://localhost:5000/api/config').then(response => {
    if (response.data) {
      deviceFilePath.value = response.data.excel_path || '';
      commandFolder.value = response.data.command_folder || '';
      outputFolder.value = response.data.output_folder || '';
    }
  }).catch(error => {
    console.error('获取配置失败:', error);
  });
  
  // 组件挂载时，初始更新状态和每日汇总
  updateStatus();
  updateDailySummary();
});

// 组件卸载时执行
onUnmounted(() => {
  stopStatusPolling(); // 停止所有轮询
});
</script>

<style scoped>
.inspection-task {
  padding: 20px;
}

.task-header {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap; /* 允许在小屏幕上换行 */
}

.form-section {
  margin-bottom: 10px; /* 调整头部区域内的间距 */
  display: flex;
  align-items: center;
  gap: 10px;
}

.daily-summary {
  margin-top: 10px;
  width: 100%; /* 占据整行 */
  display: flex;
  align-items: center;
  gap: 10px;
  background-color: #e6f7ff; /* 淡蓝色背景 */
  border: 1px solid #91d5ff;
  padding: 8px 15px;
  border-radius: 4px;
}
.daily-summary .el-tag {
  font-size: 14px;
}

.result-content {
  white-space: pre-wrap;
  word-wrap: break-word;
  max-height: 60vh;
  overflow-y: auto;
  background-color: #f5f7fa;
  padding: 10px;
  border-radius: 4px;
}
</style>

---

### **2. 更改后的 `app.py` (Flask 后端)**

这个 `app.py` 文件现在将负责管理巡检任务的生命周期、与 Python 脚本的通信以及状态的持久化。

```python
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import subprocess
import threading
import json
import time
import pandas as pd # 确保安装 pandas: pip install pandas
import re # 用于解析文件名中的时间戳

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = './uploads' # 用于存储上传的设备文件和配置
SUMMARY_FOLDER = './summary' # 用于存储每日累计报告
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(SUMMARY_FOLDER, exist_ok=True)

# 全局状态：存储当前巡检任务的设备状态
# 结构: { ip: {status: 'pending/running/completed/failed', progress: 0, brand: '', reason: '', output_file: ''} }
inspection_status_map = {}

# 全局状态：存储最新的每日累计汇总数据
latest_daily_summary = {
    'success_total': 0,
    'failed_total': 0,
    'timestamp': ''
}

# 配置文件路径
CONFIG_FILE = os.path.join(UPLOAD_FOLDER, 'config.json')

def load_config():
    """从配置文件加载保存的路径配置"""
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except json.JSONDecodeError:
            print(f"Error: Could not decode JSON from {CONFIG_FILE}. Starting with empty config.")
            return {'excel_path': '', 'command_folder': '', 'output_folder': ''}
    return {'excel_path': '', 'command_folder': '', 'output_folder': ''}

def save_config(excel_path, command_folder, output_folder):
    """将路径配置保存到文件"""
    try:
        with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
            json.dump({
                'excel_path': excel_path,
                'command_folder': command_folder,
                'output_folder': output_folder
            }, f, ensure_ascii=False, indent=4)
    except IOError as e:
        print(f"Error: Could not save config to {CONFIG_FILE}. Reason: {e}")

# 初始化时加载配置
current_config = load_config()

# 线程函数：实时读取 inspect_engine.py 的标准输出并更新状态
def read_stdout_thread(process, device_ips_from_excel):
    global inspection_status_map, latest_daily_summary # 声明全局变量

    # 初始化所有设备的巡检状态为 'pending'
    for ip in device_ips_from_excel:
        if ip not in inspection_status_map: # 避免重复初始化
            inspection_status_map[ip] = {
                'status': '等待中', # 或 'pending'
                'progress': 0,
                'brand': '',
                'reason': '',
                'output_file': ''
            }

    print("开始读取 inspect_engine.py 的 stdout...")
    while True:
        line = process.stdout.readline()
        if not line: # Python 脚本结束时，readline() 返回空字符串
            break
        try:
            status_data = json.loads(line.strip())
            ip = status_data.get('ip')

            if ip and ip != "Summary" and ip != "DailyCumulative": # 处理单个设备状态
                current_status = status_data.get('status', 'unknown')
                progress_val = 0
                if current_status in ['巡检中', 'running']:
                    progress_val = 50
                elif current_status in ['巡检完毕', 'completed', 'success', '失败', 'failed']:
                    progress_val = 100

                # 更新设备状态
                inspection_status_map[ip] = {
                    'status': current_status,
                    'progress': progress_val,
                    'brand': status_data.get('brand', ''),
                    'reason': status_data.get('reason', ''),
                    'output_file': status_data.get('output_file', '') # inspect_engine.py 会传递此值
                }
            elif ip == "Summary" and status_data.get('status') == "daily_cumulative_summary": # 处理每日累计汇总
                latest_daily_summary['success_total'] = status_data.get('success_total', 0)
                latest_daily_summary['failed_total'] = status_data.get('failed_total', 0)
                latest_daily_summary['timestamp'] = status_data.get('timestamp', '')
                print(f"Captured Daily Cumulative Summary: {latest_daily_summary}")
            else:
                print(f"Received unknown status data: {status_data}")

        except json.JSONDecodeError:
            print(f"无法解析 inspect_engine.py 的 JSON 输出: {line.strip()}")
        except Exception as e:
            print(f"处理 inspect_engine.py 输出时出错: {e}, 行: {line.strip()}")
    
    # 脚本结束后，更新所有未完成任务的状态为失败
    for ip, data in inspection_status_map.items():
        if data['status'] in ['巡检中', '等待中', 'running', 'pending']:
            inspection_status_map[ip]['status'] = '失败' # 或 'failed'
            inspection_status_map[ip]['reason'] = '任务中断或未完成'
            inspection_status_map[ip]['progress'] = 100
    print("inspect_engine.py stdout 读取线程结束。")

# 线程函数：读取 inspect_engine.py 的标准错误
def read_stderr_thread(process):
    print("开始读取 inspect_engine.py 的 stderr...")
    while True:
        line = process.stderr.readline()
        if not line:
            break
        print(f"inspect_engine.py STDERR: {line.strip()}")
    print("inspect_engine.py stderr 读取线程结束。")


# --- Flask 路由 ---

# 路由：上传设备 Excel 文件
@app.route('/upload-devices', methods=['POST'])
def upload_devices():
    file = request.files.get('file')
    if not file:
        return jsonify({'error': '未上传文件'}), 400

    save_path = os.path.join(UPLOAD_FOLDER, 'devices.xlsx')
    try:
        file.save(save_path)
        current_config['excel_path'] = save_path
        save_config(**current_config) # 保存配置
        return jsonify({'message': '设备文件上传成功'})
    except Exception as e:
        return jsonify({'error': f'保存设备文件失败: {e}'}), 500

# 路由：设置命令文件夹路径
@app.route('/set-command-folder', methods=['POST'])
def set_command_folder():
    data = request.json
    folder_path = data.get('folder')
    if not folder_path or not os.path.exists(folder_path):
        return jsonify({'error': '命令文件夹不存在或无效'}), 400

    current_config['command_folder'] = folder_path
    save_config(**current_config) # 保存配置
    return jsonify({'message': '命令文件夹路径设置成功'})

# 路由：设置导出目录路径
@app.route('/set-output-folder', methods=['POST'])
def set_output_folder():
    data = request.json
    folder_path = data.get('folder')
    if not folder_path or not os.path.exists(folder_path):
        return jsonify({'error': '导出目录不存在或无效'}), 400

    current_config['output_folder'] = folder_path
    save_config(**current_config) # 保存配置
    return jsonify({'message': '导出目录路径设置成功'})

# 路由：获取当前配置路径 (用于前端加载已保存的路径)
@app.route('/api/config', methods=['GET'])
def get_config_api():
    return jsonify(current_config)

# 路由：启动巡检任务
@app.route('/api/inspection/start', methods=['POST'])
def start_inspection_api():
    global inspection_status_map

    excel_path = current_config.get('excel_path')
    command_dir = current_config.get('command_folder')
    export_dir = current_config.get('output_folder')

    # 检查所有必要路径是否已设置且有效
    if not all([excel_path, command_dir, export_dir]):
        return jsonify({'error': '请先选择所有必要的路径（Excel, 命令文件夹, 导出目录）'}), 400
    if not os.path.exists(excel_path):
        return jsonify({'error': '设备 Excel 文件不存在'}), 400
    if not os.path.exists(command_dir):
        return jsonify({'error': '命令文件夹不存在'}), 400
    os.makedirs(export_dir, exist_ok=True) # 确保导出目录存在

    # 读取 Excel 文件获取设备 IP 列表，用于初始化状态
    try:
        df = pd.read_excel(excel_path)
        # 假设 Excel 中包含 'ip', 'brand', 'username', 'password' 列
        # 确保列名与 inspect_engine.py 中预期的一致
        required_cols = ['ip', 'brand', 'username', 'password']
        if not all(col in df.columns for col in required_cols):
            return jsonify({'error': f'设备 Excel 文件缺少必要的列，需包含: {", ".join(required_cols)}'}), 400
        
        device_ips = df['ip'].tolist() # 获取 IP 列表
    except Exception as e:
        return jsonify({'error': f'无法读取设备 Excel 文件或缺少必要列: {e}'}), 500

    # Python 可执行文件路径
    # 请根据您的实际 Python 安装路径进行修改
    python_path = 'C:\\Python313\\python.exe' 

    # inspect_engine.py 脚本路径
    script_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'inspect_engine.py')

    if not os.path.exists(script_path):
        return jsonify({'error': 'inspect_engine.py 脚本未找到！'}), 500

    # 获取前端传递的并发数，如果未提供则使用默认值
    max_workers = request.json.get('maxWorkers', 5) 
    
    print(f"启动巡检脚本: {script_path}，参数: {excel_path}, {command_dir}, {export_dir}, {max_workers}")

    try:
        # 启动 Python 脚本作为子进程
        # bufsize=1 实现行缓冲，text=True 实现文本模式输出
        process = subprocess.Popen(
            [python_path, script_path, excel_path, command_dir, export_dir, str(max_workers)],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True, 
            bufsize=1 
        )
        
        # 启动单独的线程来实时读取标准输出 (用于状态更新)
        stdout_thread = threading.Thread(target=read_stdout_thread, args=(process, device_ips))
        stdout_thread.daemon = True # 设置为守护线程，主程序退出时自动终止
        stdout_thread.start()

        # 启动单独的线程来读取标准错误 (用于错误日志)
        stderr_thread = threading.Thread(target=read_stderr_thread, args=(process,))
        stderr_thread.daemon = True
        stderr_thread.start()

        # 返回所有设备的初始状态
        return jsonify(inspection_status_map) 

    except FileNotFoundError:
        return jsonify({'error': f'Python 可执行文件未找到，请检查路径: {python_path}'}), 500
    except Exception as e:
        return jsonify({'error': f'启动巡检脚本失败: {e}'}), 500

# 路由：获取实时巡检状态
@app.route('/api/inspection/status', methods=['GET'])
def get_inspection_status():
    return jsonify(inspection_status_map)

# 路由：获取每日累计汇总数据
@app.route('/api/daily-summary', methods=['GET'])
def get_daily_summary():
    return jsonify(latest_daily_summary)

# 路由：获取巡检结果文件内容
@app.route('/api/inspection/results', methods=['GET'])
def get_inspection_results():
    device_ip = request.args.get('device_ip')
    if not device_ip:
        return jsonify({'error': '缺少 device_ip 参数'}), 400

    output_folder = current_config.get('output_folder')
    if not output_folder or not os.path.exists(output_folder):
        return jsonify({'error': '导出目录未设置或不存在'}), 404

    # 查找给定 IP 的最新巡检结果文件
    latest_file = None
    latest_timestamp_val = 0
    
    # 结果文件命名格式通常为 IP_YYYYMMDD_HHMMSS.txt
    ip_pattern = re.compile(rf"^{re.escape(device_ip)}_(\d{{8}}_\d{{6}})\.txt$")
    
    for filename in os.listdir(output_folder):
        match = ip_pattern.match(filename)
        if match:
            try:
                # 提取并比较时间戳
                file_timestamp_str = match.group(1)
                file_timestamp_val = int(file_timestamp_str) # 转换为数字进行比较
                if file_timestamp_val > latest_timestamp_val:
                    latest_timestamp_val = file_timestamp_val
                    latest_file = os.path.join(output_folder, filename)
            except ValueError:
                # 忽略时间戳格式不正确的文件
                pass

    if latest_file and os.path.exists(latest_file):
        try:
            with open(latest_file, 'r', encoding='utf-8') as f:
                results = f.read()
            return jsonify({'results': results})
        except Exception as e:
            return jsonify({'error': f'无法读取结果文件: {e}'}), 500
    
    return jsonify({'error': '未找到该设备的巡检结果'}), 404


if __name__ == '__main__':
    # Flask 应用在主线程运行。子进程和线程在后台处理巡检逻辑。
    app.run(host='0.0.0.0', port=5000, debug=True) # debug=True 便于开发，生产环境请改为 False