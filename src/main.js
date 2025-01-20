import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import store from './store'
import { Tooltip } from "@oruga-ui/oruga-next"


// 全局引入图标
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

const app = createApp(App)
// 全局注册所有的图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component)
}
app.use(store)
app.use(Tooltip)

app.mount('#app')
