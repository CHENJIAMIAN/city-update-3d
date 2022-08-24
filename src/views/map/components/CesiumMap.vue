<template>
    <div class="CesiumMapVue">
        <div
            id="cesium-container"
            v-loading="loading"
            element-loading-text="正在加载图层,请稍等..."
            element-loading-spinner="el-icon-loading"
            element-loading-background="#0000008c"
        ></div>
        <!-- 默认sandcastle-toolbox -->
        <div id="toolbar" class="toolbar"></div>
        <div id="measure-toolbar" class="toolbar" style="display: none"></div>
        <fly-path-panel :asKanban="showFlyCesiumMap" ref="flyPathPanel" />
        <div v-show="!showFlyCesiumMap" class="cesium-viewer-status">
            {{ statustxt }}
        </div>
        <el-card class="box-card" v-if="isZhongShanQuanyan">
            <el-checkbox v-model="checkFanwei" label="范围" />
            <el-checkbox
                v-model="checkZhongyuanhongxian"
                title="三乡测绘_实测总图_雅居乐园中园红线"
                label="雅居乐园中园红线"
            />
        </el-card>
    </div>
</template>

<script lang="ts">
    import { mapState } from 'pinia';
    import { useMapStore } from '@/stores';
    import { getCenter } from 'ol/extent';
    import { transform } from 'ol/proj';
    import * as Cesium from 'cesium';
    import type {
        Cartographic,
        Viewer,
        Entity,
        Cartesian3,
        ScreenSpaceEventHandler,
    } from 'cesium';
    import 'cesium/Build/Cesium/Widgets/widgets.css';

    import Sandcastle from '@/views/map/sandcastle-toolbox';
    import { MeasureTools } from '@/views/map/cesium-measure';
    import CesiumNavigation from '@/views/map/cesium-navigation-es6/viewerCesiumNavigationMixin';
    import FlyPathPanel from '@/views/map/components/FlyPathPanel.vue';
    import {
        googleStateliteUrl,
        arcgisStateliteUrl,
    } from '@/views/map/olmap-common';
    // import { map } from '@/views/map/index.vue';
    import { defineComponent } from 'vue';
    import { createCesium } from '@/views/map/components/cesium-earth';

    declare module 'vue' {
        interface ComponentCustomProperties {
            viewer: Viewer;
        }
    }

    export let viewer: Viewer;
    export default defineComponent({
        name: 'CesiumMap',
        props: {
            showFlyCesiumMap: { type: Boolean, default: false },
        },
        components: {
            FlyPathPanel,
        },
        data() {
            return {
                currentFWBH: '',
                hightLightedPickedObject: null,
                isMoveMentEventOff: false,
                hightLightClickedBuildingListener: (evt: Event) => {},
                // 不要将这里的属性与cesium的相关对象关联,否则cesium相关对象会被劫持,造成性能问题
                loaded3DTilesModelFlag: false,
                loading: false,
                statustxt: '',
                //
                checkFanwei: true,
                checkZhongyuanhongxian: true,
            };
        },
        computed: {
            ...mapState(useMapStore, {
                isWallDisplay: (state) => state.isWallDisplay,
                isZhongShanQuanyan: (state) => state.isZhongShanQuanyan,
                wallDisplayTypeIsLine: (state) => state.wallDisplayTypeIsLine,
            }),
        },
        watch: {
            checkFanwei(n, o) {
                const { viewer } = this;
                const wallline = viewer?.entities?.values?.find(
                    (i) => i.name === '墙体上线'
                );
                if (wallline)
                    wallline.show = (n && this.wallDisplayTypeIsLine) || false;
                const wallrange = viewer.entities.values.find(
                    (i) => i.name === '墙体范围'
                );
                if (wallrange)
                    wallrange.show =
                        (n && !this.wallDisplayTypeIsLine) || false;
                viewer.scene.requestRender();
            },
            checkZhongyuanhongxian(n, o) {
                const wallline = viewer?.entities?.values?.find(
                    (i) => i.name === '雅居乐中园墙体上线'
                );
                if (wallline)
                    wallline.show = (n && this.wallDisplayTypeIsLine) || false;
                const wallrange = viewer.entities.values.find(
                    (i) => i.name === '雅居乐中园范围'
                );
                if (wallrange)
                    wallrange.show =
                        (n && !this.wallDisplayTypeIsLine) || false;
                viewer.scene.requestRender();
            },
            isWallDisplay: {
                handler(n, o) {
                    const { viewer } = this;
                    if (!this.isZhongShanQuanyan) {
                        const wallline = viewer?.entities?.values?.find(
                            (i) => i.name === '墙体上线'
                        );
                        if (wallline) wallline.show = n;
                        const wallrange = viewer.entities.values.find(
                            (i) => i.name === '墙体范围'
                        );
                        if (wallrange) wallrange.show = n;
                    }
                    viewer.scene.requestRender();
                },
            },
            // 作为看板时
            showFlyCesiumMap(n) {
                const { viewer } = this;
                const panel = this.$refs.flyPathPanel;
                if (n) {
                    const style = (viewer.homeButton.container as HTMLElement)
                        .style;
                    style.display = 'none';
                    if (localStorage.pathStr) {
                        const { coordinates, speed, height } = JSON.parse(
                            JSON.parse(localStorage.pathStr)
                        );
                        if (panel) {
                            panel.initFunc();
                            panel.coordinates = coordinates;
                            panel.speed = speed;
                            panel.height = height;
                            panel.genPath();
                            panel.hancleFlyStart();
                        }
                    } else {
                        this.$message.error(
                            '未找到飞行路径, 请到业务管理-项目总览-3D地图-3D飞行漫游进行绘制'
                        );
                    }
                } else {
                    const style = (viewer.homeButton.container as HTMLElement)
                        .style;
                    style.display = 'block';
                    panel?.destoryFunc();
                }
            },
            // 父级切换到3d时，初始化
            '$parent.is3D'(n, o) {
                if (n && !this.loaded3DTilesModelFlag) {
                    this.loaded3DTilesModelFlag = true;
                    // 显示时才加载模型,防止拖慢2d
                    // viewer不存在报错
                    // this.add3DTilesModel(viewer);
                    // this.loadNorthNavigator(viewer);
                    // this.addMeasureTool(viewer);
                }
            },
        },
        mounted() {
            viewer = this.viewer = createCesium();
        },
        methods: {
            addMeasureTool(viewer: Viewer) {
                const measureTool = new MeasureTools(viewer);
                Sandcastle.addToolbarButton(
                    '画线',
                    () => {
                        measureTool.measurePolyLine();
                    },
                    'measure-toolbar'
                );
                Sandcastle.addToolbarButton(
                    '画面',
                    () => {
                        measureTool.measurePolygon();
                    },
                    'measure-toolbar'
                );
                Sandcastle.addToolbarButton(
                    '量高',
                    () => {
                        measureTool.measureHeight();
                    },
                    'measure-toolbar'
                );
                Sandcastle.addToolbarButton(
                    '移除',
                    () => {
                        this.$message.success('移除成功');
                        measureTool.destroy();
                    },
                    'measure-toolbar'
                );
                Sandcastle.addToolbarButton(
                    '关闭',
                    () => {
                        measureTool.destroy();
                        const dom = document.getElementById('measure-toolbar');
                        if (dom) dom.style.display = 'none';
                        const $store = useMapStore();
                        $store.CHANGE_MAP_STATE({
                            key: 'isShow3DMeasure',
                            value: false,
                        });
                    },
                    'measure-toolbar'
                );
            },
            add3DTilesModel(viewer: Viewer) {
                this.loading = true;
                // getPhotoGraphicFileUrlByProjectId({
                //     projectId: this.projectId,
                // }).then((r) => {
                const r = {
                    res: '0',
                    msg: '操作成功!',
                    data: {
                        url: '/quanyan',
                    },
                };
                if (!r.data) {
                    this.$message.error(
                        '未配置倾斜摄影模型地址，请联系系统管理员'
                    );
                    return;
                }
                let dantiTilesetUrlPath;
                let url = r.data.url;
                let urls = [];
                // 判断有没有逗号, 判断是不是有多个tileset
                if (url.includes(',')) {
                    urls = url.split(',');
                    dantiTilesetUrlPath = urls[0];
                } else {
                    urls = [url];
                    dantiTilesetUrlPath = url;
                }

                const tilesets = (window.tilesets = urls.map(
                    (i) =>
                        new Cesium.Cesium3DTileset({
                            url: '/gis' + i + '/tileset.json', //数据路径
                            skipLevelOfDetail: true, //确定在遍历期间是否应应用详细程度跳过
                            // skipScreenSpaceErrorFactor: 50,
                            immediatelyLoadDesiredLevelOfDetail: true, //true，只有瓷砖满足最大屏幕空间误差都不会被下载。跳过因子将被忽略，仅加载所需的图块
                            // maximumNumberOfLoadedTiles: 1, //最大加载瓦片个数
                            // maximumMemoryUsage: 800
                            // debugShowMemoryUsage: true,
                            // modelMatrix: m //转移矩阵,调整模型位置  或 tileset.modelMatrix =xx;
                            /*
          当前策略是始终加载当前场景和屏幕空间错误所需的数据量。 maximumMemoryUsage 只是帧到帧缓存的大小。我们意识到这并不理想，因此请计划更改它，有关详细信息，请按照＃6226进行操作。
          同时，最好的解决方案是提高图块集的 MaximumScreenSpace 错误
          */
                        })
                ));

                this.$on('hook:destroyed', () => {
                    console.log(`this.$on("hook:destroyed", _ => { 销毁viewer`);
                    if (viewer) {
                        // 内存并没有减少,奇怪(被vue劫持了)
                        viewer.dataSources &&
                            viewer.dataSources.removeAll(true);
                        viewer.entities && viewer.entities.removeAll();
                        viewer.destroy(); // viewer.destroy包含了viewer.scene.primitives.destroy();
                    }
                });
                window.adjustTileSet = this.adjustTileSet;
                window.update3dtilesMaxtrix = this.update3dtilesMaxtrix;
                window.zoomTo = () => {
                    viewer.zoomTo(
                        tilesets[0],
                        new Cesium.HeadingPitchRange(
                            0,
                            Cesium.Math.toRadians(-90.0),
                            2000
                        )
                    );
                };
                tilesets.forEach((tileset, index) => {
                    tileset.readyPromise
                        .then((theTileset) => {
                            if (index === 0) {
                                const zoomTo = () =>
                                    viewer.zoomTo(
                                        theTileset,
                                        new Cesium.HeadingPitchRange(
                                            0,
                                            Cesium.Math.toRadians(-90.0),
                                            2000
                                        )
                                    );
                                // 设置home按钮跳转到模型
                                viewer.homeButton.viewModel.command.beforeExecute.addEventListener(
                                    (e) => {
                                        e.cancel = true;
                                        zoomTo();
                                    }
                                );
                            }
                            // 云效的流水线自动构建后的cesium版本是最新的1.79.1，没有tileset.url属性，只有tileset._url属性
                            if (theTileset._url.includes('jitang'))
                                this.adjustTileSet(theTileset, {
                                    xAxias: 0.00002,
                                    height: -5,
                                });
                            else if (theTileset._url.includes('jiangcun1'))
                                this.adjustTileSet(tilesets[0], {
                                    xAxias: 0,
                                    height: 25,
                                });
                            else if (theTileset._url.includes('jiangcun2'))
                                this.adjustTileSet(tilesets[1], {
                                    xAxias: 0,
                                    height: 20,
                                });
                            else if (theTileset._url.includes('jiangcun3'))
                                this.adjustTileSet(tilesets[2], {
                                    xAxias: 0,
                                    height: 18,
                                });
                            else if (theTileset._url.includes('hemu'))
                                // 这个刚进界面是飘在空中的，要执行两遍才贴到地上
                                // this.adjustTileSet(theTileset, { xAxias: -0.0124582, yAxias: -0.0430213,height: -12605 });
                                // 整体比this.adjustTileSet调整的要准一点
                                this.update3dtilesMaxtrix(theTileset, {
                                    tx: 112.899025, //模型中心X轴坐标（经度，单位：十进制度）
                                    ty: 21.05855, //模型中心Y轴坐标（纬度，单位：十进制度）
                                    tz: -30, //模型中心Z轴坐标（高程，单位：米）
                                    rx: 0, //X轴（经度）方向旋转角度（单位：度）
                                    ry: 0, //Y轴（纬度）方向旋转角度（单位：度）
                                    rz: 0, //Z轴（高程）方向旋转角度（单位：度）
                                    scale: 0, //缩放比例
                                });
                            else if (theTileset._url.includes('lingnan'))
                                this.update3dtilesMaxtrix(theTileset, {
                                    tx: 112.901246, //模型中心X轴坐标（经度，单位：十进制度）
                                    ty: 21.0581, //模型中心Y轴坐标（纬度，单位：十进制度）
                                    tz: -35, //模型中心Z轴坐标（高程，单位：米）
                                    rx: 0, //X轴（经度）方向旋转角度（单位：度）
                                    ry: 0, //Y轴（纬度）方向旋转角度（单位：度）
                                    rz: 0, //Z轴（高程）方向旋转角度（单位：度）
                                    scale: 0, //缩放比例
                                });
                            else if (theTileset._url.includes('chebei'))
                                this.update3dtilesMaxtrix(theTileset, {
                                    tx: 112.90283, //模型中心X轴坐标（经度，单位：十进制度）
                                    ty: 21.05787, //模型中心Y轴坐标（纬度，单位：十进制度）
                                    tz: -10, //模型中心Z轴坐标（高程，单位：米）
                                    rx: 0, //X轴（经度）方向旋转角度（单位：度）
                                    ry: 0, //Y轴（纬度）方向旋转角度（单位：度）
                                    rz: 0, //Z轴（高程）方向旋转角度（单位：度）
                                    scale: 0, //缩放比例
                                });
                            else if (theTileset._url.includes('gaobu'))
                                this.update3dtilesMaxtrix(theTileset, {
                                    tx: 112.900105, //模型中心X轴坐标（经度，单位：十进制度）
                                    ty: 21.05833, //模型中心Y轴坐标（纬度，单位：十进制度）
                                    tz: -33, //模型中心Z轴坐标（高程，单位：米）
                                    rx: 0, //X轴（经度）方向旋转角度（单位：度）
                                    ry: 0, //Y轴（纬度）方向旋转角度（单位：度）
                                    rz: 0, //Z轴（高程）方向旋转角度（单位：度）
                                    scale: 0, //缩放比例
                                });
                            //第二个参数depthTestAgainstTerrain为true后需要设置一下高度
                            else
                                this.adjustTileSet(theTileset, {
                                    height: -5,
                                }); //第二个参数depthTestAgainstTerrain为true后需要设置一下高度
                            // let lnglat = this.cartographicToLnglat(
                            //   Cesium.Cartographic.z fromCartesian(theTileset.boundingSphere.center)
                            // );
                            // console.log("校正后的3dtiles模型坐标", lnglat);
                            viewer.scene.primitives.add(theTileset);
                            if (index === 0) zoomTo();
                            // 加载用于单体话的3dtile
                            if (index === 0 && !this.showFlyCesiumMap) {
                                this.add3DTilesClassifyModel(
                                    viewer,
                                    dantiTilesetUrlPath
                                );
                                // const subName = this.$parent.buildingGsonUrl.match(
                                //   /typeName=.*:.*_(.*)&/
                                // )[1];
                                // const url = this.$parent.buildingGsonUrl.replace(subName, "fanwei");
                                const a = this.$parent.buildingGsonUrl;
                                if (a) {
                                    console.log(a);
                                    const b = a.slice(
                                        a.indexOf('&typeName='),
                                        a.indexOf('&outputFormat')
                                    );
                                    let url = a.replace(
                                        b,
                                        b.slice(0, b.indexOf('_')) + '_fanwei'
                                    );
                                    url = url.replace('EPSG:3857', 'EPSG:4326');
                                    const isZhongShanQuanyan =
                                        a.includes('quanyan');
                                    // 中山泉眼项目特有
                                    const $store = useMapStore();
                                    $store.CHANGE_MAP_STATE({
                                        key: 'isZhongShanQuanyan',
                                        value: isZhongShanQuanyan,
                                    });
                                    if (isZhongShanQuanyan) {
                                        let url2 = a.replace(
                                            b,
                                            b.slice(0, b.indexOf(':')) +
                                                ':三乡测绘_实测总图_雅居乐园中园红线'
                                        );
                                        url2 = url2.replace(
                                            'EPSG:3857',
                                            'EPSG:4326'
                                        );
                                        fetch(url2)
                                            .then((r) => r.json())
                                            .then((r) => {
                                                let arr0 = [];
                                                let arr1 = [];
                                                const geometry =
                                                    r.features[0].geometry;
                                                if (
                                                    geometry.type ===
                                                    'MultiLineString'
                                                ) {
                                                    arr0 =
                                                        geometry.coordinates[0].slice();
                                                    arr1 = arr0
                                                        .map((i) => {
                                                            i[2] = 50;
                                                            return i;
                                                        })
                                                        .flat(2);
                                                } else if (
                                                    geometry.type ===
                                                    'MultiPolygon'
                                                ) {
                                                    arr0 =
                                                        geometry.coordinates[0][0].slice();
                                                    arr1 = arr0
                                                        .map((i) => {
                                                            i.push(50);
                                                            return i;
                                                        })
                                                        .flat(2);
                                                }
                                                const positions =
                                                    Cesium.Cartesian3.fromDegreesArrayHeights(
                                                        // arr
                                                        [
                                                            ...arr1,
                                                            ...arr1.slice(3, 6),
                                                        ] //复制第二个点到最后，不然墙体没有封闭起来
                                                    );
                                                window.positions = positions;

                                                const wall =
                                                    viewer.entities.add({
                                                        name: '雅居乐中园范围',
                                                        wall: {
                                                            positions,
                                                            material:
                                                                Cesium.Color.RED.withAlpha(
                                                                    0.5
                                                                ),
                                                            outline: true,
                                                        },
                                                    });
                                                const wallLine =
                                                    viewer.entities.add({
                                                        name: '雅居乐中园墙体上线',
                                                        show: false,
                                                        polyline: {
                                                            positions,
                                                            width: 2.0,
                                                            material:
                                                                Cesium.Color
                                                                    .RED,
                                                        },
                                                    });
                                            })
                                            .catch((e) => {
                                                this.$message.error(
                                                    'GeoServer配置错误,加载范围失败'
                                                );
                                                console.error(e);
                                            });
                                    }
                                    fetch(url)
                                        .then((r) => r.json())
                                        .then((r) => {
                                            let arr0 = [];
                                            let arr1 = [];
                                            const geometry =
                                                r.features[0].geometry;
                                            if (
                                                geometry.type ===
                                                'MultiLineString'
                                            ) {
                                                arr0 =
                                                    geometry.coordinates[0].slice();
                                                arr1 = arr0
                                                    .map((i) => {
                                                        i[2] = 50;
                                                        return i;
                                                    })
                                                    .flat(2);
                                            } else if (
                                                geometry.type === 'MultiPolygon'
                                            ) {
                                                arr0 =
                                                    geometry.coordinates[0][0].slice();
                                                arr1 = arr0
                                                    .map((i) => {
                                                        i.push(50);
                                                        return i;
                                                    })
                                                    .flat(2);
                                            }
                                            const positions =
                                                Cesium.Cartesian3.fromDegreesArrayHeights(
                                                    // arr
                                                    [
                                                        ...arr1,
                                                        ...arr1.slice(3, 6),
                                                    ] //复制第二个点到最后，不然墙体没有封闭起来
                                                );
                                            window.positions = positions;

                                            const wall = viewer.entities.add({
                                                name: '墙体范围',
                                                wall: {
                                                    positions,
                                                    material:
                                                        Cesium.Color.RED.withAlpha(
                                                            0.5
                                                        ),
                                                    outline: true,
                                                },
                                            });
                                            const wallLine =
                                                viewer.entities.add({
                                                    name: '墙体上线',
                                                    show: false,
                                                    polyline: {
                                                        positions,
                                                        width: 2.0,
                                                        material:
                                                            Cesium.Color.RED,
                                                    },
                                                });
                                            // wallLine.definitionChanged.addEventListener(
                                            //   (origin, property, newValue, oldValue) => {
                                            //     this.checkFanwei = newValue;
                                            //   }
                                            // );
                                        })
                                        .catch((e) => {
                                            this.$message.error(
                                                'GeoServer配置错误,加载范围失败'
                                            );
                                            console.error(e);
                                        });
                                } else {
                                    this.$message.error(
                                        '没有在模型目录下放置单体3DTiles'
                                    );
                                }
                            }
                            this.loading = false;
                        })
                        .otherwise((error) => {
                            this.loading = false;
                            console.log(error);
                        });
                });
                const timeS = new Date();
                tilesets.forEach((tileset, index) =>
                    tileset.loadProgress.addEventListener(
                        (numberOfPendingRequests, numberOfTilesProcessing) => {
                            if (
                                numberOfPendingRequests === 0 &&
                                numberOfTilesProcessing === 0
                            ) {
                                this.statustxt = '加载完成';
                                console.log(
                                    `第${index}个倾斜模型加载完成`,
                                    new Date() - timeS
                                );
                                return;
                            }
                            this.statustxt = `[第${
                                index + 1
                            }个倾斜模型] 获取中: ${numberOfPendingRequests} , 加载中: ${numberOfTilesProcessing}`;
                        }
                    )
                );
                // });
            },
            add3DTilesClassifyModel(viewer: Viewer, dantiTilesetUrlPath) {
                let classifcationTilesetUrl = `/gis/${dantiTilesetUrlPath}/danti/tileset.json`;
                let classificationTileset = (this.classificationTileset =
                    new Cesium.Cesium3DTileset({
                        url: classifcationTilesetUrl,
                        // classificationType: Cesium.ClassificationType.CESIUM_3D_TILE
                        classificationType: Cesium.ClassificationType.BOTH,
                    }));
                classificationTileset.name = 'building';
                const defaultColor = Cesium.Color.RED.withAlpha(0.05);
                classificationTileset.style = new Cesium.Cesium3DTileStyle({
                    color: defaultColor.toCssColorString(),
                });
                viewer.scene.primitives.add(classificationTileset);

                let scene = viewer.scene;

                viewer.screenSpaceEventHandler.setInputAction((movement) => {
                    viewer._container.style.cursor = 'default';
                    let pickedObject = scene.pick(movement.endPosition);

                    if (this.isMoveMentEventOff) return;

                    // 移到无关的地方时
                    if (
                        !Cesium.defined(pickedObject) ||
                        !(pickedObject instanceof Cesium.Cesium3DTileFeature) ||
                        pickedObject.tileset.name !== 'building'
                    ) {
                        // 把高亮的给恢复
                        if (this.hightLightedPickedObject) {
                            this.unHightLightedLastPickedObject();
                        }
                        return;
                    }
                    // 搞到对象
                    const fwbh = this.getFWBH(pickedObject);
                    if (!Cesium.defined(fwbh)) {
                        return;
                    }
                    viewer._container.style.cursor = 'pointer';
                    // console.log(fwbh);
                    // 是有测绘编号的对象
                    if (Cesium.defined(fwbh)) {
                        // 选中的是当前正在高亮的,不动
                        if (fwbh === this.currentFWBH) {
                            return;
                        }
                        // 选中的不是当前高亮的
                        else {
                            // 当前有高亮的, 选中的不是当前高亮的,取消上个高亮
                            if (Cesium.defined(this.currentFWBH)) {
                                this.unHightLightedLastPickedObject();
                            }
                            // 先高亮当前选中的
                            this.hightLightedCurrentPickedObject(
                                pickedObject,
                                fwbh
                            );
                        }
                    }
                }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

                this.hightLightClickedBuildingListener = (evt) => {
                    // 打印点击坐标
                    // let cartesian = scene.pickPosition(evt.position);
                    // let lnglat = this.cartesianToLnglat(cartesian, true);
                    // console.log("点击了坐标", lnglat);
                    let pickedObject = scene.pick(evt.position);
                    this.highLightObj(pickedObject);
                };

                // 存在measureNumToLocate,就跳转(实在不知道怎么从tileset搞到具体要素的坐标了)
                const { measureNumToLocate } = this.$attrs;
                const annotations = (viewer.measureNumAnnotations =
                    scene.primitives.add(new Cesium.LabelCollection()));
                const feas = map.getAllBuildingFeas();

                const itv1 = setInterval(() => {
                    if (feas.length > 0) {
                        feas.forEach((fea) => {
                            const fwbh =
                                fea.getProperties().fwbh ||
                                fea.getProperties()['测绘编号'];
                            const extent = fea.getGeometry().getExtent();
                            let center = getCenter(extent); //获取边界区域的中心位置
                            const coord = transform(
                                center,
                                'EPSG:3857',
                                'EPSG:4326'
                            );
                            const cartesian = Cesium.Cartesian3.fromDegrees(
                                ...coord,
                                20.0
                            );
                            // 根据所有要素去添加建筑物标注
                            annotations.add({
                                position: cartesian,
                                text: fwbh,
                                show: true,
                                showBackground: true,
                                font: '16px',
                                horizontalOrigin:
                                    Cesium.HorizontalOrigin.CENTER,
                                verticalOrigin: Cesium.VerticalOrigin.CENTER,
                                disableDepthTestDistance:
                                    Number.POSITIVE_INFINITY,
                                scale: 1,
                                distanceDisplayCondition:
                                    new Cesium.DistanceDisplayCondition(0, 500),
                            });
                        });

                        this.flyToBuildingByMeasureNum(
                            measureNumToLocate,
                            feas
                        );
                        clearInterval(itv1);
                    }
                }, 500);
                setTimeout(() => clearInterval(itv1), 10 * 1000);

                viewer.screenSpaceEventHandler.setInputAction(
                    this.hightLightClickedBuildingListener,
                    Cesium.ScreenSpaceEventType.LEFT_CLICK
                );
            },
            getFWBH(pickedObject) {
                let fwbhName = pickedObject
                    .getPropertyNames()
                    .find(
                        (i) => i === '测绘编号' || i === 'fwbh' || i === 'FWBH'
                    );
                const fwbh = pickedObject.getProperty(fwbhName);
                return fwbh;
            },
            unHightLightedLastPickedObject() {
                let scene = viewer.scene;
                const defaultColor = Cesium.Color.RED.withAlpha(0.05);
                if (this.hightLightedPickedObject)
                    this.hightLightedPickedObject.color = defaultColor;
                scene.requestRender();
                this.currentFWBH = undefined;
                this.hightLightedPickedObject = null;
            },
            hightLightedCurrentPickedObject(pickedObject, fwbh) {
                let scene = viewer.scene;
                pickedObject.color = Cesium.Color.BLUE.withAlpha(0.5);
                scene.requestRender();
                this.currentFWBH = fwbh;
                this.hightLightedPickedObject = pickedObject;
            },
            highLightObj(pickedObject) {
                if (!pickedObject) return;
                // 开启mouse_move事件
                this.isMoveMentEventOff = false;
                // 点到无关的地方
                if (
                    !Cesium.defined(pickedObject) ||
                    !(pickedObject instanceof Cesium.Cesium3DTileFeature) ||
                    pickedObject.tileset.name !== 'building'
                ) {
                    return;
                }
                if (this.hightLightedPickedObject) {
                    this.unHightLightedLastPickedObject();
                }
                // 搞到对象
                const fwbh = this.getFWBH(pickedObject);
                if (!Cesium.defined(fwbh)) {
                    return;
                }
                this.hightLightedCurrentPickedObject(pickedObject, fwbh);
                // 去掉mouse_move事件
                this.isMoveMentEventOff = true;
                // 冒出fwbh
                this.$emit('clickBuildingOnCesiumMap', fwbh);
                console.log('冒出了3d中点击到的建筑', fwbh);
            },
            flyToBuildingByMeasureNum(measureNumToLocate, feas) {
                console.log('flyToBuildingByMeasureNum', measureNumToLocate);
                // 定位到measureNumToLocate要素
                const fea = feas.find((i) => {
                    const fwbh =
                        i.getProperties().fwbh || i.getProperties()['测绘编号'];
                    return fwbh === measureNumToLocate;
                });

                let canHighLightObj = false;
                let classificationTileset = this.classificationTileset;

                if (fea) {
                    const coord = transform(
                        fea.getGeometry().getFirstCoordinate(),
                        'EPSG:3857',
                        'EPSG:4326'
                    );
                    const dest = Cesium.Cartesian3.fromDegrees(
                        coord[0],
                        coord[1],
                        200.0
                    );
                    viewer.camera.flyTo({
                        destination: dest,
                        duration: 2,
                        complete: (e) => {
                            // 高亮
                            classificationTileset.tileVisible.addEventListener(
                                (tile) => {
                                    // console.count();
                                    // 飞过去的动画完成太快, 可能tile.content._features只加载了几个
                                    if (!canHighLightObj) {
                                        let content = tile.content;
                                        const tileSetFea =
                                            content._features.find(
                                                (i) =>
                                                    i.getProperty(
                                                        '测绘编号'
                                                    ) === measureNumToLocate ||
                                                    i.getProperty('fwbh') ===
                                                        measureNumToLocate ||
                                                    i.getProperty('FWBH') ===
                                                        measureNumToLocate
                                            );
                                        if (
                                            tileSetFea &&
                                            classificationTileset.tilesLoaded
                                        )
                                            canHighLightObj = true;
                                        this.highLightObj(tileSetFea);
                                    }
                                }
                            );
                        },
                    });
                } else if (measureNumToLocate) {
                    debugger;
                }
            },
            loadNorthNavigator(viewer: Viewer) {
                /*罗盘---------------------------------------------------------------------------------------*/
                let options = {};
                // 用于在使用重置导航重置地图视图时设置默认视图控制。接受的值是Cesium.Cartographic 和 Cesium.Rectangle.
                options.defaultResetView = Cesium.Rectangle.fromDegrees(
                    80,
                    22,
                    130,
                    50
                );
                // 用于启用或禁用罗盘。true是启用罗盘，false是禁用罗盘。默认值为true。如果将选项设置为false，则罗盘将不会添加到地图中。
                options.enableCompass = true;
                // 用于启用或禁用缩放控件。true是启用，false是禁用。默认值为true。如果将选项设置为false，则缩放控件将不会添加到地图中。
                options.enableZoomControls = false;
                // 用于启用或禁用距离图例。true是启用，false是禁用。默认值为true。如果将选项设置为false，距离图例将不会添加到地图中。
                options.enableDistanceLegend = false;
                // 用于启用或禁用指南针外环。true是启用，false是禁用。默认值为true。如果将选项设置为false，则该环将可见但无效。
                options.enableCompassOuterRing = true;
                CesiumNavigation(viewer, options);
            },
            // 对比update3dtilesMaxtrix,它更简单,没有旋转
            adjustTileSet(tileset, { xAxias = 0, yAxias = 0, height = 0 }) {
                const cartographic = Cesium.Cartographic.fromCartesian(
                    tileset.boundingSphere.center
                ); //获得原始中心
                let surface = Cesium.Cartesian3.fromRadians(
                    cartographic.longitude,
                    cartographic.latitude,
                    0.0
                );
                let offset = Cesium.Cartesian3.fromRadians(
                    cartographic.longitude + xAxias,
                    cartographic.latitude + yAxias,
                    -height || -cartographic.height
                ); //减去高度
                let translation = Cesium.Cartesian3.subtract(
                    offset,
                    surface,
                    new Cesium.Cartesian3()
                ); //计算偏移
                tileset.modelMatrix =
                    Cesium.Matrix4.fromTranslation(translation);
            },
            //平移、贴地、旋转模型
            update3dtilesMaxtrix(
                // this.update3dtilesMaxtrix(tileset, {
                //   tx: 113.9509894204082, //模型中心X轴坐标（经度，单位：十进制度）
                //   ty: 23.026304042520447, //模型中心Y轴坐标（纬度，单位：十进制度）
                //   tz: -44.68409132670809, //模型中心Z轴坐标（高程，单位：米）
                //   rx: 0, //X轴（经度）方向旋转角度（单位：度）
                //   ry: 0, //Y轴（纬度）方向旋转角度（单位：度）
                //   rz: 0, //Z轴（高程）方向旋转角度（单位：度）
                //   scale: 1 //缩放比例
                // });
                tileset,
                params = {
                    tx: 113.94791683, //模型中心X轴坐标（经度，单位：十进制度）
                    ty: 23.0230011, //模型中心Y轴坐标（纬度，单位：十进制度）
                    tz: -1675.5074465720434, //模型中心Z轴坐标（高程，单位：米）
                    rx: 0, //X轴（经度）方向旋转角度（单位：度）
                    ry: 0, //Y轴（纬度）方向旋转角度（单位：度）
                    rz: 0, //Z轴（高程）方向旋转角度（单位：度）
                    scale: 1, //缩放比例
                }
            ) {
                //旋转
                let mx = Cesium.Matrix3.fromRotationX(
                    Cesium.Math.toRadians(params.rx)
                );
                let my = Cesium.Matrix3.fromRotationY(
                    Cesium.Math.toRadians(params.ry)
                );
                let mz = Cesium.Matrix3.fromRotationZ(
                    Cesium.Math.toRadians(params.rz)
                );
                let rotationX = Cesium.Matrix4.fromRotationTranslation(mx);
                let rotationY = Cesium.Matrix4.fromRotationTranslation(my);
                let rotationZ = Cesium.Matrix4.fromRotationTranslation(mz);
                //平移
                let position = Cesium.Cartesian3.fromDegrees(
                    params.tx,
                    params.ty,
                    params.tz
                );
                let m = Cesium.Transforms.eastNorthUpToFixedFrame(position);
                //旋转、平移矩阵相乘
                Cesium.Matrix4.multiply(m, rotationX, m);
                Cesium.Matrix4.multiply(m, rotationY, m);
                Cesium.Matrix4.multiply(m, rotationZ, m);
                //赋值给tileset
                tileset._root.transform = m;
                //缩放
                let scale = (params.scale || 1) * 1;
                tileset._root.customTransform = {
                    matrix: {
                        origin: tileset._root.transform.clone(),
                        rotation: Cesium.Matrix4.IDENTITY,
                        translation: Cesium.Matrix4.IDENTITY,
                    },
                };
                let m1 = Cesium.Matrix4.fromScale(
                    new Cesium.Cartesian3(scale, scale, scale)
                );
                tileset._root.customTransform.matrix.scale = m1;
                tileset._root.customTransform.scale = scale;
                let m2 = new Cesium.Matrix4();
                Cesium.Matrix4.multiply(
                    tileset._root.customTransform.matrix.origin,
                    tileset._root.customTransform.matrix.rotation,
                    m2
                );
                Cesium.Matrix4.multiply(
                    m2,
                    tileset._root.customTransform.matrix.scale,
                    m2
                );
                Cesium.Matrix4.multiply(
                    m2,
                    tileset._root.customTransform.matrix.translation,
                    tileset._root.transform
                );
            },
            cartesianToLnglat(cartesian, isToWgs84) {
                // cartesian是3d笛卡尔坐标
                // isToWgs84 true 返回wgs84坐标  ,false返回弧度
                const viewer = this.viewer;
                if (!cartesian) return;
                let ellipsoid = viewer.scene.globe.ellipsoid;
                let lnglat = ellipsoid.cartesianToCartographic(cartesian);
                if (isToWgs84) {
                    let lat = Cesium.Math.toDegrees(lnglat.latitude);
                    let lng = Cesium.Math.toDegrees(lnglat.longitude);
                    let hei = lnglat.height;
                    return [lng, lat, hei];
                } else {
                    return [lnglat.longitude, lnglat.latitude, lnglat.height];
                }
            },
            cartographicToLnglat(cartographic) {
                // 弧度转经纬度
                const viewer = this.viewer;
                if (!cartographic) return;
                let lat = Cesium.Math.toDegrees(cartographic.latitude);
                let lng = Cesium.Math.toDegrees(cartographic.longitude);
                let hei = cartographic.height;
                return [lng, lat, hei];
            },
        },
    });
</script>
<style lang="scss" scoped>
    #cesium-container {
        height: 100vh;
        position: absolute;
        width: 100%;
    }
    .toolbar {
        background: rgba(42, 42, 42, 0.8);
        padding: 4px;
        border-radius: 4px;
        margin: 5px;
        position: absolute;
        >>> {
            .cesium-button input {
                vertical-align: initial;
                margin: 3px;
            }
        }
    }
    .cesium-viewer-status {
        position: absolute;
        bottom: 0;
        left: 0;
        background: rgba(42, 42, 42, 0.8);
        color: white;
        padding: 0.25rem;
        font-size: 0.8rem;
    }
    .box-card {
        transform: translate(-110px, -10px);
        background: white;
        >>> .el-card__body {
            padding: 8px;
        }
    }
</style>
