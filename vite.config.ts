import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { viteStaticCopy } from 'vite-plugin-static-copy'

/**
 * Cesium 静态资源(Workers/Assets/Widgets/ThirdParty)必须在构建时复制到可访问路径,
 * 并通过 CESIUM_BASE_URL 全局量告知引擎位置。
 * 这是无 ion token 方案的一部分:项目不依赖 Cesium ion 云服务。
 */
const cesiumBuild = 'node_modules/cesium/Build/Cesium'
const cesiumBaseUrl = 'cesium'

export default defineConfig({
  plugins: [
    vue(),
    viteStaticCopy({
      targets: [
        { src: `${cesiumBuild}/ThirdParty`, dest: cesiumBaseUrl },
        { src: `${cesiumBuild}/Workers`, dest: cesiumBaseUrl },
        { src: `${cesiumBuild}/Assets`, dest: cesiumBaseUrl },
        { src: `${cesiumBuild}/Widgets`, dest: cesiumBaseUrl },
      ],
    }),
  ],
  define: {
    CESIUM_BASE_URL: JSON.stringify(`/${cesiumBaseUrl}/`),
  },
  server: {
    port: 5188,
  },
  build: {
    chunkSizeWarningLimit: 4500,
    rollupOptions: {
      output: {
        // Cesium 独立分包:主应用 chunk 体积与引擎解耦,缓存友好(I-11)
        manualChunks: {
          cesium: ['cesium'],
          vue: ['vue', 'vue-router', 'pinia'],
        },
      },
    },
  },
})
