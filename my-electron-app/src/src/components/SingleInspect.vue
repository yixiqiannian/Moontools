<template>
  <el-card class="single-inspect">
    <template #header>单台设备巡检</template>

    <el-form :model="form" label-width="100px">
      <el-form-item label="设备 IP">
        <el-input v-model="form.ip" />
      </el-form-item>

      <el-form-item label="品牌">
        <el-select v-model="form.brand" placeholder="请选择">
          <el-option label="Cisco" value="cisco" />
          <el-option label="Huawei" value="huawei" />
          <el-option label="H3C" value="h3c" />
        </el-select>
      </el-form-item>

      <el-form-item label="用户名">
        <el-input v-model="form.username" />
      </el-form-item>

      <el-form-item label="密码">
        <el-input v-model="form.password" show-password />
      </el-form-item>

      <el-form-item>
        <el-button type="primary" @click="handleSingleInspect">开始巡检</el-button>
      </el-form-item>
    </el-form>

    <div v-if="result">
      <h3>巡检结果：</h3>
      <pre>{{ result }}</pre>
    </div>
  </el-card>
</template>

<script setup>
import { ref } from 'vue'

const form = ref({
  ip: '',
  brand: '',
  username: '',
  password: ''
})

const result = ref('')

const handleSingleInspect = async () => {
  const plainForm = {
    ip: form.value.ip,
    brand: form.value.brand,
    username: form.value.username,
    password: form.value.password
  }

  const response = await window.electronAPI.singleInspect(plainForm)
  result.value = JSON.stringify(response, null, 2)
}

</script>

<style scoped>
.single-inspect {
  max-width: 600px;
  margin: 0 auto;
}
</style>
