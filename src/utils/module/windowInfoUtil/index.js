import decoratorMap from '../../service/utilDecorator'
import cbMap from './listenerCb'

// 获取窗口size
const getwindowSize = function () {
    return {
        width: window.innerWidth,
        height: window.innerHeight
    }
}

// 设置后自动监听窗口的变化,通过防抖的装饰,将值存到store,
const setWindowSizeListener = function () {
    window.addEventListener('resize', decoratorMap.debounce(cbMap.storeWindowSize, 200))
}

const windowInfoUtilMap = {
    // 获取窗口宽高
    getwindowSize: getwindowSize,
    // 设置窗口size监听器
    setWindowSizeListener: setWindowSizeListener,
}

export default windowInfoUtilMap