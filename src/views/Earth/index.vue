<template>
    <div v-bind:style="{ width: screenSize.width + 'px', height: screenSize.height - 60 + 'px' }" id="cesiumContainer">
    </div>
</template>
<script>
import * as Cesium from "@cesium/engine"
import { Cartesian3, createOsmBuildingsAsync, Ion, Math as CesiumMath, Terrain, Viewer, CzmlDataSource } from "cesium";
import { mapGetters, mapActions } from "vuex"
import "cesium/Build/Cesium/Widgets/widgets.css";

import wdInfoMap from "@/utils/module/windowInfoUtil"

window.CESIUM_BASE_URL = '/node_modules/cesium/Build/Cesium';

export default {
    data() {
        return {
            viewer: undefined,
        }
    },
    mounted() {
        // Cesium的官网Token
        Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI1NDBkN2Y0Yy1jNzAxLTQ4MzgtYTQ2MC0zODdiN2Q3NmFhZTgiLCJpZCI6MTgwMzg4LCJpYXQiOjE3MDA3OTYzODh9.5CecpNsUZIzxfJEFK6N831bB939oqdbx3YRN34IZ31A';

        // Initialize the Cesium Viewer in the HTML element with the `cesiumContainer` ID.
        this.viewer = new Viewer('cesiumContainer', {
            shouldAnimate: true,
            infoBox: true, // 是否显示点击要素之后显示的信息
            // 去掉地球表面的大气效果黑圈问题
            orderIndependentTranslucency: true,

            contextOptions: {
                webgl: {
                    alpha: true,
                },
            },
            // 时间线
            timeline: true,
            // 时间加速盘
            animation: true,
            // -------------
            baseLayer: this.createImageryLayer('./data/cesium-assets/imagery/NaturalEarthII'),
            baseLayerPicker: false,
            geocoder: false,
            fullscreenButton: false,
            homeButton: false,
            navigationHelpButton: false,
            navigationInstructionsInitiallyVisible: false,
            sceneModePicker: false,
            selectionIndicator: false,
        });

        // Cesium default settings
        // 设置自动播放时钟
        this.viewer.clock.shouldAnimate = true;
        // 启用地球场景的照明效果
        this.viewer.scene.globe.enableLighting = true;
        // 增强场景的关照和颜色的动态范围
        this.viewer.scene.highDynamicRange = true;
        // 指定了场景每秒的最大渲染时间变化
        this.viewer.scene.maximumRenderTimeChange = 1 / 30;
        // 启用了请求渲染模式，允许场景在必要时请求进行渲染
        this.viewer.scene.requestRenderMode = true;

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
        },
        // 加载地球图层(data/cesium-assets/imagery/NaturalEarthII)
        createImageryLayer(url) {
            const provider = {
                create: () => Cesium.TileMapServiceImageryProvider.fromUrl(url, {
                    maximumLevel: 5,
                    credit: "Imagery courtesy Natural Earth",
                }),
                alpha: 1,
                base: true,
            }
            const layer = Cesium.ImageryLayer.fromProviderAsync(provider.create())
            layer.alpha = provider.alpha
            return layer
        }
    },
    computed: {
        ...mapGetters({
            screenSize: 'getWindowSize',
        }),
    }
}

</script>