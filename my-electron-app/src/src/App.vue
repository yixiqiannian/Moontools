<template>
  <div class="layout">
    <Sidebar />
    <div class="main-content">
      <router-view :key="$route.fullPath" />
    </div>
  </div>
</template>

<script setup>
import Sidebar from './components/Sidebar.vue'
</script>

<style scoped>
.layout {
  display: flex;
  height: 100vh;
}
.main-content {
  flex: 1;
  margin-left: 220px;
  padding: 30px 40px;
  background-color: #f7f7f7;
}
</style>
