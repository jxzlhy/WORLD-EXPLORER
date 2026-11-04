import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'explore',
      // 主体验:地球 + 探索 UI。懒加载会拖慢首屏,故静态导入
      component: () => import('../views/ExploreView.vue'),
    },
    {
      path: '/design',
      name: 'design-lab',
      component: () => import('../views/DesignLabView.vue'),
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

export default router
