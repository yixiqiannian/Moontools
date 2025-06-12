import { createApp } from 'vue'
import App from './App.vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import router from './router'
import { registerInspectionEvents } from './listeners/inspectionListener' // ✅ 添加监听器

const app = createApp(App)

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

app.use(pinia)
registerInspectionEvents() // ✅ 重要！注册全局监听器

app.use(router)
app.use(ElementPlus)
app.mount('#app')
