import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/overview'  // 默认重定向
  },
  {
    path: '/overview',
    component: () => import('../components/Moonindex.vue'),
    name: 'Home'
  },
  {
    path: '/batch',
    component: () => import('../components/DeviceManager.vue'),
    name: 'BatchInspect'
  },
  {
    path: '/single',
    component: () => import('../components/single.vue'),
    name: 'single'
  },
  {
    path: '/status',
    component: () => import('../components/status.vue'),
    name: 'status'
  }
  ,
  {
    path: '/single',
    component: () => import('../components/SingleInspect.vue'),
    name: 'single'
  }

]


const router = createRouter({
  history: createWebHashHistory(), // 或 createWebHistory()
  routes
})

export default router
