// 对比原始, 修改了cesiumBuildPath以解决原始_commonjsHelpers文件下划线开头造成github page 404
// src/index.ts
import fs from 'fs-extra';
import path from 'path';
import externalGlobals from 'rollup-plugin-external-globals';
import serveStatic from 'serve-static';
import { normalizePath } from 'vite';
function vitePluginCesium(options = {}) {
    const {
        rebuildCesium = false,
        devMinifyCesium = false,
        cesiumBuildRootPath = 'node_modules/cesium/Build',
        cesiumBuildPath = 'Cesium',
    } = options;
    let CESIUM_BASE_URL = 'cesium/';
    let outDir = 'dist';
    let base = '/';
    let isBuild = false;
    return {
        name: 'vite-plugin-cesium',
        config(c, { command }) {
            var _a;
            isBuild = command === 'build';
            if (c.base) {
                base = c.base;
                if (base === '') base = './';
            }
            if ((_a = c.build) == null ? void 0 : _a.outDir) {
                outDir = c.build.outDir;
            }
            CESIUM_BASE_URL = path.posix.join(base, CESIUM_BASE_URL);
            const userConfig = {};
            if (!isBuild) {
                userConfig.define = {
                    CESIUM_BASE_URL: JSON.stringify(CESIUM_BASE_URL),
                };
            } else {
                if (rebuildCesium) {
                    userConfig.build = {
                        assetsInlineLimit: 0,
                        chunkSizeWarningLimit: 5e3,
                        rollupOptions: {
                            output: {
                                intro: `window.CESIUM_BASE_URL = "${CESIUM_BASE_URL}";`,
                            },
                        },
                    };
                } else {
                    userConfig.build = {
                        rollupOptions: {
                            external: ['cesium'],
                            plugins: [externalGlobals({ cesium: 'Cesium' })],
                        },
                    };
                }
            }
            return userConfig;
        },
        configureServer({ middlewares }) {
            const cesiumPath = path.join(
                cesiumBuildRootPath,
                devMinifyCesium ? 'Cesium' : 'CesiumUnminified'
            );
            middlewares.use(
                path.posix.join('/', CESIUM_BASE_URL),
                serveStatic(cesiumPath)
            );
        },
        async closeBundle() {
            if (isBuild) {
                try {
                    await fs.copy(
                        path.join(cesiumBuildPath, 'Assets'),
                        path.join(outDir, 'cesium/Assets')
                    );
                    await fs.copy(
                        path.join(cesiumBuildPath, 'ThirdParty'),
                        path.join(outDir, 'cesium/ThirdParty')
                    );
                    await fs.copy(
                        path.join(cesiumBuildPath, 'Workers'),
                        path.join(outDir, 'cesium/Workers')
                    );
                    await fs.copy(
                        path.join(cesiumBuildPath, 'Widgets'),
                        path.join(outDir, 'cesium/Widgets')
                    );
                    if (!rebuildCesium) {
                        await fs.copy(
                            path.join(cesiumBuildPath, 'Cesium.js'),
                            path.join(outDir, 'cesium/Cesium.js')
                        );
                    }
                } catch (err) {
                    console.error('copy failed', err);
                }
            }
        },
        transformIndexHtml() {
            const tags = [
                {
                    tag: 'link',
                    attrs: {
                        rel: 'stylesheet',
                        href: normalizePath(
                            path.join(CESIUM_BASE_URL, 'Widgets/widgets.css')
                        ),
                    },
                },
            ];
            if (isBuild && !rebuildCesium) {
                tags.push({
                    tag: 'script',
                    attrs: {
                        src: normalizePath(
                            path.join(CESIUM_BASE_URL, 'Cesium.js')
                        ),
                    },
                });
            }
            return tags;
        },
    };
}
export { vitePluginCesium as default };
