 import Vue from 'vue'
 import App from './index.vue'

 import ElementUI from 'element-ui'
 import '../../../node_modules/element-ui/lib/theme-chalk/index.css'
 /*  import {
    Dialog,
    Tabs,
    Button,
    TabPane,
    Pagination
  } from 'element-ui'

  Vue.use(Dialog)
  Vue.use(Tabs)
  Vue.use(Button)
  Vue.use(TabPane)
  Vue.use(Pagination) */


 let test = {}
 test.el = document.createElement('div')
 test.el.id = "app"
 test.getdom = function (data) {

   Vue.use(ElementUI)
   let vuedom = new Vue({
     render: h => h(App, {
       props: {
         view: '1'
       }
     })
   }).$mount()
   /* 
      let vuedom = Vue.extend(App)
      let test = new vuedom({
        propsData: {
          view: "1"
        }
      }).$mount() */
   console.log("111111111")
   return vuedom.$el
 }

 export {
   test
 }