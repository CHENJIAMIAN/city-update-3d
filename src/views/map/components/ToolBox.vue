<template>
    <div class="tool-box flex absolute z-1 bg-white right-5 top-5 shadow-lg">
        <div class="dropdown-button" @click="handleAnnotationsClick">
            <img
                width="16"
                height="16"
                src="../../../assets/icon/layersCompare.png"
            />
            <span>切换编号显示</span>
        </div>
        <template v-if="$parent?.is3D">
            <div
                v-if="!isZhongShanQuanyan"
                class="dropdown-button"
                @click="handleWallDisplayClick"
            >
                <img
                    width="16"
                    height="16"
                    src="../../../assets/icon/layersCompare.png"
                />
                <span>切换墙体显示</span>
            </div>
            <div
                class="dropdown-button"
                v-if="!isShow3DMeasure"
                @click="handle3DFlyPathClick"
            >
                <img
                    width="16"
                    height="16"
                    src="../../../assets/icon/ground.png"
                />
                <span>3D飞行漫游</span>
            </div>

            <!-- 3d图上测量 -->
            <div
                class="dropdown-button"
                v-if="!showFlyPathPanel"
                @click="handle3DMeasureClick"
            >
                <img
                    width="16"
                    height="16"
                    src="../../../assets/icon/measure.png"
                />
                <span>图上测量</span>
            </div>
        </template>
        <template v-else>
            <!-- 图层筛选控制 -->
            <div class="dropdown-button" @click="$emit('toggleLayerControl')">
                <img
                    width="16"
                    height="16"
                    src="../../../assets/icon/aspiration.png"
                />
                <span>图层筛选控制</span>
            </div>
            <!-- 工具下拉 -->
            <el-dropdown size="small" v-show="showTool" trigger="click">
                <div class="dropdown-button">
                    <img
                        width="16"
                        height="16"
                        src="../../../assets/icon/utilBox.png"
                    />
                    <span>工具</span>
                </div>
                <el-dropdown-menu slot="dropdown">
                    <el-dropdown-item @click.native="handleAddBuildingClick">
                        <div class="flex center">
                            <img
                                width="16"
                                height="16"
                                src="../../../assets/icon/selfBuildlayer.png"
                            />
                            <span style="margin-left: 6px">新增建筑</span>
                        </div>
                    </el-dropdown-item>
                    <el-dropdown-item
                        divided
                        @click.native="handleDeleteBuildingClick"
                    >
                        <div class="flex center">
                            <img
                                width="16"
                                height="16"
                                src="../../../assets/icon/selfBuildlayer.png"
                            />
                            <span style="margin-left: 6px">删除建筑</span>
                        </div>
                    </el-dropdown-item>
                    <el-dropdown-item
                        divided
                        @click.native="handleDrawLayerClick"
                    >
                        <div class="flex center">
                            <img
                                width="16"
                                height="16"
                                src="../../../assets/icon/selfBuildlayer.png"
                            />
                            <span style="margin-left: 6px">自建图层</span>
                        </div>
                    </el-dropdown-item>
                    <el-dropdown-item
                        divided
                        @click.native="handleCompareMapClick"
                    >
                        <div class="flex center">
                            <img
                                width="16"
                                height="16"
                                src="../../../assets/icon/layersCompare.png"
                            />
                            <span style="margin-left: 6px">数据比对</span>
                        </div>
                    </el-dropdown-item>
                </el-dropdown-menu>
            </el-dropdown>
            <!-- 数据统计 -->
            <el-dropdown v-if="showStatic" size="small" trigger="click">
                <div class="dropdown-button">
                    <img
                        width="16"
                        height="16"
                        src="../../../assets/icon/count.png"
                    />
                    <span>数据统计</span>
                </div>
                <el-dropdown-menu slot="dropdown">
                    <el-dropdown-item>
                        <div class="flex center" @click="handleCountClick(1)">
                            <img
                                width="16"
                                height="16"
                                src="../../../assets/icon/building.png"
                            />
                            <span style="margin-left: 6px">建筑物数据统计</span>
                        </div>
                    </el-dropdown-item>
                    <el-dropdown-item divided>
                        <div class="flex center" @click="handleCountClick(2)">
                            <img
                                width="16"
                                height="16"
                                src="../../../assets/icon/ground.png"
                            />
                            <span style="margin-left: 6px">地块数据统计</span>
                        </div>
                    </el-dropdown-item>
                    <el-dropdown-item divided>
                        <div class="flex center" @click="handleCountClick(3)">
                            <img
                                width="16"
                                height="16"
                                src="../../../assets/icon/aspiration.png"
                            />
                            <span style="margin-left: 6px">
                                意愿征集数据统计
                            </span>
                        </div>
                    </el-dropdown-item>
                    <el-dropdown-item divided>
                        <div class="flex center" @click="handleCountClick(4)">
                            <img
                                width="16"
                                height="16"
                                src="../../../assets/icon/authentification.png"
                            />
                            <span style="margin-left: 6px">确权数据统计</span>
                        </div>
                    </el-dropdown-item>
                    <el-dropdown-item divided>
                        <div class="flex center" @click="handleCountClick(5)">
                            <img
                                width="16"
                                height="16"
                                src="../../../assets/icon/measure.png"
                            />
                            <span style="margin-left: 6px">
                                测绘丈量数据统计
                            </span>
                        </div>
                    </el-dropdown-item>
                    <el-dropdown-item divided>
                        <div class="flex center" @click="handleCountClick(6)">
                            <img
                                width="16"
                                height="16"
                                src="../../../assets/icon/dismantle.png"
                            />
                            <span style="margin-left: 6px">拆除数据统计</span>
                        </div>
                    </el-dropdown-item>
                    <el-dropdown-item divided>
                        <div class="flex center" @click="handleCountClick(7)">
                            <img
                                width="16"
                                height="16"
                                src="../../../assets/icon/rightCancel.png"
                            />
                            <span style="margin-left: 6px">
                                产权注销数据统计
                            </span>
                        </div>
                    </el-dropdown-item>
                    <el-dropdown-item divided>
                        <div class="flex center" @click="handleCountClick(8)">
                            <img
                                width="16"
                                height="16"
                                src="../../../assets/icon/recvHouse.png"
                            />
                            <span style="margin-left: 6px">收房数据统计</span>
                        </div>
                    </el-dropdown-item>
                    <el-dropdown-item divided>
                        <div class="flex center" @click="handleCountClick(9)">
                            <img
                                width="16"
                                height="16"
                                src="../../../assets/icon/recvHouse.png"
                            />
                            <span style="margin-left: 6px">交叉统计类</span>
                        </div>
                    </el-dropdown-item>
                </el-dropdown-menu>
            </el-dropdown>
            <!-- 拆赔预算 -->
            <div
                class="dropdown-button"
                v-if="showBudget"
                @click="$emit('showDisburseBudget')"
            >
                <img
                    width="16"
                    height="16"
                    src="../../../assets/icon/payAccount.png"
                />
                <span>拆赔预算</span>
            </div>
            <!-- 2d图上测量 -->
            <div
                class="dropdown-button"
                v-if="showMeasure"
                @click="handle2DMeasureClick"
            >
                <img
                    width="16"
                    height="16"
                    src="../../../assets/icon/measure.png"
                />
                <span>图上测量</span>
            </div>
        </template>
    </div>
</template>

<script lang="ts">
    import { mapState } from 'pinia';
    import { useMapStore } from '@/stores';
    import { primaryAction } from 'ol/events/condition';
    import { viewer } from '@/views/map/components/CesiumMap.vue';
    import { Vector as VectorLayer } from 'ol/layer';
    import { Vector as VectorSource } from 'ol/source';
    import { Draw } from 'ol/interaction';
    import Feature from 'ol/Feature';
    import { WFS } from 'ol/format';
    import { Stroke, Style } from 'ol/style';
    import { transform } from 'ol/proj';
    import { map } from '@/views/map/index.vue';
    import { getBuildingFeaByMeasureNum } from '@/views/map/olmap-utils';
    import {
        getFWStyleFunc,
        getNoneTextFWStyleFunc,
    } from '@/views/map/olmap-common';

    // import type { Notification as ElNotification } from 'element-ui';
    import { defineComponent } from 'vue';
    import type { Geometry } from 'ol/geom';

    export default defineComponent({
        components: {},
        data() {
            let notify1: any;
            let notify2: any;
            return {
                // drawingPolygon: false,
                // measuring: false,
                fwbzFlag: true,
                notify1,
                notify2,
                addingBuilding: false,
            };
        },
        watch: {
            $route: {
                immediate: true,
                handler(route, o) {
                    const { deleteEditFlag, measureNum } = this.$route.query;
                    if (!!+deleteEditFlag) {
                        // 由父级组件根据路由参数去 fitMapViewToBuildingByMeasureNum
                        // 进入到可以删除建筑物的状态
                        if (!this.notify1) {
                            this.notify1 = this.$notify({
                                duration: 0,
                                offset: 100,
                                showClose: false,
                                dangerouslyUseHTMLString: true,
                                message: `<div><strong>请点击要删除的建筑物要素</strong></div>
            <a style="cursor:pointer;">(点我退出删除编辑状态)</a>`,
                                onClick: () => {
                                    // this.$route.query.deleteEditFlag = 0;//非响应式
                                    this.$router.push(
                                        `/mappage/projectOverview/index?deleteEditFlag=0&measureNum=${measureNum}`
                                    );
                                },
                            } as ElNotificationOptions);
                            this.$on('hook:beforeDestroy', () => {
                                this.notify1?.close();
                                this.notify1 = null;
                            });
                        }
                    } else {
                        this.notify1?.close();
                        this.notify1 = null;
                    }
                },
            },
        },
        computed: {
            ...mapState(useMapStore, {
                isDrawingRegion: (state) => state.isDrawingRegion, //获取子模块的
                isShow3DMeasure: (state) => state.isShow3DMeasure,
                showFlyPathPanel: (state) => state.showFlyPathPanel,
                measuring: (state) => state.measuring,
                drawingPolygon: (state) => state.drawingPolygon,
                isWallDisplay: (state) => state.isWallDisplay,
                isZhongShanQuanyan: (state) => state.isZhongShanQuanyan,
                wallDisplayTypeIsLine: (state) => state.wallDisplayTypeIsLine,
            }),

            showTool() {
                // 新增  删除 自建
                return (
                    !(this.$parent as any)?.showStatistics &&
                    !(this.$parent as any)?.disburseBudgetDrawerList.visible &&
                    !this.drawingPolygon &&
                    !this.measuring &&
                    this.$route.query.deleteEditFlag != 1 &&
                    !this.addingBuilding
                );
            },
            showStatic() {
                return (
                    !this.measuring &&
                    !(this.$parent as any)?.disburseBudgetDrawerList.visible &&
                    !this.drawingPolygon &&
                    this.$route.query.deleteEditFlag != 1 &&
                    !this.addingBuilding
                );
            },
            showBudget() {
                return (
                    !this.drawingPolygon &&
                    !this.measuring &&
                    !(this.$parent as any)?.showStatistics &&
                    this.$route.query.deleteEditFlag != 1 &&
                    !this.addingBuilding
                );
            },
            showMeasure() {
                return (
                    !this.isDrawingRegion &&
                    !this.drawingPolygon &&
                    !(this.$parent as any)?.showStatistics &&
                    !(this.$parent as any)?.disburseBudgetDrawerList.visible &&
                    this.$route.query.deleteEditFlag != 1 &&
                    !this.addingBuilding
                );
            },
        },
        mounted() {
            const intervalGotMap = setInterval(() => {
                if (map) {
                    clearInterval(intervalGotMap);

                    map.on('click', (evt) => {
                        map.forEachFeatureAtPixel(
                            evt.pixel,
                            (feature, layer) => {
                                // 路由是删除编辑状态才执行
                                if (this.$route.query.deleteEditFlag != 1)
                                    return;
                                if (!layer) return;
                                const { name: layername, flag } =
                                    layer.getProperties();
                                const props = feature.getProperties();
                                if (flag === 'building') {
                                    const fwbh =
                                        props.fwbh || props['测绘编号'];
                                    // 弹出删除确认框
                                    this.$confirm(
                                        `是否删除房屋编号为[${fwbh}]的建筑物要素?`,
                                        '提示',
                                        {
                                            confirmButtonText: '删除',
                                            cancelButtonText: '取消',
                                            type: 'warning',
                                        }
                                    )
                                        .then(() => {
                                            // 提交删除的wfs
                                            // 添加到服务器端
                                            this.deleteWfs(feature);
                                            // 3秒后，自动刷新页面上的feature
                                            setTimeout(() => {
                                                const layers =
                                                    map.getLayersByProperty(
                                                        'flag',
                                                        'building'
                                                    );
                                                layers.forEach((layer) =>
                                                    layer.getSource().refresh()
                                                );
                                            }, 2000);
                                            const measureNum =
                                                this.$route.query.measureNum;
                                            // 拿完路由上的测绘编号后,重置路由
                                            this.$router.push(
                                                `/mappage/projectOverview/index?deleteEditFlag=1`
                                            );
                                            // 删除成功后
                                            // 如果路由没有传测绘编号进来,说明是先删除的地图要素
                                            // 要提示跳转到建筑物管理去删除
                                            if (!measureNum) {
                                                this.$confirm(
                                                    '是否删除 地图上该建筑物要素 对应的 建筑物数据?',
                                                    '提示',
                                                    {
                                                        confirmButtonText:
                                                            '确定',
                                                        cancelButtonText:
                                                            '取消',
                                                        type: 'warning',
                                                    }
                                                )
                                                    .then(() => {
                                                        // 跳转到建筑物
                                                        this.$router.push(
                                                            `/basicDataManage/building/index?searchVal=${fwbh}`
                                                        );
                                                    })
                                                    .catch(() => {});
                                            } else {
                                                // 如果有传测绘编号进来,测操作结束
                                            }
                                        })
                                        .catch(() => {});
                                }
                            }
                        );
                    });
                }
            }, 1000);
        },
        methods: {
            // 添加到服务器端
            addWfs(feature: Feature, measureNum: string) {
                let WFSTSerializer = new WFS();
                const layername = (this.$parent as any)?.buildingLayers
                    .find((i) => i.get('name').includes('_fw'))
                    .get('name');
                if (!layername || !(this.$parent as any)?.namespace) {
                    debugger;
                    return;
                }
                let featObject = WFSTSerializer.writeTransaction(
                    [feature],
                    [],
                    [],
                    {
                        featureType: layername,
                        featureNS: (this.$parent as any)?.namespace,
                        // srsName: "http://www.opengis.net/def/crs/epsg/0/3857",//urn:ogc:def:crs:EPSG::4326
                        srsName: 'EPSG:3857', //
                        featurePrefix: '',
                        nativeElements: [],
                    }
                );
                let serializer = new XMLSerializer();
                let featString = serializer.serializeToString(featObject);
                let xhr = new XMLHttpRequest();
                xhr.open('POST', '/geoserver/wfs?service=wfs');
                xhr.setRequestHeader('Content-Type', 'text/xml');
                xhr.send(featString);
                xhr.onreadystatechange = (e) => {
                    if (xhr.readyState == 4 && xhr.status == 200) {
                        if (xhr.response.includes('wfs:totalInserted')) {
                            // 成功了才调用addBuilding接口
                            addBuilding({ measureNum: measureNum })
                                .then((r) => {
                                    this.$message.success(r.msg);
                                    this.$confirm(
                                        '是否完善 地图上该建筑物要素 对应的 建筑物数据信息?',
                                        '提示',
                                        {
                                            confirmButtonText: '确定',
                                            cancelButtonText: '取消',
                                            type: 'warning',
                                        }
                                    )
                                        .then(() => {
                                            // 跳转到建筑物
                                            this.$router.push(
                                                `/basicDataManage/building/index?searchVal=${measureNum}&isAdd=1`
                                            );
                                        })
                                        .catch(() => {});
                                })
                                .catch(() => {
                                    // 建筑物已经存在
                                    this.deleteWfs(feature);
                                });
                        } else {
                            this.$message.error(
                                '没有插入成功,请联系地图后台管理员.'
                            );
                        }
                    } else {
                        // alert(xhr.statusText);
                    }
                };
            },
            deleteWfs(feature: Feature) {
                const { $parent } = this;
                if (!$parent) return;
                let WFSTSerializer = new WFS();
                const layername = ($parent as any).buildingLayers
                    .find((i) => i.get('name').includes('_fw'))
                    .get('name');
                if (!layername || !($parent as any).namespace) return;
                let featObject = WFSTSerializer.writeTransaction(
                    [],
                    [],
                    [feature],
                    {
                        featureType: layername,
                        featureNS: ($parent as any).namespace,
                        // srsName: "http://www.opengis.net/def/crs/epsg/0/3857",//urn:ogc:def:crs:EPSG::4326
                        srsName: 'EPSG:3857', //
                        featurePrefix: '',
                        nativeElements: [],
                    }
                );
                let serializer = new XMLSerializer();
                let featString = serializer.serializeToString(featObject);
                let xhr = new XMLHttpRequest();
                xhr.open('POST', '/geoserver/wfs?service=wfs');
                xhr.setRequestHeader('Content-Type', 'text/xml');
                xhr.send(featString);
                xhr.onreadystatechange = (e) => {
                    if (xhr.readyState == 4 && xhr.status == 200) {
                        if (xhr.response.includes('wfs:totalDeleted')) {
                            this.$message.success('删除成功');
                        } else {
                            this.$message.error(
                                '没有删除成功,请联系地图后台管理员.'
                            );
                        }
                    } else {
                        // alert(xhr.statusText);
                    }
                };
            },
            // 点击进入删除建筑物的状态
            handleDeleteBuildingClick() {
                this.$router.push(
                    `/mappage/projectOverview/index?deleteEditFlag=1`
                );
            },
            handleAddBuildingClick() {
                let drawedFeature: Feature<Geometry>;
                // 创建用于新绘制feature的layer
                let drawLayer = new VectorLayer({
                    source: new VectorSource(),
                    style: new Style({
                        stroke: new Stroke({
                            color: 'blue',
                            width: 5,
                        }),
                    }),
                });
                // 添加绘制新图形的interaction，用于添加新的线条
                const source = drawLayer.getSource();
                if (!source) return;
                let drawInteraction = new Draw({
                    condition: primaryAction,
                    type: 'MultiPolygon', // 设定为线条
                    source,
                });

                // 3秒后，自动刷新页面上的feature
                const clearDrawed = () => {
                    drawLayer?.getSource()?.clear();
                    const layers = map?.getLayersByProperty('flag', 'building');
                    layers?.forEach((layer) => layer?.getSource()?.refresh());
                    if (drawedFeature) {
                        drawLayer?.getSource()?.clear();
                    }
                };
                if (!map) return;

                map.getViewport().oncontextmenu = (e) => {
                    drawInteraction.finishDrawing();
                };
                const cancelAddingBuilding = () => {
                    // 取消勾选新增复选框时，移出绘制的Interaction，删除已经绘制的feature
                    map?.removeInteraction(drawInteraction);
                    if (drawedFeature) {
                        drawLayer?.getSource()?.clear();
                    }
                    this.addingBuilding = false;
                    this.notify2?.close();
                    this.notify2 = null;
                };
                if (this.addingBuilding) {
                    //再次点击时若在状态则退出
                    cancelAddingBuilding();
                } else {
                    this.notify2 = this.$notify({
                        title: '',
                        duration: 0,
                        offset: 100,
                        showClose: false,
                        dangerouslyUseHTMLString: true,
                        message: `<a style="cursor:pointer;">(点我退出新增建筑状态)</a>`,
                        onClick: () => {
                            cancelAddingBuilding();
                        },
                    });
                    this.$on('hook:beforeDestroy', () => {
                        this.notify2?.close();
                        this.notify2 = null;
                    });

                    // 绘制结束时暂存绘制的feature
                    drawInteraction.on('drawend', (e) => {
                        drawedFeature = e.feature;

                        if (
                            drawedFeature
                                ?.getGeometry()
                                ?.getPolygons()[0]
                                ?.getCoordinates()[0]?.length <= 3
                        ) {
                            clearDrawed();
                            return;
                        }

                        // 保存新绘制的feature
                        // 转换坐标
                        let geometry = drawedFeature?.getGeometry()?.clone();
                        // 设置feature对应的属性，这些属性是根据数据源的字段来设置的
                        let newFeature = new Feature();
                        newFeature.setGeometryName('geom');
                        const measureNum = prompt('请输入测绘编号');
                        const fea = getBuildingFeaByMeasureNum(measureNum, map);
                        if (!measureNum || fea) {
                            if (fea)
                                this.$message.error(
                                    '该测绘编号对应的建筑物要素已存在'
                                );
                            return;
                        }
                        newFeature.set('测绘编号', measureNum);
                        newFeature.set('fwbh', measureNum);
                        newFeature.setGeometry(geometry);

                        this.addWfs(newFeature, measureNum);

                        const timer1 = setTimeout(() => {
                            map.removeInteraction(drawInteraction);
                            clearDrawed();
                            clearTimeout(timer1);
                        }, 2000);
                    });

                    // 勾选新增复选框时，添加绘制的Interaction
                    map.removeInteraction(drawInteraction);
                    map.addInteraction(drawInteraction);
                    this.addingBuilding = true;
                }
            },
            handleCompareMapClick() {
                const $store = useMapStore();
                $store.CHANGE_MAP_STATE({
                    key: 'showCompareMap',
                    value: true,
                });
            },
            handleDrawLayerClick() {
                const $store = useMapStore();
                $store.CHANGE_MAP_STATE({
                    key: 'drawingPolygon',
                    value: true,
                });
            },
            handle2DMeasureClick() {
                const $store = useMapStore();
                $store.CHANGE_MAP_STATE({
                    key: 'measuring',
                    value: true,
                });
            },
            handle3DFlyPathClick() {
                const $store = useMapStore();
                $store.CHANGE_MAP_STATE({
                    key: 'showFlyPathPanel',
                    value: !this.showFlyPathPanel,
                });
            },
            handleAnnotationsClick() {
                if ((this.$parent as any)?.is3D) {
                    const measureNumAnnotations = viewer.measureNumAnnotations;
                    // Toggle the show property of every label in the collection
                    let len = measureNumAnnotations.length;
                    for (let i = 0; i < len; ++i) {
                        let l = measureNumAnnotations.get(i);
                        l.show = !l.show;
                    }
                    viewer.scene.requestRender();
                } else {
                    const layers = map?.getLayersByProperty('flag', 'building');
                    this.fwbzFlag = !this.fwbzFlag;
                    layers?.forEach((layer) =>
                        layer.setStyle((fea) => {
                            if (this.fwbzFlag) {
                                return getFWStyleFunc(fea as Feature<Geometry>);
                            } else {
                                return getNoneTextFWStyleFunc(
                                    fea as Feature<Geometry>
                                );
                            }
                        })
                    );
                }
            },
            handleWallDisplayClick() {
                const $store = useMapStore();
                $store.CHANGE_MAP_STATE({
                    key: 'isWallDisplay',
                    value: !this.isWallDisplay,
                });
            },
            handle3DMeasureClick() {
                (
                    document.getElementById('measure-toolbar') as HTMLElement
                ).style.display = 'block';
                const $store = useMapStore();
                $store.CHANGE_MAP_STATE({
                    key: 'isShow3DMeasure',
                    value: true,
                });
            },
            // 显示对比统计的方法
            handleCountClick(id) {
                this.$emit('statistics', id);
            },
        },
    });
</script>
<style lang="scss" scoped>
    .tool-box {
        .dropdown-button {
            display: flex;
            align-items: center;
            padding: 10px 12px;
            font-size: 14px;
            color: #606266;
            cursor: pointer;
            span {
                margin-left: 6px;
            }
        }
    }
</style>
