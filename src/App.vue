<template>
  <div id="vue-admin-better">
    <RouterView />
  </div>
</template>
<script>
import wdUtil from '@/utils/module/windowInfoUtil'
import wdInfoMap from "@/utils/module/windowInfoUtil"
import { RouterView } from 'vue-router'
import { mapActions } from 'vuex';
export default {
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