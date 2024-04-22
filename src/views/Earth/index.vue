<template>
    <div v-bind:style="{ width: screenSize.width + 'px', height: screenSize.height - 60 + 'px' }" id="cesiumContainer">

        <div class="left top-box">
            <span style="display:flex">
                <ButtonComponent type="satellite" label="卫星选择" @click="changeMenu('satellite')"></ButtonComponent>
                <ButtonComponent type="ground" label="地面站选择" @click="changeMenu('ground')"></ButtonComponent>
                <ButtonComponent type="link" label="通讯链路演示" @click="changeMenu('link')"></ButtonComponent>
            </span>
            <SatelliteSelect ref="satelliteSelect" v-if="Menu['satellite']" :satelliteGroup="satelliteGroup" @OrbitChange="OrbitChange"
                @AreaChange="AreaChange" @starChange="starChange" @tempClickFun="fun">
            </SatelliteSelect>
        </div>

    </div>
</template>
<script>
import * as Cesium from "@cesium/engine"
import { Cartesian3, createOsmBuildingsAsync, Ion, Math as CesiumMath, Terrain, Viewer, CzmlDataSource, HeightReference } from "cesium";
import { mapGetters, mapActions } from "vuex"
import "cesium/Build/Cesium/Widgets/widgets.css";

import wdInfoMap from "@/utils/module/windowInfoUtil"

import { SatelliteManger } from "@/modules/SatelliteManager";
import { GroundStationEntity } from "@/modules/GroundStationEntity"
import ButtonComponent from "./modules/ButtonComponent.vue";
import SatelliteSelect from "./modules/SatelliteSelect.vue";

window.CESIUM_BASE_URL = '/node_modules/cesium/Build/Cesium';

export default {
    data() {
        return {
            viewer: undefined,
            sats: undefined,
            groundStations: [],

            Menu: {
                satellite: false,
                ground: false,
                link: false,
            },

            satelliteGroup: {
                iss卫星: "/tle/iss.txt",
                starlink星座: "/tle/starlink.txt",
                o3b星座: "/tle/o3bfm.txt",
                mystar: "/tle/mystar.txt",
            }
            // this.sats.addFromTleUrl('/tle/iss.txt', ['station'], cb)
            // this.sats.addFromTleUrl('/tle/starlink.txt', ['station'], cb)
            // this.sats.addFromTleUrl('/tle/o3bfm.txt', ['station'], cb)
            // this.sats.addFromTleUrl('/tle/mystar.txt', ['station'], cb)
        }
    },
    components: { ButtonComponent, SatelliteSelect },
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


        this.sats = new SatelliteManger(this.viewer)

        // 加载默认卫星
        this.LoadDefaultSatellites()
        // 测试部分-----------------------------------------------------


        return
        this.setGroundStationFromGeolocation()

        const p = { latitude: 20.2222290039062, longitude: 100.111141204834 }
        this.tempStation(p)

        // Tle上传一个卫星轨道
        this.addSatelliteFromTle(() => {
            this.enableSatelliteFromTle()
            console.log("complete...")
            console.log("SatellateManager...", this.sats.satellites)

            setTimeout(() => {
                // this.addTempLinkBystarNo(0, 1)
                // this.addTempLinkBystarNo(1, 2)

                this.addTempLinkStarNOStationNo(0, 0)
                this.addTempLinkStarNOStationNo(0, 1)

                this.sats.satellites[0].createArea()

            }, 500);


            // this.addTempLinkStarNOStationNo(2, 0)
        })

        // 添加点击监听器
        // this.createInputHandler()
    },
    methods: {
        // 初始化部分----------------------------------------------------------------------------------
        ...mapActions({
            updateWindowSize: 'setWindowSize',
        }),
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

        // ----------------------------------------------------------------------------------------
        LoadDefaultSatellites() {
            this.sats.addFromTleUrl('/tle/iss.txt', ['station'], () => {
                this.sats.enableComponents('Point')
            })
        },

        addSatelliteFromTle(cb = null) {
            // this.sats.addFromTleUrl('/tle/iss.txt', ['station'], cb)
            // this.sats.addFromTleUrl('/tle/starlink.txt', ['station'], cb)
            // this.sats.addFromTleUrl('/tle/o3bfm.txt', ['station'], cb)
            this.sats.addFromTleUrl('/tle/mystar.txt', ['station'], cb)
        },
        enableSatelliteFromTle() {
            this.sats.enableComponents('Point')
            this.sats.enableComponents('Orbit')
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
                const groundStation = new GroundStationEntity(this.viewer, coordinates)
                this.groundStations.push(groundStation)
            });
        },
        // 触发函数-------------------------------
        createInputHandler() {
            const handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas)
            handler.setInputAction((event) => {
                this.handleClick(event)
            }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
        },

        handleClick(event) {
            console.log("click!!!", event)
            const cartesian = this.viewer.camera.pickEllipsoid(event.position);
            const didHitGlobe = Cesium.defined(cartesian);
            if (didHitGlobe) {
                const coordinates = {};
                const cartographicPosition = Cesium.Cartographic.fromCartesian(cartesian);
                coordinates.longitude = Cesium.Math.toDegrees(cartographicPosition.longitude);
                coordinates.latitude = Cesium.Math.toDegrees(cartographicPosition.latitude);
                coordinates.height = Cesium.Math.toDegrees(cartographicPosition.height);
                coordinates.cartesian = cartesian;
                const groundStation = new GroundStationEntity(this.viewer, coordinates)
                this.groundStations.push(groundStation)
            }
        },

        tempStation(position) {
            const coordinates = {}
            coordinates.longitude = (position.longitude);
            coordinates.latitude = (position.latitude);
            coordinates.height = 0;
            coordinates.cartesian = Cesium.Cartesian3.fromDegrees(coordinates.longitude, coordinates.latitude, coordinates.height)
            const groundStation = new GroundStationEntity(this.viewer, coordinates)
            this.groundStations.push(groundStation)
        },

        addTempLinkBystarNo(n1, n2) {
            this.addTempLink(this.sats.satellites[n1].components['Point'].position, this.sats.satellites[n2].components['Point'].position)
        },
        addTempLinkStarNOStationNo(n1, n2) {
            this.addTempLink(this.sats.satellites[n1].components['Point'].position, this.groundStations[n2].position)
        },

        addTempLink(p1, p2) {
            this.viewer.entities.add({
                polyline: {
                    positions: new Cesium.CallbackProperty((time, result) => {
                        var lon1, lat1, height1, lon2, lat2, height2
                        try {
                            const sourpos = p1.getValue(time);
                            const cartographic1 = Cesium.Cartographic.fromCartesian(sourpos);
                            lon1 = Cesium.Math.toDegrees(cartographic1.longitude);
                            lat1 = Cesium.Math.toDegrees(cartographic1.latitude);
                            height1 = cartographic1.height;
                        } catch {
                            lon1 = p1.longitude
                            lat1 = p1.latitude
                            height1 = 0
                        }
                        try {
                            const tarpos = p2.getValue(time);
                            const cartographic2 = Cesium.Cartographic.fromCartesian(tarpos);
                            lon2 = Cesium.Math.toDegrees(cartographic2.longitude);
                            lat2 = Cesium.Math.toDegrees(cartographic2.latitude);
                            height2 = cartographic2.height;
                        } catch {
                            lon2 = p2.longitude
                            lat2 = p2.latitude
                            height2 = 0
                        }

                        return Cesium.Cartesian3.fromDegreesArrayHeights([lon1, lat1, height1, lon2, lat2, height2]);
                    }, false),
                    width: 2,
                    // 设置直线为不符合椭球表面的直线
                    arcType: Cesium.ArcType.NONE,
                    material: Cesium.Color.GREEN,
                }
            })
        },

        // 视图控制部分--------------------------------------
        changeMenu(name) {
            console.log("name...", name)
            for (let key in this.Menu) {
                if (name == key) {
                    this.Menu[key] = !this.Menu[key]
                } else {
                    this.Menu[key] = false
                }
            }
            console.log("Menu...", this.Menu)
        },

        // 子组件通信------------------------------------------
        OrbitChange(value) {
            console.log(value)
            if (value) {
                this.sats.enableComponents("Orbit")
            } else {
                this.sats.disableComponents("Orbit")
            }
        },

        AreaChange(value) {
            console.log(value)
            if (value) {
                this.sats.enableComponents("Area")
            } else {
                this.sats.disableComponents("Area")
            }
        },

        starChange(value) {
            this.sats.deleteAll()
            this.sats.addFromTleUrl(value, ['station'], () => {
                this.sats.enableComponents('Point')
                this.$refs.satelliteSelect.initSwitch()
            })
        },

        fun(value) {
            console.log("clicked:", value)
            switch (value) {
                case 1:
                    this.addSatelliteFromTle()
                    break
                case 2:
                    this.sats.satellites.forEach((sat) => {
                        sat.init()
                    })
                    break
                case 3:
                    this.sats.satellites.forEach((sat) => {
                        sat.createComponent("Point")
                    })
                    break
                case 4:
                    this.sats.satellites.forEach((sat) => {
                        sat.manualEnableComponent("Point")
                    })
                    break
                case 5:
                    this.sats.satellites.forEach((sat) => {
                        sat.manualDisableComponent("Point")
                    })
                    break
                case 6:
                    this.sats.satellites.forEach((sat) => {
                        sat.deleteComponent("Point")
                    })
                    break
                case 7:
                    this.sats.satellites.forEach((sat) => {
                        sat.deinit()
                    })
                    break
                default:
                    break
            }
        }
    },
    computed: {
        ...mapGetters({
            screenSize: 'getWindowSize',
        }),
    }
}

</script>
<style scoped>
#cesiumContainer {
    position: relative;
}

.top-box {
    position: absolute;
    top: 10px;
    /* width: 300px; */
    /* height: 300px; */

}

.bottom-box {
    position: absolute;
    bottom: 150px;
    /* width: 300px;
    height: 300px; */
    z-index: 999;
}

.left {
    left: 10px;
    z-index: 3;
}

.right {
    right: 20px;
    /* background-color: hsla(199, 100%, 49%, 0.342); */
}

#toolbarLeft {
    position: absolute;
    top: 5px;
    left: 2px;
}
</style>