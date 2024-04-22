import { SatelliteComponentCollection } from "./SatelliteComponentCollection"

export class SatelliteManger {
    constructor(viewer) {
        this.viewer = viewer
        this.satellites = []
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
        // sat.props.satnum === newSat.props.satnum &&
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

}