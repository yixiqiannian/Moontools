import { defineStore } from 'pinia'

export const usePathStore = defineStore('path', {
  state: () => ({
    devicePath: '',
    commandFolder: '',
    outputFolder: ''
  }),
  actions: {
    setPaths({ devicePath, commandFolder, outputFolder }) {
      if (devicePath) this.devicePath = devicePath
      if (commandFolder) this.commandFolder = commandFolder
      if (outputFolder) this.outputFolder = outputFolder
    }
  },
  persist: true  // ✅ 关键：自动持久化到 localStorage
})
