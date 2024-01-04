import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: () => import('@/views/Earth/index.vue')
    },
    {
      path: '/earth',
      name: 'earth',
      component: () => import('@/views/Earth/index.vue')
    },
    {
      path: '/user',
      name: 'user',
      component: () => import('@/views/userManage/index.vue')
    },
    {
      path: '/privilege',
      name: 'privilege',
      component: () => import('@/views/privilegeManage/index.vue')
    },
  ]
})

export default router