import * as Cesium from "@cesium/engine"
import dayjs from "dayjs"
import { CesiumComponentCollection } from "./utils/CesiumComponentCollection"

import icon from "@/images/icons/dish.svg"

export class GroundStationEntity extends CesiumComponentCollection {
    constructor(viewer, position, name = "GroundStation") {
        super(viewer)

        this.name = name
        this.position = position
        console.log("position",this.position)

        this.createEntities()
    }

    createEntities() {
        // this.createDescription()
        this.createGroundStation()
    }

    createGroundStation() {
        const billboard = new Cesium.BillboardGraphics({
            image: icon,
            horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            scaleByDistance: new Cesium.NearFarScalar(1e2, 0.2, 4e7, 0.1),
        })
        this.createCesiumEntity("Groundstation", "billboard", billboard, this.name, this.description, this.position.cartesian, false)
        super.enableComponent("Groundstation")
        console.log("loadstation...")
    }
}