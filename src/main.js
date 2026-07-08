import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import axios from 'axios'

axios.defaults.baseURL = 'http://192.168.100.173:8000'

// Restore MAO token
const maoToken = localStorage.getItem('mao_token')
if (maoToken) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${maoToken}`
}

// Restore barangay token
const barangayToken = localStorage.getItem('barangay_token')
if (barangayToken && !maoToken) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${barangayToken}`
}

createApp(App)
  .use(router)
  .mount('#app')