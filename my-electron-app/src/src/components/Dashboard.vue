<template>
  <div class="container">
    <!-- 左侧边栏 -->
    <div class="sidebar">
      <img class="avatar" src="../assets/dmn1.jpg" alt="头像" />
      <div class="username">Moon</div>

      <el-menu class="menu" router>
        <el-menu-item>批量巡检</el-menu-item>
        <el-menu-item>单台巡检</el-menu-item>
        <el-menu-item>巡检状态</el-menu-item>
        <el-menu-item>IP地址探测</el-menu-item>
      </el-menu>

      <div class="ip-info">当前ip:192.168.10.22</div>
      <div class="bottom-text">也许明天更好呢？</div>
    </div>

    
  </div>
</template>

<script setup>
</script>

<style scoped>
.container {
  display: flex;
  height: 100vh;
}

.sidebar {
  width: 200px;
  background-color: #fff;
  border-right: 1px solid #ccc;
  padding: 20px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  margin-bottom: 10px;
}

.username {
  font-weight: bold;
  font-size: 18px;
  margin-bottom: 20px;
}

.menu {
  width: 100%;
  flex-grow: 1;
  border-right: none;
}

.ip-info {
  font-size: 12px;
  color: #555;
  margin-bottom: 5px;
}

.bottom-text {
  font-size: 12px;
  color: #333;
  text-align: center;
}

.main {
  flex: 1;
  background-color: #fcfcfc;
  padding: 30px;
}

.header {
  text-align: center;
  color: #a40000;
  font-weight: bold;
  font-size: 16px;
  margin-bottom: 40px;
  border-bottom: 1px solid #333;
  padding-bottom: 10px;
}

.cards {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 30px;
}

.card {
  width: 500px;
  text-align: center;
  font-size: 20px;
}

.value {
  font-weight: bold;
}

.blue {
  border: 1px solid #00cfff;
  color: #5a6fdc;
}

.green {
  border: 1px solid #2ecc71;
  color: #2ecc71;
}

.red {
  border: 1px solid #e74c3c;
  color: #e74c3c;
}
</style>
