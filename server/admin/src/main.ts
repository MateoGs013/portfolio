import { createApp } from 'vue'
import App from './App.vue'
import { router } from './router'
import './styles/admin.css'

// Se monta con la primera ruta resuelta (sesión incluida): ni el shell ni el ingreso aparecen de más.
const app = createApp(App).use(router)
void router.isReady().then(() => app.mount('#app'))
