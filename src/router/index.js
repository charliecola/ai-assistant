import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import AvatarTalk from '../views/AvatarTalk/AvatarTalk.vue'
const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/avatar-talk',
      name: 'AvatarTalk',
      component: AvatarTalk,
    }
  ],
})

export default router
