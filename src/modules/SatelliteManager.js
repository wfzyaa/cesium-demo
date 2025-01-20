import { SatelliteComponentCollection } from "./SatelliteComponentCollection"
import { GroundStationEntity } from "./GroundStationEntity"
import * as Cesium from "@cesium/engine"

export class SatelliteManger {
    constructor(viewer) {
        this.viewer = viewer
        this.satellites = []
        this.links = []
        this.grounds = []
        this.path = []

        this.groundStations = []

        this.eventListeners = []
        this.GSLinks = {}
        this.originData = null
    }
    // 导入卫星数据部分-------------------------------------------
    // 从文件中添加卫星数据
    // 组件中调用时默认根目录为“public/data”
    async addFromTleUrl(url, tags, cb = null) {
        url = this.redirectTleUrl(url)
        try {
            const response = await fetch(url, {
                mode: "no-cors",
            });
            console.log("response.ok?", response.ok)
            if (!response.ok) {
                throw Error(response.statusText);
            }
            const response_1 = response;
            const data = await response_1.text();

            this.originData = data

            if (!data) {
                console.log("场景为空")
                this.satellites = []
                return
            }
            const lines = data.split(/\r?\n/);
            let n = 0
            for (let i = 0; i < lines.length; i + 3) {
                const tle = lines.splice(i, i + 3).join("\n");
                this.addFromTle(tle, tags);
                n++
            }


            console.log("成功读取" + n + "颗卫星的TLE数据，且均封装为SatelliteComponentCollection对象")
            console.log('satellites...', this.satellites)

            if (cb) {
                cb()
            }
        } catch (error) {
            console.error(error);
        }
    }


    redirectTleUrl(url) {
        if (url.startsWith('/public/data')) {
            return url
        } else {
            return '/public/data' + url
        }
    }

    // 从文件中读取卫星参数，并转为SatelliteComponentCollection类便于Cesium调用
    addFromTle(tle, tags) {
        const sat = new SatelliteComponentCollection(this.viewer, tle, tags)
        this.add(sat)
    }

    // 将新卫星数据添加至satellites数组中管理
    add(newSat) {
        const existingSat = this.satellites.find((sat) => sat.props.name === newSat.props.name)
        if (existingSat) {
            return
        }
        this.satellites.push(newSat)
    }

    // 删除所有卫星
    deleteAll() {
        if (this.satellites.length == 0) {
            return
        }
        this.satellites.forEach((sat) => {
            // 解除Cesium的渲染，删除对应Cesium资源
            sat.deleteAllComponent()
            // 移除监听器
            sat.deinit()
        })
        // 清空卫星列表
        this.satellites = []
    }


    // // 监听器资源分配部分-----------------------------------------
    // createMonitor() {
    //     this.satellites.forEach((sat) => {
    //         sat.init()
    //     })
    // }
    // deleteMonitor() {
    //     this.satellites.forEach((sat) => {
    //         sat.deinit()
    //     })
    // }


    // 视图控制部分--------------------------------------------
    // 开启卫星某一资源的视图渲染
    enableComponents(name) {
        this.satellites.forEach((sat) => {
            sat.enableComponent(name)
        })
    }

    // 关闭卫星某一资源的视图渲染
    disableComponents(name) {
        this.satellites.forEach((sat) => {
            sat.disableComponent(name)
        })
    }

    // 开启单个卫星某一资源的视图渲染
    enableSingle(satelliteName, name) {
        const existingSat = this.satellites.find((sat) => sat.props.name === satelliteName)
        if (existingSat) {
            existingSat.enableComponent(name)
        }
    }

    // 关闭单个卫星某一资源的视图渲染
    enableSingle(satelliteName, name) {
        const existingSat = this.satellites.find((sat) => sat.props.name === satelliteName)
        if (existingSat) {
            existingSat.disableComponent(name)
        }
    }

    // 地面站--------------------------------------
    setGroundStation(position, name) {
        if (!position) {
            return
        }
        const coordinates = {}
        coordinates.longitude = position.coords.longitude
        coordinates.latitude = position.coords.latitude
        coordinates.height = position.coords.altitude
        coordinates.cartesian = Cesium.Cartesian3.fromDegrees(coordinates.longitude, coordinates.latitude, coordinates.height)
        const groundStation = new GroundStationEntity(this.viewer, coordinates, name)
        this.groundStations.push(groundStation)
    }

    setGroundStationfromClick(event, name) {
        const cartesian = this.viewer.camera.pickEllipsoid(event.position);
        const didHitGlobe = Cesium.defined(cartesian);
        if (didHitGlobe) {
            const coordinates = {};
            const cartographicPosition = Cesium.Cartographic.fromCartesian(cartesian);
            coordinates.longitude = Cesium.Math.toDegrees(cartographicPosition.longitude);
            coordinates.latitude = Cesium.Math.toDegrees(cartographicPosition.latitude);
            coordinates.height = Cesium.Math.toDegrees(cartographicPosition.height);
            coordinates.cartesian = cartesian;
            console.log("position clicked...", coordinates)
            const groundStation = new GroundStationEntity(this.viewer, coordinates, name)
            this.groundStations.push(groundStation)
        }
    }

    // 星间通讯部分---------------------------------
    addLinkForAllSatellite() {
        const len = this.satellites.length
        if (len < 2) {
            return
        }
        for (let i = 0; i < len - 1; i++) {
            const p1 = this.satellites[i].components['Point'].position
            const p2 = this.satellites[i + 1].components['Point'].position
            this.addLink(p1, p2)
        }
        const p1 = this.satellites[0].components['Point'].position
        const p2 = this.satellites[len - 1].components['Point'].position
        this.addLink(p1, p2)
    }

    clearLinkForAllSatellite() {
        this.closeAllLink()
        this.links = []
    }

    addLink(p1, p2) {
        const entity = new Cesium.Entity(
            {
                polyline: {
                    positions: new Cesium.CallbackProperty((time, result) => {
                        var lon1, lat1, height1, lon2, lat2, height2
                        const sourpos = p1.getValue(time);
                        const cartographic1 = Cesium.Cartographic.fromCartesian(sourpos);
                        lon1 = Cesium.Math.toDegrees(cartographic1.longitude);
                        lat1 = Cesium.Math.toDegrees(cartographic1.latitude);
                        height1 = cartographic1.height;


                        const tarpos = p2.getValue(time);
                        const cartographic2 = Cesium.Cartographic.fromCartesian(tarpos);
                        lon2 = Cesium.Math.toDegrees(cartographic2.longitude);
                        lat2 = Cesium.Math.toDegrees(cartographic2.latitude);
                        height2 = cartographic2.height;


                        return Cesium.Cartesian3.fromDegreesArrayHeights([lon1, lat1, height1, lon2, lat2, height2]);
                    }, false),
                    width: 2,
                    // 设置直线为不符合椭球表面的直线
                    arcType: Cesium.ArcType.NONE,
                    material: Cesium.Color.GREEN,
                }
            })
        this.links.push(entity)
    }

    showAllLink() {
        this.links.forEach((link) => {
            this.viewer.entities.add(link)
        })
    }

    closeAllLink() {
        if (this.links.length == 0) {
            return
        }
        this.links.forEach((link) => {
            this.viewer.entities.remove(link)
        })
    }

    // 根据卫星对象建立最短路径
    showLinkPath(sat1, sat2) {
        if (this.path.length > 0) {
            return
        }
        if (sat1 === sat2) {
            // 处理通讯由多个卫星突然转为一个卫星的情况
            this.closeLinkPath()
            return
        }
        this.path = this.shortestPath(sat1, sat2)
        this.path.forEach((side) => {
            this.viewer.entities.add(side)
        })
    }

    closeLinkPath() {
        this.path.forEach((side) => {
            this.viewer.entities.remove(side)
        })
        this.path = []
    }

    shortestPath(sat1, sat2) {
        let result = []
        if (sat1 !== sat2) {
            let start = this.satellites.indexOf(sat1)
            let end = this.satellites.indexOf(sat2)
            if (start > end) {
                let t = start
                start = end
                end = t
            }

            console.log("start:", start, ",end:", end)

            for (let i = start; i < end; i++) {
                result.push(this.links[i])
            }
            // 判断最短路径是哪个旋转方向
            if (parseFloat(end - start) <= parseFloat(this.links.length / 2)) {
                return result
            } else {
                return this.links.filter(link => result.indexOf(link) < 0)
            }
        }
        return result
    }
    // 星地通讯部分-------------------------------------
    getDistance(ground, sat) {
        const p1 = ground.position.cartesian
        const p2 = sat.components['Point'].position.getValue(this.viewer.clock.currentTime)
        const distance = Cesium.Cartesian3.distance(p1, p2)
        return distance
    }

    isReachable(ground, sat) {
        return this.getDistance(ground, sat) <= sat.props.getMaxLinkDistance(this.viewer.clock.currentTime)
    }

    getAllDistance(ground, cb = null) {
        const list = []
        this.satellites.forEach((sat) => {
            const dict = {
                star: sat,
                distance: this.getDistance(ground, sat),
                reachable: this.isReachable(ground, sat)
            }
            list.push(dict)
        })

        if (cb) {
            cb(list.sort((a, b) => {
                return a.distance - b.distance
            }))
        }
    }

    wrappedGetAllDistance(ground, cb) {
        return () => {
            this.getAllDistance(ground, cb)
        }
    }

    listenDistance(ground, cb) {
        const event = this.wrappedGetAllDistance(ground, cb)
        this.viewer.clock.onTick.addEventListener(event)
        this.eventListeners.push(event)
    }

    deListenDistance() {
        this.eventListeners.forEach((l) => {
            this.viewer.clock.onTick.removeEventListener(l)
        })
        this.eventListeners = []
    }

    // 建立星地线路
    linkGroundStar(ground, sat) {
        const name = ground.name + sat.props.name
        if (this.GSLinks[name]) {
            return
        }

        const p1 = ground.position
        const p2 = sat.components['Point'].position

        const entity = new Cesium.Entity({
            polyline: {
                positions: new Cesium.CallbackProperty((time, result) => {
                    var lon1, lat1, height1, lon2, lat2, height2
                    lon1 = p1.longitude
                    lat1 = p1.latitude
                    height1 = 0

                    const tarpos = p2.getValue(time);
                    const cartographic2 = Cesium.Cartographic.fromCartesian(tarpos);
                    lon2 = Cesium.Math.toDegrees(cartographic2.longitude);
                    lat2 = Cesium.Math.toDegrees(cartographic2.latitude);
                    height2 = cartographic2.height;

                    return Cesium.Cartesian3.fromDegreesArrayHeights([lon1, lat1, height1, lon2, lat2, height2]);
                }, false),
                width: 2,
                // 设置直线为不符合椭球表面的直线
                arcType: Cesium.ArcType.NONE,
                material: Cesium.Color.GREEN,
            }
        })
        this.viewer.entities.add(entity)
        // 卫星名作为星地链路的索引
        this.GSLinks[name] = entity
    }

    // 删除指定星地链路
    deLinkGroundStar(ground, sat) {
        if (ground && sat) {
            const name = ground.name + sat.props.name
            if (!(name in this.GSLinks)) {
                return
            }
            this.viewer.entities.remove(this.GSLinks[name])
            delete this.GSLinks[name]
        }
    }

    // 数据展示部分-----------------------------------------------------------
    // 添加数据监听器
    listenData(sat, cb) {
        sat.listenData(cb)
    }

    deListenData(sat) {
        sat.deListenData()
    }

}