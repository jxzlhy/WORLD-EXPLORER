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
    {
      path: '/stats',
      name: 'data-coverage',
      // 数据质量监控(V5.0 雏形):只读统计面板,懒加载不影响主体验
      component: () => import('../views/DataCoverageView.vue'),
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

export default router
