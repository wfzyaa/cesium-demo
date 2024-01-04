import { createStore } from 'vuex'

import windowInfo from './windowInfo.js'

const store = createStore({
    strict: true,
    modules: {
        windowInfo,
    }
})

export default store