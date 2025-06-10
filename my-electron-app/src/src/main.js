import { createApp } from 'vue'
import './style.css'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import App from './App.vue'
// 引入 Element Plus
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
// 路由
import router from './router'


const app = createApp(App);
const pinia = createPinia(); // 创建 Pinia 实例
pinia.use(piniaPluginPersistedstate); // 应用持久化插件

app.use(pinia) // 将 Pinia 实例应用到 Vue 应用
app.use(router) // 应用 Vue Router
app.use(ElementPlus); // 应用 Element Plus

app.mount('#app'); // 挂载 Vue 应用