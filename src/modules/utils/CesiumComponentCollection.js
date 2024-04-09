import * as Cesium from '@cesium/engine'

// Cesium实体基类
export class CesiumComponentCollection {
    components = {}
    static geometries = []
    static primitive = undefined

    constructor(viewer, lazy = true) {
        this.viewer = viewer
        this.lazy = lazy
    }

    get isSelected() {
        return Object.values(this.components).some((entity) => this.viewer.selectedEntity === entity)
    }

    get isTracked() {
        return Object.values(this.components).some((entity) => this.viewer.trackedEntity === entity)
    }

    // 创建Cesium实体，并添加到字典中
    createCesiumEntity(componentName, entityKey, entityValue, name, description, position, moving) {
        const entity = new Cesium.Entity({
            name,
            description,
            position,
            viewFrom: new Cesium.Cartesian3(0, -3600000, 4200000),
        })
        if (moving) {
            entity.orientation = new Cesium.VelocityOrientationProperty(position);
        }

        entity[entityKey] = entityValue;
        this.components[componentName] = entity;
        console.log("THISCOMPONENTS...",this.components)
    }

    get components() {
        return this.components
    }

    // 在页面中显示实体
    show(componentNames = this.componentNames) {
        componentNames.forEach((componentName) => {
            this.enableComponent(componentName);
        });
    }

    // 在页面中隐藏
    hide(componentNames = this.componentNames) {
        componentNames.forEach((componentName) => {
            this.disableComponent(componentName);
        });
    }

    enableComponent(name) {
        if (!(name in this.components)) {
            return
        }
        const component = this.components[name];
        // 向Cesium中注册Component(实体、基元、几何)
        if (component instanceof Cesium.Entity && !this.viewer.entities.contains(component)) {
            this.viewer.entities.add(component);
        } else if (component instanceof Cesium.Primitive && !this.viewer.scene.primitives.contains(component)) {
            this.viewer.scene.primitives.add(component);
        } else if (component instanceof Cesium.GeometryInstance) {
            // 向静态属性geometries添加component
            this.constructor.geometries.push(component);
            this.recreateGeometryInstancePrimitive();
        }
        if (!this.defaultEntity) {
            this.defaultEntity = component;
        }
    }


    disableComponent(name) {
        if (!(name in this.components)) {
            return
        }
        const component = this.components[name];
        if (component instanceof Cesium.Entity) {
            this.viewer.entities.remove(component);
        } else if (component instanceof Cesium.Primitive) {
            this.viewer.scene.primitives.remove(component);
        } else if (component instanceof Cesium.GeometryInstance) {
            this.constructor.geometries = this.constructor.geometries.filter((geometry) => geometry !== component);
            this.recreateGeometryInstancePrimitive();
        }

        if (this.lazy) {
            delete this.components[name];
        }

    }

    recreateGeometryInstancePrimitive() {
        if (this.constructor.primitivePendingUpdate) {
            return
        }
        this.constructor.primitivePendingUpdate = true
        const removeCallback = CesiumCallbackHelper.createPeriodicTickCallback(this.viewer, 30, () => {
            if (this.constructor.primitivePendingCreation) {
                return
            }
            this.constructor.primitivePendingUpdate = false
            if (this.constructor.geometries.length === 0) {
                this.viewer.scene.primitives.remove(this.constructor.primitive)
                this.constructor.primitive = undefined
                this.viewer.scene.requestRender()
                return
            }
            this.constructor.primitivePendingCreation = true
            const primitive = new Cesium.Primitive({
                geometryInstances: this.constructor.geometries,
                appearance: new Cesium.PolylineColorAppearance(),
            })
            // Force asyncrounous primitve creation before adding to scene
            let lastState = -1
            const readyCallback = this.viewer.clock.onTick.addEventListener(() => {
                if (!primitive.ready) {
                    // eslint-disable-next-line no-underscore-dangle
                    const state = primitive._state
                    if (state !== lastState) {
                        lastState = state
                        // Trigger primitive update to progress through creation states
                        primitive.update(this.viewer.scene.frameState)
                        return
                    }
                    return
                }
                // Update model matrix right before adding to scene
                const icrfToFixed = Cesium.Transforms.computeIcrfToFixedMatrix(this.viewer.clock.currentTime)
                if (Cesium.defined(icrfToFixed)) {
                    primitive.modelMatrix = Cesium.Matrix4.fromRotationTranslation(icrfToFixed)
                }
                if (this.constructor.primitive) {
                    this.viewer.scene.primitives.remove(this.constructor.primitive)
                }
                this.viewer.scene.primitives.add(primitive)
                this.constructor.primitive = primitive
                this.viewer.scene.requestRender()
                this.constructor.primitivePendingCreation = false
                readyCallback()
            })
            removeCallback()
        })
    }
}