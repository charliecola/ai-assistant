import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import AvatarTalk from '../views/AvatarTalk/AvatarTalk.vue'

import formDesign from './../components/form-design/index.vue'
import formRander from './../components/form-rander/index.vue'

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
    },
    {
      path: '/from-design',
      name: 'fromDesign',
      component: formDesign,
    },
    {
      path: '/form-rander',
      name: 'formRander',
      component: formRander,
    }
  ],
})

export default router
