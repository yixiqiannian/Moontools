<template>
  <div class="sidebar">
    <img class="avatar" src="../assets/dmn1.jpg" />
    <div class="username">Moon</div>
    <div class="bottom-text">也许明天更好呢？</div>

    <el-menu
      router
      :default-active="$route.path"
      class="menu"
    >
      <el-menu-item index="/overview">总览</el-menu-item>
      <el-menu-item index="/batch">批量巡检</el-menu-item>
      <!-- <el-menu-item index="/single">单台巡检</el-menu-item> -->
      <el-menu-item index="/status">巡检状态</el-menu-item>
      <!-- <el-menu-item index="/ip">IP地址探测</el-menu-item> -->
    </el-menu>

    <div class="ip-info">
      <p>微信公众号关注 <b>"Moon杂选"</b><br>获取最新版</p>
      <div class="qr-section">
        <img class="qr-image" src="../assets/Moon.jpg" alt="二维码">
        <div class="scan-tip">扫一扫获取更多</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router'
const $route = useRoute()
</script>

<style scoped>
.sidebar {
  width: 220px;
  height: 100vh;
  background-color: #fff;
  border-right: 1px solid #ddd;
  padding: 20px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: 10;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.05);
}

.menu {
  width: 100%;
  border-right: none;
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

::v-deep(.el-menu-item) {
  justify-content: center;
}

.avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  margin-bottom: 10px;
}

.username {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 20px;
  text-align: center;
}

.ip-info {
  font-size: 12px;
  color: #555;
  text-align: center;
  margin-top: auto;
  margin-bottom: 40px;
  padding: 0 10px;
}

.qr-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 10px;
}

.qr-image {
  width: 80%;
  max-width: 160px;
  height: auto;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.scan-tip {
  margin-top: 6px;
  font-size: 12px;
  color: #888;
}

.bottom-text {
  font-size: 12px;
  color: #555;
  margin-top: 30px;
  text-align: center;
}
</style>
