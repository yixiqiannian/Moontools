const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const fs = require('fs')
const { spawn, spawnSync } = require('child_process')


let mainWindow
let currentInspectionProcess = null  // 用于终止批量巡检


function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  if (app.isPackaged) {
    mainWindow.loadFile(path.join(__dirname, 'src/dist/index.html')) 
  } else {
    mainWindow.loadURL('http://localhost:5173') 
  }
}


app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})


// ===== 文件选择对话框 =====

ipcMain.handle('selectFile', async () => {
  const result = await dialog.showOpenDialog({ properties: ['openFile'] })
  return result.canceled ? null : result.filePaths[0]
})

ipcMain.handle('selectFolder', async () => {
  const result = await dialog.showOpenDialog({ properties: ['openDirectory'] })
  return result.canceled ? null : result.filePaths[0]
})

ipcMain.handle('select-export', async () => {
  const result = await dialog.showOpenDialog({ properties: ['openDirectory'] })
  return result.canceled ? null : result.filePaths[0]
})


// ===== 获取每日汇总信息 =====

ipcMain.handle('get-daily-summary', async () => {
  try {
    const summaryDir = path.join(__dirname, 'summary')
    const today = new Date().toISOString().slice(0, 10)
    const summaryFile = path.join(summaryDir, `${today}.txt`)

    if (!fs.existsSync(summaryFile)) {
      return { success_total: 0, failed_total: 0 }
    }

    const content = fs.readFileSync(summaryFile, 'utf-8')
    const match = content.match(/成功总计: (\d+)台, 失败总计: (\d+)台/)

    if (match) {
      return {
        success_total: parseInt(match[1], 10),
        failed_total: parseInt(match[2], 10)
      }
    } else {
      return { success_total: 0, failed_total: 0 }
    }
  } catch (err) {
    console.error('读取每日汇总失败:', err)
    return { success_total: 0, failed_total: 0 }
  }
})


// ===== 单台设备巡检 =====

ipcMain.handle('single-inspect', async (_event, deviceInfo) => {
  const exePath = path.join(__dirname, 'py_exe', 'single_inspect.exe') // 改为调用 .exe

  const py = spawnSync(exePath, [], {
    input: JSON.stringify(deviceInfo),
    cwd: __dirname,
    encoding: 'utf-8'
  })

  if (py.error) return { error: py.error.message }

  try {
    return JSON.parse(py.stdout)
  } catch (err) {
    return { output: py.stdout, error: err.message }
  }
})



// ===== 启动批量巡检 =====

ipcMain.handle('start-batch-inspection', async (_event, args) => {
  const { excelPath, commandDir, exportPath } = args
  const pyExePath = path.join(__dirname, 'py_exe', 'inspect_engine.exe') // 使用打包好的 exe
  const summaryPath = path.join(__dirname, 'summary')

  currentInspectionProcess = spawn(pyExePath, [excelPath, commandDir, exportPath,summaryPath], {
    cwd: __dirname
  })

  currentInspectionProcess.stdout.on('data', (data) => {
    const lines = data.toString().split('\n').filter(Boolean)
    for (const line of lines) {
      try {
        const json = JSON.parse(line.trim())
        if (json.status === 'daily_cumulative_summary') {
          mainWindow.webContents.send('daily-summary', json)
        } else {
          mainWindow.webContents.send('inspection-status', json)
        }
      } catch {
        console.warn('[跳过非 JSON 输出]:', line)
      }
    }
  })

  currentInspectionProcess.stderr.on('data', (data) => {
    const errorMsg = data.toString()
    console.error('Python 错误:', errorMsg)
    mainWindow.webContents.send('inspection-error', errorMsg)
  })

  currentInspectionProcess.on('close', (code) => {
    console.log('Python 脚本退出，代码:', code)
    mainWindow.webContents.send('inspection-complete', code)
    currentInspectionProcess = null
  })
})



// ===== 停止巡检任务 =====

ipcMain.handle('stop-inspection', async () => {
  if (currentInspectionProcess) {
    currentInspectionProcess.kill('SIGTERM')  // 安全终止
    currentInspectionProcess = null
    return { success: true, message: '已停止巡检任务' }
  } else {
    return { success: false, message: '没有正在运行的任务' }
  }
})
