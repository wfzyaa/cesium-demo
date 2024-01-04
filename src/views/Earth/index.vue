<template>
    <div v-bind:style="{ width: screenSize.width + 'px', height: screenSize.height - 60 + 'px' }" id="cesiumContainer">
    </div>
</template>
<script>
import { Cartesian3, createOsmBuildingsAsync, Ion, Math as CesiumMath, Terrain, Viewer } from "cesium";
import { mapGetters, mapActions } from "vuex"
import "cesium/Build/Cesium/Widgets/widgets.css";

import wdInfoMap from "@/utils/module/windowInfoUtil"

window.CESIUM_BASE_URL = '/node_modules/cesium/Build/Cesium';

export default {
    data() {
        return {
        }
    },
    mounted() {
        // Cesium的官网Token
        Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI1NDBkN2Y0Yy1jNzAxLTQ4MzgtYTQ2MC0zODdiN2Q3NmFhZTgiLCJpZCI6MTgwMzg4LCJpYXQiOjE3MDA3OTYzODh9.5CecpNsUZIzxfJEFK6N831bB939oqdbx3YRN34IZ31A';

        // Initialize the Cesium Viewer in the HTML element with the `cesiumContainer` ID.
        const viewer = new Viewer('cesiumContainer');
        console.log("finished...")
        console.log("wdInfoMap...",wdInfoMap)
        // 初始化windowSize,存入store
        this.updateWindowSize(wdInfoMap.getwindowSize())
    },
    methods: {
        ...mapActions({
            updateWindowSize: 'setWindowSize',
        }),
    },
    computed: {
        ...mapGetters({
            screenSize: 'getWindowSize',
        }),
    }
}

</script>