import { defineConfig } from "vite";
import uni from "@dcloudio/vite-plugin-uni";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [uni()],
  base: './',
  css: {
    preprocessorOptions: {
      scss: {
        // 抑制 Sass 废弃警告
        silenceDeprecations: ['legacy-js-api', 'import'],
        // 全局注入 TDesign SCSS 变量，所有 .vue 文件无需手动 @import
        additionalData: `@import "@/styles/tdesign-vars.scss";`,
      }
    }
  },
  // optimizeDeps: {
  //   exclude: ['@cloudbase/adapter-uni-app'],  // 排除 @cloudbase/adapter-uni-app 依赖
  // },
  server: {
    host: '0.0.0.0',  // 使用IP地址代替localhost
    proxy: {
      '/__auth': {
        target: 'https://envId-appid.tcloudbaseapp.com/',
        changeOrigin: true,
      }
    },
    allowedHosts: true
  }
});
