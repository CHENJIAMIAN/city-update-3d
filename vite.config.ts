import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vite';
import legacy from '@vitejs/plugin-legacy';
import vue2 from '@vitejs/plugin-vue2';
import vue2Jsx from '@vitejs/plugin-vue2-jsx';
import Unocss from 'unocss/vite';
// import cesium from './vite-plugin-cesium';//解决cesium ^1.96.0 原始_commonjsHelpers文件下划线开头造成github page 404的问题
import cesium from 'vite-plugin-cesium';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        cesium(),
        vue2(),
        vue2Jsx(),
        legacy({
            targets: ['ie >= 11'],
            additionalLegacyPolyfills: ['regenerator-runtime/runtime'],
        }),
        Unocss({
            /* options */
        }),
    ],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
    },
    build: {
        outDir: "docs"
    }
});
