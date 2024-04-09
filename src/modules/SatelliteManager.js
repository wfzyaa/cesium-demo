import { SatelliteComponentCollection } from "./SatelliteComponentCollection"

export class SatelliteManger {
    constructor(viewer) {
        this.viewer = viewer
        this.satellites = []
    }
    // 导入卫星数据部分-------------------------------------------
    // 从文件中添加卫星数据
    // 组件中调用时默认根目录为“public/data”
    async addFromTleUrl(url, tags, updateStore, cb = null) {
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
            for (let i = 0; i < lines.length; i + 3) {
                const tle = lines.splice(i, i + 3).join("\n");
                this.addFromTle(tle, tags, updateStore);
            }
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
    addFromTle(tle, tags, updateStore = true) {
        console.log("input tle...", tle)
        const sat = new SatelliteComponentCollection(this.viewer, tle, tags)
        this.add(sat)
        if (updateStore) {
            this.updateStore()
        }
    }

    // 将新卫星数据添加至satellites数组中管理
    add(newSat) {
        // sat.props.satnum === newSat.props.satnum &&
        const existingSat = this.satellites.find((sat) => sat.props.name === newSat.props.name)
        if (existingSat) {
            console.log('existingSat...', true)
            // existingSat.props.addTags(newSat.props.tags)
            return
        }
        this.satellites.push(newSat)
        console.log('satellites...', this.satellites)
    }

    // 视图控制部分--------------------------------------------
    // 开启卫星某一资源的视图渲染
    enableComponents(name) {
        this.satellites.forEach((sat) => {
            sat.enableComponent(name)
        })
    }

    updateStore() {
        console.log('updateStore...')
        // const satStore = useSatStore()
        // satStore.availableTags = this.tags
        // satStore.availableSatellitesByTag = this.taplist
    }
}