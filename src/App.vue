<template>
  <div id="vue-admin-better">
    <Earth />
  </div>
</template>
<script>
import Earth from '@/views/Earth/index.vue'
import wdUtil from '@/utils/module/windowInfoUtil'
import wdInfoMap from "@/utils/module/windowInfoUtil"
import { mapActions } from 'vuex';
export default {
  components: { Earth },
  created() {
    // 创建窗口监听器
    wdUtil.setWindowSizeListener()

    // 初始化windowSize,存入store
    this.updateWindowSize(wdInfoMap.getwindowSize())
  },
  methods: {
    ...mapActions({
      updateWindowSize: 'setWindowSize',
    }),
  },
}
</script>