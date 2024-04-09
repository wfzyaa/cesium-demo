import * as Cesium from "@cesium/engine"

import { CesiumComponentCollection } from "./utils/CesiumComponentCollection"
import { SatelliteProperties } from "./SatelliteProperties"

export class SatelliteComponentCollection extends CesiumComponentCollection {
    constructor(viewer, tle, tags) {
        super(viewer)
        // 卫星数据资源存放于props属性
        this.props = new SatelliteProperties(tle, tags)
        this.eventListeners = {}

    }

    enableComponent(name) {
        if (!this.created) {
            this.init()
        }
        console.log('渲染卫星实例中...')
        this.createComponent(name)
        super.enableComponent(name)
    }

    // 初始化一次
    init() {
        // this.createDescription()
        // 监听时间轴的变花
        this.eventListeners.sampledPosition = this.props.createSampledPosition(this.viewer, () => {
            this.updatedSampledPositionForComponents(true)
            console.warn("inited...!!!")
        })
    }

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
            } else if (type === "Sensor cone") {
                component.position = fixed
                component.orientation = new Cesium.CallbackProperty((time) => {
                    const position = this.props.position(time)
                    const hpr = new Cesium.HeadingPitchRoll(0, Cesium.Math.toRadians(180), 0)
                    return Cesium.Transforms.headingPitchRollQuaternion(position, hpr)
                }, false)
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
            default:
                console.error("Unknown component")
        }
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
        this.createOrbitPath()
        return
        // 以下是用于提升性能的方法
        if (this.isTracked) {
            // Use a path graphic to visualize the currently tracked satellite's orbit
            this.createOrbitPath();
        } else {
            // For all other satellites use a polyline geometry to visualize the orbit for significantly improved performance.
            // A polyline geometry is used instead of a polyline graphic as entities don't support adjusting the model matrix
            // in order to display the orbit in the inertial frame.
            this.createOrbitPolylineGeometry();
        }
    }

    createOrbitPath() {
        const path = new Cesium.PathGraphics({
            leadTime: (this.props.orbit.orbitalPeriod * 60) / 2 + 5,
            trailTime: (this.props.orbit.orbitalPeriod * 60) / 2 + 5,
            material: Cesium.Color.WHITE.withAlpha(0.15),
            resolution: 600,
            width: 2,
        })
        this.createCesiumEntity("Orbit", "path", path, this.props.name, this.description, this.props.sampledPosition.inertial, true)
    }

    createOrbitPolylineGeometry() {
        // Currently unused
        const geometryInstance = new Cesium.GeometryInstance({
            geometry: new Cesium.PolylineGeometry({
                positions: this.props.getSampledInertialPositionsForNextOrbit(this.viewer.clock.currentTime),
                width: 2,
                arcType: Cesium.ArcType.NONE,
                // granularity: Cesium.Math.RADIANS_PER_DEGREE * 10,
                vertexFormat: Cesium.PolylineColorAppearance.VERTEX_FORMAT,
            }),
            attributes: {
                color: Cesium.ColorGeometryInstanceAttribute.fromColor(new Cesium.Color(1.0, 1.0, 1.0, 0.15)),
            },
            id: this.props.name,
        })
        this.components.Orbit = geometryInstance
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

    createCesiumSatelliteEntity(entityName, entityKey, entityValue) {
        this.createCesiumEntity(entityName, entityKey, entityValue, this.props.name, this.description, this.props.sampledPosition.fixed, true)
    }
}