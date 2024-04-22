import * as Cesium from "@cesium/engine"

import { CesiumComponentCollection } from "./utils/CesiumComponentCollection"
import { SatelliteProperties } from "./SatelliteProperties"

export class SatelliteComponentCollection extends CesiumComponentCollection {
    constructor(viewer, tle, tags) {
        super(viewer)
        // 卫星数据资源存放于props属性
        this.props = new SatelliteProperties(tle, tags)
        this.eventListeners = {}
        this.created = false

    }

    enableComponent(name) {
        if (!this.created) {
            this.init()
        }
        this.createComponent(name)
        super.enableComponent(name)
    }

    disableComponent(name) {
        super.disableComponent(name)
        this.deleteComponent(name)
    }


    deleteAllComponent() {
        this.disableComponent("Point")
        this.disableComponent("Orbit")
        this.disableComponent("3D model")
        this.disableComponent("Area")
    }


    // 添加卫星位置采样刷新的监听器
    init() {
        // this.createDescription()
        // 监听时间轴的变花
        this.eventListeners.sampledPosition = this.props.createSampledPosition(this.viewer, () => {
            this.updatedSampledPositionForComponents(true)
            console.log("采样更新...")
        })
        console.log("成功添加航天器位置自动采样器")
        this.created = true
    }

    // 更新Cesium实体的位置属性
    updatedSampledPositionForComponents(update = false) {
        const { fixed, inertial } = this.props.sampledPosition

        // this.components:继承于父类
        Object.entries(this.components).forEach(([type, component]) => {
            if (type === "Orbit") {
                component.position = inertial
                if (update && (component instanceof Cesium.Primitive || component instanceof Cesium.GeometryInstance)) {
                    // Primitives need to be recreated to update the geometry
                    this.disableComponent("Orbit")
                    this.enableComponent("Orbit")
                }
            } else if (type === "Area") {
                super.disableComponent("Area")
                this.createArea()

            } else {
                component.position = fixed
                component.orientation = new Cesium.VelocityOrientationProperty(fixed)
            }
        })
        // 时钟暂停时卫星位置更新后请求单帧
        if (!this.viewer.clock.shouldAnimate) {
            const removeCallback = this.viewer.clock.onTick.addEventListener(() => {
                this.viewer.scene.requestRender()
                removeCallback()
            })
        }
    }

    // 移除监听器
    deinit() {
        this.eventListeners.sampledPosition();
        this.created = false
    }


    createComponent(name) {
        switch (name) {
            case "Point":
                this.createPoint()
                break
            case "Orbit":
                this.createOrbit()
                break
            case "3D model":
                this.createModel()
                break
            case "Area":
                this.createArea()
                break
            default:
                console.error("Unknown component")
        }
    }

    deleteComponent(name) {
        this.deleteCesiumEntity(name)
    }


    createCesiumSatelliteEntity(entityName, entityKey, entityValue) {
        this.createCesiumEntity(entityName, entityKey, entityValue, this.props.name, this.description, this.props.sampledPosition.fixed, true)
    }
    // createDescription() {
    //     this.description = DescriptionHelper.cachedCallbackProperty((time) => {
    //         const cartographic = this.props.orbit.positionGeodetic(Cesium.JulianDate.toDate(time), true);
    //         const content = DescriptionHelper.renderDescription(time, this.props.name, cartographic, this.props.passes, false, this.props.orbit.tle);
    //         return content;
    //     });
    // }

    // 创建点
    createPoint() {
        const point = new Cesium.PointGraphics({
            pixelSize: 6,
            Color: Cesium.Color.WHITE,
            outlineColor: Cesium.Color.DIMGREY,
            outlineWidth: 1,
        })
        this.createCesiumSatelliteEntity("Point", "point", point)
    }

    // 创建轨迹
    createOrbit() {
        const path = new Cesium.PathGraphics({
            leadTime: (this.props.orbit.orbitalPeriod * 60) / 2 + 5,
            trailTime: (this.props.orbit.orbitalPeriod * 60) / 2 + 5,
            material: Cesium.Color.WHITE.withAlpha(0.15),
            resolution: 600,
            width: 2,
        })
        this.createCesiumEntity("Orbit", "path", path, this.props.name, this.description, this.props.sampledPosition.inertial, true)
    }

    // 创建模型
    createModel() {
        // const model = new Cesium.ModelGraphics({
        //     uri: `./data/models/${this.props.name.split(" ").join("-")}.glb`,
        //     minimumPixelSize: 50,
        //     maximumScale: 10000,
        // })
        // this.createCesiumSatelliteEntity("3D model", "model", model)
    }

    // 创建覆盖区域-------------------------------
    createArea() {
        // 创建圆形区域
        const entity = new Cesium.Entity(
            {
                position: new Cesium.CallbackProperty((time, result) => {
                    const sourpos = this.props.position(time);
                    const cartographic1 = Cesium.Cartographic.fromCartesian(sourpos);
                    const lon = Cesium.Math.toDegrees(cartographic1.longitude);
                    const lat = Cesium.Math.toDegrees(cartographic1.latitude);

                    return Cesium.Cartesian3.fromDegrees(lon, lat);
                }, false),
                ellipse: {
                    semiMinorAxis: 2600000.0, // 设置圆的半短轴长度
                    semiMajorAxis: 2600000.0, // 设置圆的半长轴长度
                    material: Cesium.Color.fromCssColorString('rgba(255, 0, 0, 0.5)'),
                },
            }
        )
        this.viewer.entities.add(entity);
        this.components["Area"] = entity
    }
}