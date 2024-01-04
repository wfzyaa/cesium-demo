const decoratorMap = {
    // 防抖
    debounce: function (cb, delay) {
        let timer
        return function () {
            // 清除上一次的计时器
            clearTimeout(timer)
            // 从新计时
            timer = setTimeout(() => {
                cb()
            }, delay)
        }
    }
}
export default decoratorMap