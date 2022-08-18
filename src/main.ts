import Vue from 'vue'
import { createPinia, PiniaVuePlugin } from 'pinia'

import App from './App.vue'
import router from './router'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'

import './assets/main.css'


import '@/views/map/fix-cesium-bug'
import "@/views/map/enhance-olmap"

Vue.use(PiniaVuePlugin)
Vue.use(ElementUI)

new Vue({
  router,
  pinia: createPinia(),
  render: (h) => h(App)
}).$mount('#app')
