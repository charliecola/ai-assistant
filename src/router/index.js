import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import AvatarTalk from '../views/AvatarTalk/AvatarTalk.vue'
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/AvatarTalk',
      name: 'AvatarTalk',
      component: AvatarTalk,
    }
  ],
})

export default router
