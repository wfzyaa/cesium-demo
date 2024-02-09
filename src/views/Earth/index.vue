<template>
    <div v-bind:style="{ width: screenSize.width + 'px', height: screenSize.height - 60 + 'px' }" id="cesiumContainer">
    </div>
</template>
<script>
import { Cartesian3, createOsmBuildingsAsync, Ion, Math as CesiumMath, Terrain, Viewer, CzmlDataSource } from "cesium";
import { mapGetters, mapActions } from "vuex"
import "cesium/Build/Cesium/Widgets/widgets.css";

import wdInfoMap from "@/utils/module/windowInfoUtil"

window.CESIUM_BASE_URL = '/node_modules/cesium/Build/Cesium';

export default {
    data() {
        return {
            viewer:undefined,
        }
    },
    mounted() {
        // Cesium的官网Token
        Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI1NDBkN2Y0Yy1jNzAxLTQ4MzgtYTQ2MC0zODdiN2Q3NmFhZTgiLCJpZCI6MTgwMzg4LCJpYXQiOjE3MDA3OTYzODh9.5CecpNsUZIzxfJEFK6N831bB939oqdbx3YRN34IZ31A';

        // Initialize the Cesium Viewer in the HTML element with the `cesiumContainer` ID.
        this.viewer = new Viewer('cesiumContainer');
        console.log("finished...")
        console.log("wdInfoMap...", wdInfoMap)
        // 初始化windowSize,存入store
        this.updateWindowSize(wdInfoMap.getwindowSize())
        // 加载初始卫星
        this.loadSatelliteTrack()
    },
    methods: {
        ...mapActions({
            updateWindowSize: 'setWindowSize',
        }),
        // 加载初始卫星
        loadSatelliteTrack() {
            setTimeout(() => {
                let dronePromise = CzmlDataSource.load(
                    "./data/output.czml"
                )
                // 加载实体
                dronePromise.then((dataSource) => {
                    this.viewer.dataSources.add(dronePromise);
                });
            }, 0)
        }
    },
    computed: {
        ...mapGetters({
            screenSize: 'getWindowSize',
        }),
    }
}

</script>