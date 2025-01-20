import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: () => import('@/layout/index.vue'),
      redirect: '/earth',
      children: [
        {
          path: 'earth',
          name: 'earth',
          component: () => import('@/views/Earth/index.vue')
        },
        {
          path: 'user',
          name: 'user',
          component: () => import('@/views/userManage/index.vue')
        },
        {
          path: 'privilege',
          name: 'privilege',
          component: () => import('@/views/privilegeManage/index.vue')
        },
      ]
    },
    {
      path: '/login',
      component: () => import('@/views/login/index.vue')
    },
  ]
})

router.beforeEach((to, from, next) => {
  console.log(router.currentRoute.value.fullPath)
  const isAuthenticated = localStorage.getItem("token")
  if (!isAuthenticated && to.path !== "/login") {
    next({
      path: '/login',
      query: {
        redirect: to.fullPath
      }
    })
    return
  }
  next()
})

export default router