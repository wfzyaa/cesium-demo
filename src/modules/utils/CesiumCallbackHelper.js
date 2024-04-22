import * as Cesium from "cesium";

export class CesiumCallbackHelper {

    /**
     * Register an event listener that will execute a callback every refreshRate seconds of clock time.
     * @param {Cesium.Viewer} viewer - Cesium viewer
     * @param {Function} callback - function to execute
     * @param {Number} refreshRate - in seconds
     * @param {Cesium.Event} event - event to listen to (e.g. viewer.clock.onTick)
     * @returns {Function} - function to remove the event listener
     */
    static createPeriodicTimeCallback(viewer, refreshRate, callback, event = viewer.clock.onTick) {
        //  记录上一次触发刷新周期的时间
        let lastUpdated = viewer.clock.currentTime;
        // 回调函数，时间轴改变时触发
        return event.addEventListener(() => {
            // 当前时间
            const time = viewer.clock.currentTime;
            // 判断经过的时间是否到达刷新周期
            const delta = Math.abs(Cesium.JulianDate.secondsDifference(time, lastUpdated));
            if (delta < refreshRate) {
                return;
            }
            // 如果到达刷新周期则执行回调
            callback(time);
            lastUpdated = time;
        });
    }
}
