<template>
    <div v-bind:style="{ width: screenSize.width + 'px', height: screenSize.height - 60 + 'px' }" id="cesiumContainer">

        <div class="left top-box">
            <span style="display:flex">
                <ButtonComponent type="satellite" label="卫星选择" @click="changeMenu('satellite')"></ButtonComponent>
                <ButtonComponent type="ground" label="地面站选择" @click="changeMenu('ground')"></ButtonComponent>
                <ButtonComponent type="link" label="通讯链路演示" @click="changeMenu('link')"></ButtonComponent>
                <el-button style="margin-top:2px;margin-left:2px;" type="success" @click="download">
                    导出轨道文件
                    <el-icon class="el-icon--right">
                        <Download />
                    </el-icon>
                </el-button>
                <!-- <el-button native-type="file" style="margin-top:2px;margin-left:6px;" type="primary">导入轨道文件
                    <el-icon class="el-icon--right">
                        <Upload />
                    </el-icon>
                </el-button> -->
            </span>
            <SatelliteSelect ref="satelliteSelect" v-if="shownMenu" :nowSatelliteGroup="nowSatelliteGroup"
                :type="shownMenu" :satelliteGroup="satelliteGroup" :linkMode="linkMode"
                :addGroundModeFlag="addGroundModeFlag" :stationList="stationList" :satList="sats.satellites"
                @OrbitChange="OrbitChange" @AreaChange="AreaChange" @starChange="starChange" @linkChange="linkChange"
                @linkStart="linkStart" @addMode="addMode" @selectSatellite="selectSatellite"
                @trackedSatellite="trackedSatellite" @selectGround="selectGround" @trackedGround="trackedGround"
                @deTrackedGround="deTrackedGround">
            </SatelliteSelect>
        </div>

        <div v-if="showSatInfoFlag" class="right top-box2">
            <SatelliteData :type="0" :satData="nowSatelliteData.satData" :satName="nowSatelliteData.satName">
            </SatelliteData>
        </div>
        <div v-if="showGroundInfoFlag" class="right top-box3">
            <SatelliteData :type="1" :satData="nowGroundData.satData" :satName="nowGroundData.satName"></SatelliteData>
        </div>

    </div>
</template>
<script>
import * as Cesium from "@cesium/engine"
import { Cartesian3, createOsmBuildingsAsync, Ion, Math as CesiumMath, Terrain, Viewer, CzmlDataSource, HeightReference } from "cesium";
import { mapGetters } from "vuex"
import "cesium/Build/Cesium/Widgets/widgets.css";


import { SatelliteManger } from "@/modules/SatelliteManager";
import ButtonComponent from "./modules/ButtonComponent.vue";
import SatelliteSelect from "./modules/SatelliteSelect.vue";
import SatelliteData from "./modules/SatelliteData.vue";
import groundsData from "/public/data/groundStation";

window.CESIUM_BASE_URL = '/node_modules/cesium/Build/Cesium';

export default {

    components: { ButtonComponent, SatelliteSelect, SatelliteData },
    data() {
        return {
            viewer: undefined,
            sats: undefined,
            groundStations: [],
            shownMenu: null,

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
                自定义场景: "/tle/null.txt",
            },

            nowSatelliteGroup: "iss卫星",
            nowSelectedSat: undefined,
            nowSatelliteData: {
                satName: null,
                satData: {}
            },

            nowSelectedGround: undefined,
            nowGroundData: {
                satName: null,
                satData: {}
            },

            linkMode: false,

            ground1: undefined,
            ground2: undefined,

            addGroundModeFlag: false,
            stationList: [],
            nameId: 0,

            // 保留最近的卫星
            nearestLinkedStar1: null,
            nearestLinkedStar2: null,

            linkGround1: null,
            linkGround2: null,

            // 是否正在连接
            linking: false,

            // 是否处于覆盖范围内
            reachable1: false,
            reachable2: false,

            showGroundInfoFlag: false,
            showSatInfoFlag: false,
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
            // 自定义地球图层
            baseLayer: this.createImageryLayer('./data/cesium-assets/imagery/NaturalEarthII'),
            baseLayerPicker: false,
            geocoder: false,
            fullscreenButton: false,
            homeButton: false,
            navigationHelpButton: false,
            navigationInstructionsInitiallyVisible: false,
            sceneModePicker: true,
            selectionIndicator: false,
            // 取消原生消息弹窗
            infoBox: false,

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


        this.sats = new SatelliteManger(this.viewer)

        // 加载默认卫星(异步函数)
        this.LoadDefaultSatellites()


        // 加载地面站
        this.setGroundStationFromGeolocation()

        // 添加点击监听器
        this.createInputHandler()

    },
    methods: {
        // 初始化部分----------------------------------------------------------------------------------
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
            // navigator.geolocation.getCurrentPosition((position) => {
            //     this.sats.setGroundStation(position, "MyStation")
            //     console.log("position", position)
            //     this.stationList = [...this.sats.groundStations]
            // })
            groundsData.forEach((ground) => {
                this.sats.setGroundStation(ground.position, ground.name)
            })
            this.stationList = [...this.sats.groundStations]


        },

        // 点击添加地面站-------------------------------
        createInputHandler() {
            const handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas)
            handler.setInputAction((event) => {
                this.handleClick(event)
            }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
        },

        handleClick(event) {
            if (this.addGroundModeFlag) {
                this.sats.setGroundStationfromClick(event, "Station" + (++this.nameId))
                this.stationList = [...this.sats.groundStations]
                this.addGroundModeFlag = false
            }
        },

        // 按钮事件--------------------------------------
        download() {
            const string = this.sats.originData
            if (!string) {
                return
            }
            const blob = new Blob([string], {
                type: "text/plain;charset=utf-8"
            })
            const objectURL = URL.createObjectURL(blob)
            const aTag = document.createElement('a')
            aTag.href = objectURL
            aTag.download = this.nowSatelliteGroup + ".txt"
            aTag.click()
            URL.revokeObjectURL(objectURL)
        },

        // 上传
        handlePreview(file) {
            console.log(file)
        },

        changeMenu(name) {
            for (let key in this.Menu) {
                if (name == key) {
                    this.Menu[key] = !this.Menu[key]
                    if (this.Menu[key]) {
                        this.shownMenu = name
                    } else {
                        this.shownMenu = null
                    }
                } else {
                    this.Menu[key] = false
                }

            }
        },
        linkStart() {
            if (this.nowSatelliteGroup !== "mystar") {
                this.starChange("mystar", () => {
                    this.sat1 = this.sats.satellites[0]
                    this.sat2 = this.sat1
                    this.sats.addLinkForAllSatellite()
                    this.linkMode = true
                })
            } else {
                this.sats.addLinkForAllSatellite()
                this.linkMode = true
            }
        },
        linkEnd() {
            this.linkMode = false
            // 删除卫星网资源
            this.sats.clearLinkForAllSatellite()
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

        starChange(value, cb = null) {
            if (this.nowSatelliteGroup === value) {
                return
            }

            if (this.nowSatelliteGroup === "mystar") {
                // 删除链路
                this.stopLink()
                // 关闭通信场景
                this.linkEnd()
            }
            // 移除选中卫星
            this.clearSatSelect()
            this.nowSatelliteGroup = value
            this.sats.deleteAll()
            this.sats.addFromTleUrl(this.satelliteGroup[value], ['station'], () => {
                this.sats.enableComponents('Point')
                if (this.$refs["satelliteSelect"]) {
                    this.$refs.satelliteSelect.initSwitch()
                }
                if (cb) {
                    cb()
                }
            })
        },

        addMode() {
            this.addGroundModeFlag = true
        },
        //通讯演示部分 -------------------------------------------------------------------------

        linkChange(value, groundName1, groundName2) {
            if (value) {
                this.sats.showLinkPath(this.sat1, this.sat2)

                this.linkGround1 = this.sats.groundStations.find(ground => ground.name == groundName1)
                this.linkGround2 = this.sats.groundStations.find(ground => ground.name == groundName2)
                if (!this.linkGround1 || !this.linkGround2) {
                    return
                }

                // 模拟天地连接 groundStations satellites
                this.linkGS1(this.linkGround1)
                this.linkGS2(this.linkGround2)


            } else {
                this.stopLink()
            }
        },

        // 停止通讯模拟
        stopLink() {
            this.closeLink()
            // 移除监听器
            this.sats.deListenDistance()
            // 关闭链路
            this.nearestLinkedStar1 = null
            this.nearestLinkedStar2 = null

            this.linkGround1 = null
            this.linkGround2 = null

            this.linking = false
        },


        // 创建链路
        showLink() {
            this.sats.linkGroundStar(this.linkGround1, this.nearestLinkedStar1)
            this.sats.linkGroundStar(this.linkGround2, this.nearestLinkedStar2)
            this.sats.showLinkPath(this.nearestLinkedStar1, this.nearestLinkedStar2)
        },

        // 清除链路
        closeLink() {
            this.sats.deLinkGroundStar(this.linkGround1, this.nearestLinkedStar1)
            this.sats.deLinkGroundStar(this.linkGround2, this.nearestLinkedStar2)
            this.sats.closeLinkPath()
        },

        linkGS1(ground) {
            this.sats.listenDistance(ground, (Satellites) => {
                const target = Satellites[0]
                // 处理地面站同时处于两个卫星覆盖范围内的情况
                if (target.star !== this.nearestLinkedStar1) {
                    // 判断最近的卫星发生变化
                    if (this.nearestLinkedStar1) {
                        this.reachable1 = false
                        this.closeLink()
                    }
                    this.nearestLinkedStar1 = target.star
                }
                if (target.reachable) {
                    this.reachable1 = true
                } else {
                    this.reachable1 = false
                }
            })
        },
        linkGS2(ground) {
            this.sats.listenDistance(ground, (Satellites) => {
                const target = Satellites[0]
                // 处理地面站同时处于两个卫星覆盖范围内的情况
                if (target.star !== this.nearestLinkedStar2) {
                    if (this.nearestLinkedStar2) {
                        this.reachable2 = false
                        this.closeLink()
                    }
                    this.nearestLinkedStar2 = target.star
                }
                if (target.reachable) {
                    this.reachable2 = true
                } else {
                    this.reachable2 = false
                }
            })
        },
        // 选择卫星----------------------------------------------------------------
        selectSatellite(sat) {
            if (this.nowSelectedSat) {
                this.nowSelectedSat.deListenData()
            }
            this.showSatInfoFlag = true
            this.nowSatelliteData.satName = sat.props.name

            this.sats.listenData(sat, (data) => {
                this.nowSatelliteData.satData = data
            })
            this.nowSelectedSat = sat
        },
        trackedSatellite(sat) {
            this.viewer.trackedEntity = sat.components["Point"]
        },
        clearSatSelect() {
            this.showSatInfoFlag = false
            this.nowSelectedSat = undefined
        },

        // 选择地面站------------------------------------------------------
        selectGround(ground) {
            this.showGroundInfoFlag = true
            this.nowGroundData["satName"] = ground.name
            this.nowGroundData["satData"] = ground.position
            this.nowSelectedGround = ground
        },

        trackedGround(ground) {
            this.viewer.trackedEntity = ground.components["Groundstation"]
        },

        deTrackedGround() {
            this.viewer.trackedEntity = undefined
        },
        clearGroundSelect() {
            this.showGroundInfoFlag = false
            this.nowSelectedGround = undefined
        },

    },
    computed: {
        ...mapGetters({
            screenSize: 'getWindowSize',
        }),
        listenReachable() {
            const reachable1 = this.reachable1
            const reachable2 = this.reachable2
            return { reachable1, reachable2 }
        }
    },
    watch: {
        listenReachable(val) {
            console.log(val.reachable1, val.reachable2)
            if (val.reachable1 && val.reachable2) {
                console.log("showLink")

                this.showLink()
            } else {
                this.closeLink()
                console.log("closeLink")
            }
        }
    },
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

.top-box2 {
    position: absolute;
    top: 100px;
    /* width: 300px; */
    /* height: 300px; */

}

.top-box3 {
    position: absolute;
    top: 400px;
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
    z-index: 3;
    right: 10px;
    /* background-color: hsla(199, 100%, 49%, 0.342); */
}

#toolbarLeft {
    position: absolute;
    top: 5px;
    left: 2px;
}
</style>