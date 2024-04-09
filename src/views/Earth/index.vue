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

import { SatelliteManger } from "@/modules/SatelliteManager";
import { GroundStationEntity } from "@/modules/GroundStationEntity"

window.CESIUM_BASE_URL = '/node_modules/cesium/Build/Cesium';

export default {
    data() {
        return {
            viewer: undefined,
            sats: undefined,
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
            sceneModePicker: true,
            selectionIndicator: false,
        });

        this.sats = new SatelliteManger(this.viewer)

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

        console.log("viewer load finished...")
        console.log("windows infomation:", wdInfoMap)
        // 初始化windowSize,存入store
        this.updateWindowSize(wdInfoMap.getwindowSize())
        // 加载初始卫星
        // this.loadSatelliteTrack()

        // 测试部分-----------------------------------------------------
        // Tle上传一个卫星轨道
        this.addSatelliteFromTle(() => {
            this.enableSatelliteFromTle()
            console.log("complete...")
            console.log("SatellateManager...", this.sats.satellites)
            // 创建连线
            // this.viewer.entities.add({
            //     polyline: {
            //         positions: [this.sats.satellites[0].props.sampledPosition.inertial,
            //         this.sats.satellites[1].props.sampledPosition.inertial],
            //         width: 2,
            //         material: Cesium.Color.GREEN
            //     }
            // })
            // console.log("satelliteCollection",this.sats.satellites[0].props.sampledPosition.inertial)
        })
        // this.setGroundStationFromGeolocation()
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
                    // console.log('dataSource...',dataSource)
                    // 通过ID选择需要轨迹的实体
                    console.log("datasource-array...", dataSource.entities._entities._array)
                    dataSource.entities._entities._array.forEach((ele) => {
                        this.viewer.entities.add(ele)

                        let entityColor, entityImage, imageColor
                        // 实体之间的连线
                        if (ele.path === undefined && ele.polyline !== undefined) {
                            let curColor = ele.polyline.material.color, image
                            let randomNumber = Math.floor(Math.random() * 10)
                            if (6 < randomNumber && randomNumber <= 9) {
                                image = "bar-line-red.png";
                            } else if (3 < randomNumber && randomNumber <= 6) {
                                image = "bar-line-blue.png";
                            } else {
                                image = "bar-line-red.png";
                            }

                            ele.polyline.material = new Cesium.LineFlowMaterialProperty({
                                color: curColor,
                                speed: 50,
                                percent: 0.5,
                                gradient: 0.1,
                            });
                        }

                        // 1. 配置样式与路径
                        if (ele.label != undefined) {
                            ele.label.show = false;
                        }
                    })
                });
            }, 0)
        },

        addSatelliteFromTle(cb = null) {
            // this.sats.addFromTleUrl('/tle/iss.txt', ['station'], true, cb)
            this.sats.addFromTleUrl('/tle/starlink.txt', ['station'], true, cb)
            // this.sats.addFromTleUrl('/tle/o3bfm.txt', ['station'], true, cb)
            // this.sats.addFromTleUrl('/tle/mystar.txt', ['station'], true, cb)
        },
        enableSatelliteFromTle() {
            this.sats.enableComponents('Point')
            this.sats.enableComponents('Orbit')
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
        },
        // 地面站------------------------------
        setGroundStationFromGeolocation() {
            navigator.geolocation.getCurrentPosition((position) => {
                if (typeof position === "undefined") {
                    return;
                }
                const coordinates = {};
                coordinates.longitude = position.coords.longitude;
                coordinates.latitude = position.coords.latitude;
                coordinates.height = position.coords.altitude;
                coordinates.cartesian = Cesium.Cartesian3.fromDegrees(coordinates.longitude, coordinates.latitude, coordinates.height);
                this.groundStation = new GroundStationEntity(this.viewer, coordinates)
            });
        }
    },
    computed: {
        ...mapGetters({
            screenSize: 'getWindowSize',
        }),
    }
}

</script>