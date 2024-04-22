<template>
  <div class="box">
    <div class="panel">
      <span style="font-size: 25px;">轨道控制</span>
      <span class="panel-item">
        <div style="white-space: nowrap;">选择卫星：</div>
        <el-select v-if="satelliteGroup" v-model="input" filterable placeholder="请输入卫星名称" :loading="loading"
          style="width:100%;" @change="change">
          <el-option v-for="(value, key) in satelliteGroup" :key="key" :label="key" :value="value">
          </el-option>
        </el-select>
      </span>
      <span class="panel-item">
        <span>显示轨道：</span>
        <el-switch v-model="value1" active-color="#13ce66" inactive-color="#ff4949" @change="OrbitChange">
        </el-switch>
      </span>
      <span class="panel-item">
        <span>显示覆盖范围：</span>
        <el-switch v-model="value2" active-color="#13ce66" inactive-color="#ff4949" @change="AreaChange">
        </el-switch>
      </span>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      value1: false,
      value2: false,
      options: [],
      loading: false,
      input: "/tle/iss.txt",
    };
  },
  props: {
    satelliteGroup: {
      type: Object,
      default: undefined
    },
  },
  methods: {
    initSwitch() {
      this.value1 = false
      this.value2 = false
    },
    OrbitChange(value) {
      this.$emit('OrbitChange', value)
    },
    AreaChange(value) {
      this.$emit('AreaChange', value)
    },
    change(value) {
      this.$emit('starChange', value)
    },
    fun(value) {
      this.$emit('tempClickFun', value)
    },
  },
}
</script>

<style scoped>
.box {
  width: 300px;
  background-color: rgba(156, 156, 156, 0.171);
  color: white;
  font-weight: 600;
  font-size: 20px;
  border-radius: 10px;
}

.panel {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.panel-item {
  width: 100%;
  border-radius: 10px;
  background-color: rgba(66, 66, 66, 0.308);
  display: flex;
  padding-left: 10px;
  padding-right: 10px;
  justify-content: space-between;
  margin-bottom: 10px;
}
</style>
