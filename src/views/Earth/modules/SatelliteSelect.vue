<template>
  <div v-if="type" class="box">
    <div v-if="type == 'satellite'" class="panel">
      <span style="font-size: 25px;">轨道控制</span>
      <span class="panel-item">
        <div style="white-space: nowrap;">选择卫星：</div>
        <el-select v-if="satelliteGroup" v-model="input" filterable placeholder="请输入卫星名称" :loading="loading"
          style="width:100%;">
          <el-option v-for="(value, key) in satelliteGroup" :key="key" :label="key" :value="key">
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
      <span v-for="station of satList" class="panel-item" @click="selectSatellite(station)">
        <span>{{ station.props.name }}</span>
        <span>
          <el-button type="success" @click="trackedSatellite(station)" circle><el-icon>
              <VideoCamera />
            </el-icon></el-button>
        </span>
      </span>
      <span style="font-size: 25px;">
        <el-button type="danger" @click="deTrackedGround" circle><el-icon>
            <VideoCamera />
          </el-icon></el-button>
      </span>
    </div>

    <div v-if="type == 'ground'" class="panel">
      <span style="font-size: 25px;">地面站控制</span>
      <span v-if="!enableClick" class="panel-item">
        <span>添加地面站：</span>
        <span>
          <el-button type="success" round @click="addMode">点击添加</el-button>
        </span>
      </span>
      <span v-if="enableClick" class="panel-item">
        <span>添加地面站：</span>
        <span style="color:gainsboro">请在地图上选择</span>
      </span>
      <span v-for="station of stationList" class="panel-item" @click="selectGround(station)">
        <span>{{ station.name }}</span>
        <span>
          <el-button type="success" @click="trackedGround(station)" circle><el-icon>
              <VideoCamera />
            </el-icon></el-button>
        </span>
      </span>
      <span style="font-size: 25px;">
        <el-button type="danger" @click="deTrackedGround" circle><el-icon>
            <VideoCamera />
          </el-icon></el-button>
      </span>
    </div>

    <div v-if="type == 'link'" class="panel">
      <span style="font-size: 25px;">链路可视化</span>
      <span v-if="!flag" class="panel-item" style="justify-content: center;padding-top:10px;padding-bottom: 10px;">
        <el-button type="success" @click="linkStart">开启演示场景</el-button>
      </span>
      <span v-if="flag" class="panel-item">
        <span>显示链路：</span>
        <el-switch v-model="value3" active-color="#13ce66" inactive-color="#ff4949" @change="linkChange">
        </el-switch>
      </span>
      <span v-if="flag" class="panel-item">
        <span>地面站1</span>
        <!-- <el-input-number :min="0" :max="maxNum" v-model="num1" @change="numChange($event, 1)"></el-input-number> -->
        <el-select v-model="groundName1" placeholder="Select" style="width: 150px">
          <el-option v-for="item in stationList" :key="item.name" :label="item.name" :value="item.name" />
        </el-select>
      </span>
      <span v-if="flag" class="panel-item">
        <span>地面站2</span>
        <!-- <el-input-number :min="0" :max="maxNum" v-model="num2" @change="numChange($event, 2)"></el-input-number> -->
        <el-select v-model="groundName2" placeholder="Select" style="width: 150px">
          <el-option v-for="item in stationList" :key="item.name" :label="item.name" :value="item.name" />
        </el-select>
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
      value3: false,
      options: [],
      loading: false,

      groundName1: undefined,
      groundName2: undefined,

      num1: 0,
      num2: 0,
    }
  },
  props: {
    satelliteGroup: {
      type: Object,
      default: undefined
    },
    type: {
      type: String,
      default: null
    },
    nowSatelliteGroup: {
      type: String,
      default: null
    },
    linkMode: {
      type: Boolean,
      default: false,
    },
    maxNum: {
      type: Number,
      default: 0,
    },
    addGroundModeFlag: {
      type: Boolean,
      default: false,
    },
    stationList: {
      type: Array,
      default: []
    },
    satList: {
      type: Array,
      default: [],
    },
  },
  computed: {
    input: {
      get() {
        return this.nowSatelliteGroup
      },
      set(value) {
        this.$emit('starChange', value)
      }
    },
    flag: {
      get() {
        return this.linkMode
      }
    },
    enableClick: {
      get() {
        return this.addGroundModeFlag
      }
    }
  },
  methods: {
    initSwitch() {
      this.value1 = false
      this.value2 = false
      this.value3 = false
    },
    OrbitChange(value) {
      this.$emit('OrbitChange', value)
    },
    AreaChange(value) {
      this.$emit('AreaChange', value)
    },
    linkChange(value) {
      this.$emit('linkChange', value, this.groundName1, this.groundName2)
    },
    linkStart() {
      this.$emit('linkStart')
    },
    numChange(value1, value2) {
      this.$emit('numChange', value1, value2)
    },
    addMode() {
      this.$emit('addMode')
    },
    selectSatellite(sat) {
      this.$emit('selectSatellite', sat)
    },
    trackedSatellite(sat) {
      this.$emit('trackedSatellite', sat)
    },
    selectGround(ground) {
      this.$emit('selectGround', ground)
    },
    trackedGround(ground) {
      this.$emit('trackedGround', ground)
    },
    deTrackedGround() {
      this.$emit('deTrackedGround')
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
