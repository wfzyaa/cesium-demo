<template>
    <Manu />
    <div>
        <RouterView />
    </div>
</template>
<script>
import Manu from '@/components/manu/index.vue'
import { RouterView } from 'vue-router'

export default {
    components: {
        Manu,
    },

};
</script>