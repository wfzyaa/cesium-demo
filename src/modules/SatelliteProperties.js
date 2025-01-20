import * as Cesium from "@cesium/engine"
import Orbit from "./Orbit"
import { CesiumCallbackHelper } from "./utils/CesiumCallbackHelper";

export class SatelliteProperties {
    constructor(tle, tags = [], angle) {
        // 读取卫星名
        this.name = tle.split("\n")[0].trim()
        if (tle.startsWith("0 ")) {
            this.name = this.name.substring(2);
        }
        // 卫星轨道要素
        this.orbit = new Orbit(this.name, tle)
        this.satnum = this.orbit.satnum
        this.tags = tags
        // 信号扩散角度
        this.angle = angle
        this.tanValue = Math.tan(angle * Math.PI / 180)


        // this.groundStationPosition = undefined
        // this.passes = []
        // this.passInterval = undefined
        // this.passIntervals = new Cesium.TimeIntervalCollection()
    }

    // 设置卫星方位采样，将采样结果存放于
    /**
     * 惯性系(x,y,z)：this.sampledPosition.inertial
     * 固定系(经,纬,高)：this.sampledPosition.fixed
     * 采样时间段：this.sampledPosition.interval
     */
    createSampledPosition(viewer, callback) {
        this.updateSampledPosition(viewer.clock.currentTime)
        callback(this.sampledPosition)

        // 设置采样刷新间隔为1/4个轨道周期
        const samplingRefreshRate = (this.orbit.orbitalPeriod * 60) / 4

        // 创建一个触发器，按时间轴间隔触发
        const removeCallback = CesiumCallbackHelper.createPeriodicTimeCallback(viewer, samplingRefreshRate, (time) => {
            this.updateSampledPosition(time)
            callback(this.sampledPosition)
        });
        return () => {
            removeCallback()
            this.sampledPosition = undefined
        }
    }

    // 更新采样点
    updateSampledPosition(time) {
        // Determine sampling interval based on sampled positions per orbit and orbital period
        // 120 samples per orbit seems to be a good compromise between performance and accuracy
        // 采样间隔
        const samplingPointsPerOrbit = 120
        const orbitalPeriod = this.orbit.orbitalPeriod * 60
        
        // 采样间隔
        const samplingInterval = orbitalPeriod / samplingPointsPerOrbit

        // Always keep half an orbit backwards and 1.5 full orbits forward in the sampled position
        const request = new Cesium.TimeInterval({
            start: Cesium.JulianDate.addSeconds(time, -orbitalPeriod / 2, new Cesium.JulianDate()),
            stop: Cesium.JulianDate.addSeconds(time, orbitalPeriod * 1.5, new Cesium.JulianDate()),
        })

        // (Re)create sampled position if it does not exist or if it does not contain the current time
        // 如果当前时间超出了时间范围，则初始化一个新的时间段
        if (!this.sampledPosition || !Cesium.TimeInterval.contains(this.sampledPosition.interval, time)) {
            this.initSampledPosition(request.start)
        }

        // Determine which parts of the requested interval are missing
        // 时间交集
        const intersect = Cesium.TimeInterval.intersect(this.sampledPosition.interval, request)
        // 交集后的时间差
        const missingSecondsEnd = Cesium.JulianDate.secondsDifference(request.stop, intersect.stop)
        // 交集前的时间差
        const missingSecondsStart = Cesium.JulianDate.secondsDifference(intersect.start, request.start)
        // console.log(`updateSampledPosition ${this.name}`,
        //   `Missing ${missingSecondsStart.toFixed(2)}s ${missingSecondsEnd.toFixed(2)}s`,
        //   `Request ${Cesium.TimeInterval.toIso8601(request, 0)}`,
        //   `Current ${Cesium.TimeInterval.toIso8601(this.sampledPosition.interval, 0)}`,
        //   `Intersect ${Cesium.TimeInterval.toIso8601(intersect, 0)}`,
        // );

        //request在sampledPosition之前，向前补齐时间段 
        if (missingSecondsStart > 0) {
            const samplingStart = Cesium.JulianDate.addSeconds(intersect.start, -missingSecondsStart, new Cesium.JulianDate())
            const samplingStop = this.sampledPosition.interval.start
            this.addSamples(samplingStart, samplingStop, samplingInterval)
        }

        //request在sampledPosition之后，向后补齐时间段 
        if (missingSecondsEnd > 0) {
            const samplingStart = this.sampledPosition.interval.stop
            const samplingStop = Cesium.JulianDate.addSeconds(intersect.stop, missingSecondsEnd, new Cesium.JulianDate())
            this.addSamples(samplingStart, samplingStop, samplingInterval)
        }

        // Remove no longer needed samples
        const removeBefore = new Cesium.TimeInterval({
            start: Cesium.JulianDate.fromIso8601("1957"),
            stop: request.start,
            isStartIncluded: false,
            isStopIncluded: false,
        })
        const removeAfter = new Cesium.TimeInterval({
            start: request.stop,
            stop: Cesium.JulianDate.fromIso8601("2100"),
            isStartIncluded: false,
            isStopIncluded: false,
        })
        this.sampledPosition.fixed.removeSamples(removeBefore)
        this.sampledPosition.inertial.removeSamples(removeBefore)
        this.sampledPosition.fixed.removeSamples(removeAfter)
        this.sampledPosition.inertial.removeSamples(removeAfter)

        this.sampledPosition.interval = request
    }

    // 添加采样点
    addSamples(start, stop, samplingInterval) {
        const times = []
        const positionsFixed = []
        const positionsInertial = []
        for (let time = start; Cesium.JulianDate.compare(stop, time) >= 0; time = Cesium.JulianDate.addSeconds(time, samplingInterval, new Cesium.JulianDate())) {
            const { positionFixed, positionInertial } = this.computePosition(time)
            times.push(time)
            positionsFixed.push(positionFixed)
            positionsInertial.push(positionInertial)
        }
        // Add all samples at once as adding a sorted array avoids searching for the correct position every time
        this.sampledPosition.fixed.addSamples(times, positionsFixed)
        this.sampledPosition.inertial.addSamples(times, positionsInertial)
    }

    // 根据时间戳获取卫星方位
    computePosition(timestamp) {
        const positionInertialTEME = this.computePositionInertialTEME(timestamp)
        const temeToFixed = Cesium.Transforms.computeTemeToPseudoFixedMatrix(timestamp)
        if (!Cesium.defined(temeToFixed)) {
            console.error("Reference frame transformation data failed to load")
        }
        const positionFixed = Cesium.Matrix3.multiplyByVector(temeToFixed, positionInertialTEME, new Cesium.Cartesian3())

        const fixedToIcrf = Cesium.Transforms.computeFixedToIcrfMatrix(timestamp)
        if (!Cesium.defined(fixedToIcrf)) {
            console.error("Reference frame transformation data failed to load")
        }
        const positionInertialICRF = Cesium.Matrix3.multiplyByVector(fixedToIcrf, positionFixed, new Cesium.Cartesian3())

        return { positionFixed, positionInertial: positionInertialICRF }
    }

    computePositionInertialTEME(time) {
        const eci = this.orbit.positionECI(Cesium.JulianDate.toDate(time))
        if (this.orbit.error) {
            this.sampledPosition.valid = false
            return Cesium.Cartesian3.ZERO
        }
        return new Cesium.Cartesian3(eci.x * 1000, eci.y * 1000, eci.z * 1000)
    }

    initSampledPosition(currentTime) {
        this.sampledPosition = {}
        // 设置时间区间
        this.sampledPosition.interval = new Cesium.TimeInterval({
            start: currentTime,
            stop: currentTime,
            // 是否包含开始时间
            isStartIncluded: false,
            // 是否包含结束时间
            isStopIncluded: false,
        })

        // 存储相对于固定参考框架的卫星位置
        this.sampledPosition.fixed = new Cesium.SampledPositionProperty()
        this.sampledPosition.fixed.backwardExtrapolationType = Cesium.ExtrapolationType.HOLD
        this.sampledPosition.fixed.forwardExtrapolationType = Cesium.ExtrapolationType.HOLD
        this.sampledPosition.fixed.setInterpolationOptions({
            interpolationDegree: 5,
            interpolationAlgorithm: Cesium.LagrangePolynomialApproximation,
        })

        // 存储相对于惯性参考框架的卫星位置
        this.sampledPosition.inertial = new Cesium.SampledPositionProperty(Cesium.ReferenceFrame.INERTIAL)
        this.sampledPosition.inertial.backwardExtrapolationType = Cesium.ExtrapolationType.HOLD
        this.sampledPosition.inertial.forwardExtrapolationType = Cesium.ExtrapolationType.HOLD
        this.sampledPosition.inertial.setInterpolationOptions({
            interpolationDegree: 5,
            interpolationAlgorithm: Cesium.LagrangePolynomialApproximation,
        })
        // 标记初始化成功
        this.sampledPosition.valid = true
    }

    hasTag(tag) {
        return this.tags.includes(tag)
    }

    position(time) {
        return this.sampledPosition.fixed.getValue(time);
    }

    getLongitude(time) {
        const ellipsoid = Cesium.Ellipsoid.WGS84
        const cartographic = ellipsoid.cartesianToCartographic(this.position(time))
        return Cesium.Math.toDegrees(cartographic.longitude)
    }

    getLatitude(time) {
        const ellipsoid = Cesium.Ellipsoid.WGS84
        const cartographic = ellipsoid.cartesianToCartographic(this.position(time))
        return Cesium.Math.toDegrees(cartographic.latitude)
    }

    getHeight(time) {
        const ellipsoid = Cesium.Ellipsoid.WGS84
        const cartographic = ellipsoid.cartesianToCartographic(this.position(time))
        return cartographic.height
    }

    getMaxLinkDistance(time) {
        return 9677085
    }


}