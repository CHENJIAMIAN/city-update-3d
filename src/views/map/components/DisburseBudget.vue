<template>
    <div style="padding: 2rem; position: relative">
        <slot name="collapser"></slot>
        <span
            class="drawer-close el-icon-close"
            @click="exitDrawing(), $emit('clickClose')"
        ></span>

        <div class="head">
            <div>
                <el-checkbox v-model="isDrawing">划取范围</el-checkbox>
            </div>

            <el-button
                type="primary"
                icon="el-icon-search"
                round
                @click="handleQuery"
            >
                查询
            </el-button>
            <el-button
                type="primary"
                icon="el-icon-refresh"
                round
                plain
                @click="$refs.form?.resetFields()"
            >
                重置
            </el-button>
        </div>

        <el-divider />

        <div class="form-container" v-loading="isLoading">
            <el-form
                ref="form2"
                :model="form2"
                label-width="120px"
                class="form2"
            >
                <el-form-item label="回迁面积">
                    <el-input disabled v-model="form2.standardArea"></el-input>
                </el-form-item>
                <el-form-item label="资金赔付">
                    <el-input
                        disabled
                        v-model="form2.compensateMoney"
                    ></el-input>
                </el-form-item>
                <el-form-item label="临迁费赔付">
                    <el-input
                        disabled
                        v-model="form2.relocationMoney"
                    ></el-input>
                </el-form-item>
                <el-form-item label="搬迁费赔付">
                    <el-input disabled v-model="form2.removalMoney"></el-input>
                </el-form-item>
                <el-form-item label="赎买总额">
                    <el-input disabled v-model="form2.redeemMoney"></el-input>
                </el-form-item>
                <el-form-item label="附属物补偿费用">
                    <el-input disabled v-model="form2.attachsMoney"></el-input>
                </el-form-item>
            </el-form>
        </div>
    </div>
</template>

<script lang="ts">
    import { Draw, Select, Modify, Interaction } from 'ol/interaction';
    import { getArea, getLength } from 'ol/sphere';
    import { LineString, Polygon } from 'ol/geom';
    import { map } from '@/views/map/index.vue';
    import { primaryAction } from 'ol/events/condition';
    import { unByKey } from 'ol/Observable';
    import { Vector as VectorLayer } from 'ol/layer';
    import { Vector as VectorSource } from 'ol/source';
    import * as turf from '@turf/turf';
    import GeoJSON from 'ol/format/GeoJSON';

    import Overlay from 'ol/Overlay';
    import { defineComponent } from 'vue';
    import type Feature from 'ol/Feature';

    import type { default as SelectInteraction } from 'ol/interaction/Select';
    import type BaseLayer from 'ol/layer/Base';

    export default defineComponent({
        data() {
            let select: SelectInteraction | undefined;
            let drawLInteraction: Interaction | undefined;
            let modifyLInteraction: Interaction | undefined;
            let drawS: VectorSource | undefined;
            let drawL: VectorLayer<VectorSource> | undefined;
            let measureNum: string[] = [];

            return {
                drawL,
                drawS,
                drawLInteraction,
                modifyLInteraction,
                select,
                isLoading: false,
                isDrawing: false,
                planOption: [],
                form1: {
                    measureNum,
                },
                form2: {},
            };
        },
        watch: {
            isDrawing(n, o) {
                if (!map) return;
                if (n) {
                    this.select = map
                        .getInteractions()
                        .getArray()
                        .find(
                            (i) => i.getProperties().name === 'highlightSelect'
                        ) as SelectInteraction;
                    this.select.setActive(false);
                    this.initDrawLayer();
                    this.startDrawLayer();
                } else {
                    this.exitDrawing();
                }
            },
        },
        mounted() {},
        methods: {
            handleQuery() {
                this.$message.success(`查询${this.form1.measureNum}的统计`);
            },
            exitDrawing() {
                this.form1.measureNum = [];
                if (!map) return;
                map.removeInteraction(this.drawLInteraction as Interaction);
                map.removeInteraction(this.modifyLInteraction as Interaction);
                this.drawS && this.drawS.clear();
                this.drawL &&
                    map.removeLayer(this.drawL as unknown as BaseLayer);
                map.getViewport().oncontextmenu = null;
                const {
                    helpTooltipOverLay,
                    pointerMoveMeasureTipHandler,
                    helpTooltipElement,
                } = map;

                map?.closerElements?.forEach((i: HTMLElement) => {
                    i.parentNode && i.parentNode.removeChild(i);
                });
                map.closerElements = [];
                map.closerOverLays?.forEach((i: Overlay) => {
                    map?.removeOverlay(i);
                });
                map.closerOverLays = [];

                helpTooltipOverLay && map.removeOverlay(helpTooltipOverLay);
                pointerMoveMeasureTipHandler &&
                    map.un('pointermove', pointerMoveMeasureTipHandler);
                helpTooltipElement?.parentNode?.removeChild(helpTooltipElement);
            },
            initDrawLayer() {
                if (!map) return;
                const drawS = (this.drawS = new VectorSource({ wrapX: false }));
                const vector = (this.drawL = new VectorLayer({
                    name: '自定义绘制图层',
                    source: drawS,
                }));
                map.addLayer(vector);

                let sketchFea: Feature;
                let helpTooltipElement: HTMLElement;
                let helpTooltipOverLay: Overlay;
                const continuePolygonMsg = '单击以继续绘制多边形,双击结束绘制';
                const formatArea = function (polygon) {
                    const area = getArea(polygon);
                    let output;
                    if (area > 10000) {
                        output =
                            Math.round((area / 1000000) * 100) / 100 +
                            ' ' +
                            'km<sup>2</sup>';
                    } else {
                        output =
                            Math.round(area * 100) / 100 +
                            ' ' +
                            'm<sup>2</sup>';
                    }
                    return output;
                };
                // 提示"点击开始绘图"
                function createHelpTooltip() {
                    if (!map) return;
                    if (helpTooltipElement && helpTooltipElement.parentNode) {
                        helpTooltipElement.parentNode.removeChild(
                            helpTooltipElement
                        );
                    }
                    helpTooltipElement = document.createElement('div');
                    map.helpTooltipElement = helpTooltipElement;
                    helpTooltipElement.className = 'ol-tooltip hidden';
                    helpTooltipOverLay = new Overlay({
                        element: helpTooltipElement,
                        offset: [15, 0],
                        positioning: 'center-left',
                    });
                    map.helpTooltipOverLay = helpTooltipOverLay;
                    map.addOverlay(helpTooltipOverLay);
                }

                // 添加鼠标移动时的提示
                const pointerMoveMeasureTipHandler = function (evt) {
                    if (evt.dragging) {
                        return;
                    }
                    let helpMsg = '点击开始绘图';

                    if (sketchFea) {
                        const geom = sketchFea.getGeometry();
                        if (geom instanceof Polygon) {
                            helpMsg = continuePolygonMsg;
                        }
                    }

                    helpTooltipElement.innerHTML = helpMsg;
                    helpTooltipOverLay.setPosition(evt.coordinate);

                    helpTooltipElement.classList.remove('hidden');
                };
                map.pointerMoveMeasureTipHandler = pointerMoveMeasureTipHandler;
                map.on('pointermove', pointerMoveMeasureTipHandler);

                const func = () => {
                    helpTooltipElement.classList.add('hidden');
                };
                map.getViewport().addEventListener('mouseout', func);
                // 销毁事件
                this.$on('hook:beforeDestroy', () => {
                    if (!map) return;
                    map.getViewport().removeEventListener('mouseout', func);
                });

                // 绘制
                const draw = (this.drawLInteraction = new Draw({
                    source: drawS,
                    type: 'POLYGON',
                }));

                createHelpTooltip();

                let listener: import('ol/events.js').EventsKey | undefined;
                draw.on('drawstart', function (evt) {
                    sketchFea = evt.feature;
                    let tooltipCoord = evt.coordinate;
                    listener = sketchFea
                        ?.getGeometry()
                        ?.on('change', function (evt) {
                            const geom = evt.target;
                            let output;
                            if (geom instanceof Polygon) {
                                output = formatArea(geom);
                                tooltipCoord = geom
                                    .getInteriorPoint()
                                    .getCoordinates();
                            }
                        });
                });
                draw.on('drawend', (evt) => {
                    if (!map) return;
                    const closerElement = document.createElement('div');
                    if (!map.closerElements) map.closerElements = [];
                    map.closerElements.push(closerElement);
                    closerElement.className = 'ol-tooltip hidden';
                    closerElement.style.cursor = 'pointer';
                    const closerOverLay = new Overlay({
                        element: closerElement,
                        offset: [15, 0],
                        positioning: 'center-left',
                    });
                    if (!map.closerOverLays) map.closerOverLays = [];
                    map.closerOverLays.push(closerOverLay);
                    map.addOverlay(closerOverLay);
                    closerElement.innerHTML = 'X';
                    closerOverLay.setPosition(
                        evt.feature?.getGeometry()?.getLastCoordinate()
                    );
                    closerElement.onclick = (e) => {
                        if (!map) return;
                        this?.drawS?.removeFeature(evt.feature);
                        map.removeOverlay(closerOverLay);
                        this.$nextTick((_) => {
                            this.saveDrawLayerGson();
                        });
                    };
                    evt.feature.closerElement = closerElement;

                    // 取消设置工具提示，以便可以创建一个新的
                    listener && unByKey(listener);

                    // const geom = evt.feature.getGeometry();
                    // const coordinates = geom.getCoordinates()[0];
                    // console.log("drawend");
                    // console.log(evt.feature.getGeometry().getCoordinates());
                    // 此刻获取不到刚绘制的图形
                    // this.saveDrawLayerGson();
                    this.$nextTick((_) => {
                        // 在异步的微任务里可以获取到图形
                        this.saveDrawLayerGson();
                    });
                });
                // 修改
                const modify = (this.modifyLInteraction = new Modify({
                    source: drawS,
                }));
                modify.on('modifyend', (evt) => {
                    // console.log("modifyend");
                    // console.log(
                    //   evt.features
                    //     .getArray()[0]
                    //     .getGeometry()
                    //     .getCoordinates()
                    // );
                    this.saveDrawLayerGson();
                });

                map.getViewport().oncontextmenu = (e) => {
                    if (!sketchFea) return;
                    const ponintNum = sketchFea
                        ?.getGeometry()
                        ?.getCoordinates()[0]
                        ?.slice(0, -2).length;
                    // 右键, 2个点, 退出
                    if (ponintNum <= 2) {
                        if (drawS.getFeatures().length < 1) {
                            this.exitDrawing();
                            this.initDrawLayer();
                            this.startDrawLayer();
                        } else {
                            draw.finishDrawing();
                            const fea = drawS.getFeatures().slice(-1)[0];
                            fea.closerElement.click();
                        }
                    }
                    // 多于2个点, 完成绘制
                    else {
                        draw.finishDrawing();
                    }
                };
            },
            // 开始地块标绘
            startDrawLayer() {
                if (!map) return;
                map.addInteraction(this.drawLInteraction as Interaction);
                map.addInteraction(this.modifyLInteraction as Interaction);
            },
            saveDrawLayerGson() {
                if (!map) return;
                const drawLfeas = this.drawL?.getSource()?.getFeatures();
                if (!drawLfeas) return;
                const gson = new GeoJSON().writeFeatures(drawLfeas, {
                    featureProjection: 'EPSG:3857', // 3857(单位米),设置后返回的是经纬度
                });
                // 获取相交的建筑物的 测绘编号和档案编号 protocolNums: [], form1.measureNum: [],
                const buidingLs = map.getLayersByProperty('flag', 'building');
                if (buidingLs.length < 1) {
                    this.$message.error(
                        '未找到建筑物图层,无法获得自建地块下的建筑物信息'
                    );
                    return;
                }
                const buidingLfeas: Feature[] = [];
                buidingLs.forEach((buidingL) =>
                    buidingLfeas.push(...buidingL.getSource().getFeatures())
                );
                const format = new GeoJSON();
                drawLfeas.forEach((drawLfea) => {
                    const drawLfeaTurfPolygon =
                        format.writeFeatureObject(drawLfea); // convert to a turf.js feature
                    buidingLfeas.forEach((buidingLfea) => {
                        const geometry = buidingLfea.getGeometry();
                        let buidingLfeaTurfPolygon;
                        if (geometry?.getType() === 'MultiPolygon') {
                            buidingLfeaTurfPolygon = format.writeGeometryObject(
                                geometry?.getPolygon(0)
                            );
                        } else {
                            buidingLfeaTurfPolygon =
                                format.writeFeatureObject(buidingLfea); // convert to a turf.js feature
                        }
                        const bool = turf.booleanContains(
                            //True if the second geometry is completely contained by the first geometry.
                            drawLfeaTurfPolygon,
                            buidingLfeaTurfPolygon
                        );
                        if (bool) {
                            const { fwbh, 测绘编号, protocolNum } =
                                buidingLfea.getProperties();
                            const measureNum: string = fwbh || 测绘编号;
                            !this.form1.measureNum.includes(measureNum) &&
                                this.form1.measureNum.push(measureNum);
                        }
                    });
                });
                console.log(this.form1.measureNum);
            },
        },
    });
</script>
<style lang="scss" scoped>
    .form-container {
        display: grid;
        grid-template-columns: 1fr 1fr;
        justify-content: center;
    }
    .drawer-collapse {
        position: absolute;
        top: 20px;
        right: 50px;
        font-size: 20px;
        font-weight: bold;
        cursor: pointer;
        transform: rotate(90deg);
        transition: transform 0.28s;
    }
    .form2 {
        display: grid;
        grid-template-columns: 1fr 1fr;
        border-left: solid darkgray;
    }
    .form1 {
        display: grid;
        grid-template-columns: 1fr;
        padding-right: 2rem;
    }
    .drawer-close {
        position: absolute;
        top: 20px;
        right: 20px;
        font-size: 20px;
        font-weight: bold;
        cursor: pointer;
    }
    .head {
        display: grid;
        grid-template-columns: auto auto auto;
        justify-content: start;
        align-items: center;
        padding: 0 3rem;
        gap: 1rem;
    }
</style>
