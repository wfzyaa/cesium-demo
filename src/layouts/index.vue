<template>
    <Manu />
    <div>
        <RouterView />
    </div>
</template>
<script>
import Manu from '@/components/manu/index.vue'
import wdUtil from '@/utils/module/windowInfoUtil'
import { RouterView } from 'vue-router'

export default {
    components: {
        Manu,
    },
    mounted() {
        // 创建窗口监听器
        wdUtil.setWindowSizeListener()
    },

};
</script>@/utils/module/windowInfoUtil/aaa