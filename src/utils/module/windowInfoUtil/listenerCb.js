import store from '../../../store'
import wdInfoMap from '.'

const storeWindowSize = function () {
    console.log("windowSize...", wdInfoMap.getwindowSize())
    // console.log("check store...",store)
    store.dispatch('setWindowSize', wdInfoMap.getwindowSize())
    // console.log("getter...", store.getters['getWindowSize'])
}

const cbMap = {
    storeWindowSize: storeWindowSize
}

export default cbMap