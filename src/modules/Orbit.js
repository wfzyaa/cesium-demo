import * as satellitejs from "satellite.js"
import dayjs from "dayjs"

const deg2rad = Math.PI / 180
const rad2deg = 180 / Math.PI

export default class Orbit {
    constructor(name, tle) {
        this.name = name
        this.tle = tle.split("\n")
        // 解析tle格式，返回卫星运动参数
        this.satrec = satellitejs.twoline2satrec(this.tle[1], this.tle[2])
    }

    // 返回卫星编号
    get satnum() {
        return this.satrec.satnum
    }

    // 返回卫星误差
    get error() {
        return this.satrec.error
    }

    // 返回运动周期
    get orbitalPeriod() {
        // 获取卫星平均运动角速度
        const meanMotionRad = this.satrec.no
        const period = (2 * Math.PI) / meanMotionRad
        return period
    }

    // 返回卫星某时刻的惯性坐标系(x,y,z)
    positionECI(time) {
        // 返回卫星在某时刻在ECI坐标系中的位置和速度（星历数据）
        return satellitejs.propagate(this.satrec, time).position
    }

    // 返回卫星某时刻的地心固定系(经纬高)
    positionECF(time) {
        const positionEci = this.positionECI(time)
        const gmst = satellitejs.gstime(time)
        // 将卫星在惯性坐标系（ECI）中的位置转换为地心固定坐标系（ECF）中的位置
        const positionEcf = satellitejs.eciToEcf(positionEci, gmst)
        return positionEcf
    }

    // 返回卫星某时刻的经纬高[速度]
    positionGeodetic(timestamp, calculateVelocity = false) {
        const { position: positionEci, velocity: velocityVector } = satellitejs.propagate(this.satrec, timestamp)
        const gmst = satellitejs.gstime(timestamp)
        const positionGd = satellitejs.eciToGeodetic(positionEci, gmst)

        return {
            // 经度
            longitude: positionGd.longitude * rad2deg,
            // 纬度
            latitude: positionGd.latitude * rad2deg,
            // 高度
            height: positionGd.height * 1000,
            // 速度
            ...(calculateVelocity && {
                velocity: Math.sqrt(velocityVector.x * velocityVector.x +
                    velocityVector.y * velocityVector.y +
                    velocityVector.z * velocityVector.z),
            }),
        }
    }
}