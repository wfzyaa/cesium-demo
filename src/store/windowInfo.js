const windowInfo = {
    state: {
        windowSize: {
            width: 0,
            height: 0,
        },
    },
    getters: {
        getWindowSize(state) {
            return state.windowSize
        },
    },
    mutations: {
        setWindowSize(state, value) {
            state.windowSize = value
        },
    },
    actions: {
        setWindowSize({ commit }, value) {
            commit('setWindowSize', value)
        },
    }
}

export default windowInfo