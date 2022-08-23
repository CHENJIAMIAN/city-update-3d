<template>
    <div>
        <el-drawer
            class="drawer"
            custom-class="custom-drawer"
            :style="{
                left: drawerLeft,
                height: '400px',
                transform: isCollapse ? 'translateY(66%)' : '',
            }"
            direction="btt"
            size="400px"
            :visible.sync="isShow"
            :modal="false"
            :wrapperClosable="false"
            :with-header="false"
        >
            <div class="drawer-con">
                <el-form :inline="true" :model="forms" size="small">
                    <el-form-item v-if="typeId == 1">
                        <el-select
                            v-model="forms.buildingValue"
                            placeholder="请选中统计维度"
                            @change="buildingChange"
                        >
                            <el-option
                                v-for="item in buildingOption"
                                :key="item.id"
                                :label="item.name"
                                :value="item.id"
                            />
                        </el-select>
                    </el-form-item>
                    <el-form-item v-if="typeId == 9">
                        <el-select
                            v-model="forms.overlappingValue"
                            placeholder="请选中统计维度"
                            @change="overlappingChange"
                        >
                            <el-option
                                v-for="item in overlappingOption"
                                :key="item.id"
                                :label="item.name"
                                :value="item.id"
                            />
                        </el-select>
                    </el-form-item>
                    <el-form-item>
                        <el-select v-model="forms.displayType">
                            <el-option label="图表展示" :value="1" />
                            <el-option label="表格展示" :value="2" />
                        </el-select>
                    </el-form-item>
                    <el-form-item>
                        <el-button
                            v-if="forms.displayType == 1"
                            type="primary"
                            plain
                            round
                            @click="downloadImg"
                        >
                            导出统计图表
                        </el-button>
                        <el-button
                            type="primary"
                            plain
                            round
                            @click="exportExcel"
                        >
                            导出统计数据
                        </el-button>
                        <el-button
                            type="primary"
                            :disabled="measuring"
                            :title="measuring ? '请先退出测量工具' : ''"
                            plain
                            round
                            @click="handleDrawFilterRegionClick"
                        >
                            {{ isDrawing ? '退出' : '' }}范围划取
                        </el-button>
                    </el-form-item>
                </el-form>
                <div class="type-button" v-if="typeId > 2 && typeId < 9">
                    <el-button
                        :type="typeValue == 1 ? 'primary' : ''"
                        size="mini"
                        @click="buttonChange(typeId, 1)"
                    >
                        按社别
                    </el-button>
                    <el-button
                        :type="typeValue == 2 ? 'primary' : ''"
                        size="mini"
                        @click="buttonChange(typeId, 2)"
                    >
                        按月份
                    </el-button>
                </div>
                <span
                    class="drawer-collapse el-icon-d-arrow-right"
                    :style="{
                        transform: isCollapse
                            ? 'rotate(-90deg)'
                            : 'rotate(90deg)',
                    }"
                    @click="isCollapse = !isCollapse"
                ></span>
                <span
                    class="drawer-close el-icon-close"
                    @click="$emit('update:isShow', false)"
                ></span>
                <el-row
                    :gutter="80"
                    class="imageDom"
                    v-if="forms.displayType == 1"
                >
                    <template v-if="typeId == 1">
                        <el-col :span="16"></el-col>
                        <el-col :span="8"></el-col>
                    </template>
                    <template v-else-if="typeId == 2">
                        <el-col :span="24"></el-col>
                    </template>
                    <template v-else-if="typeId > 2 && typeId < 9">
                        <el-col :span="24"></el-col>
                    </template>
                    <template v-else-if="typeId == 9">
                        <el-col :span="24"></el-col>
                    </template>
                </el-row>
                <div v-else class="table-box">
                    <el-table
                        border
                        show-summary
                        :summary-method="
                            (param:any) => {
                                return getSummaries(param, 1);
                            }
                        "
                        :data="buildingPie.seriesdata"
                        size="small"
                        v-if="typeId == 1"
                    >
                        <el-table-column
                            prop="name"
                            :label="buildingTableName"
                        />
                        <el-table-column
                            prop="value"
                            label="建筑物数量（栋）"
                        />
                        <el-table-column prop="rate" label="占比" />
                    </el-table>
                    <el-table
                        border
                        show-summary
                        :data="groundTable"
                        :summary-method="
                            (param:any) => {
                                return getSummaries(param, 1);
                            }
                        "
                        size="small"
                        v-if="typeId == 2"
                    >
                        <el-table-column prop="name" label="地块" />
                        <el-table-column
                            prop="value"
                            label="建筑物数量（栋）"
                        />
                        <el-table-column prop="rate" label="占比" />
                    </el-table>
                    <el-table
                        border
                        show-summary
                        :data="aspirationTable"
                        :summary-method="
                            (param:any) => {
                                return getSummaries(param, 3);
                            }
                        "
                        size="small"
                        v-if="typeId == 3"
                    >
                        <el-table-column
                            prop="name"
                            :label="typeValue == 1 ? '社别' : '月份'"
                        />
                        <el-table-column
                            prop="support"
                            label="支持数量（人数）"
                        />
                        <el-table-column
                            prop="nonSupport"
                            label="不支持数量（人数）"
                        />
                        <el-table-column
                            prop="lookOn"
                            label="观望数量（人数）"
                        />
                        <el-table-column
                            prop="supportRate"
                            label="支持百分比"
                        />
                        <el-table-column
                            prop="nonSupportRate"
                            label="不支持百分比"
                        />
                        <el-table-column prop="lookOnRate" label="观望百分比" />
                    </el-table>
                    <el-table
                        border
                        show-summary
                        :data="authentificationTable"
                        :summary-method="
                            (param:any) => {
                                return getSummaries(param, 2);
                            }
                        "
                        size="small"
                        v-if="typeId == 4"
                    >
                        <el-table-column
                            prop="name"
                            :label="typeValue == 1 ? '社别' : '月份'"
                        />
                        <el-table-column
                            prop="yesVal"
                            label="已确权数量（栋）"
                        />
                        <el-table-column
                            prop="noVal"
                            label="未确权数量（栋）"
                        />
                        <el-table-column prop="yesRate" label="已确权百分比" />
                        <el-table-column prop="noRate" label="未确权百分比" />
                    </el-table>
                    <el-table
                        border
                        show-summary
                        :data="measureTable"
                        :summary-method="
                            (param:any) => {
                                return getSummaries(param, 2);
                            }
                        "
                        size="small"
                        v-if="typeId == 5"
                    >
                        <el-table-column
                            prop="name"
                            :label="typeValue == 1 ? '社别' : '月份'"
                        />
                        <el-table-column
                            prop="yesVal"
                            label="已测绘数量（栋）"
                        />
                        <el-table-column
                            prop="noVal"
                            label="未测绘数量（栋）"
                        />
                        <el-table-column prop="yesRate" label="已测绘百分比" />
                        <el-table-column prop="noRate" label="未测绘百分比" />
                    </el-table>
                    <el-table
                        border
                        show-summary
                        :data="dismantleTable"
                        :summary-method="
                            (param:any) => {
                                return getSummaries(param, 2);
                            }
                        "
                        size="small"
                        v-if="typeId == 6"
                    >
                        <el-table-column
                            prop="name"
                            :label="typeValue == 1 ? '社别' : '月份'"
                        />
                        <el-table-column
                            prop="yesVal"
                            label="已拆除数量（栋）"
                        />
                        <el-table-column
                            prop="noVal"
                            label="未拆除数量（栋）"
                        />
                        <el-table-column prop="yesRate" label="已拆除百分比" />
                        <el-table-column prop="noRate" label="未拆除百分比" />
                    </el-table>
                    <el-table
                        border
                        show-summary
                        :data="rightCancelTable"
                        :summary-method="
                            (param:any) => {
                                return getSummaries(param, 2);
                            }
                        "
                        size="small"
                        v-if="typeId == 7"
                    >
                        <el-table-column
                            prop="name"
                            :label="typeValue == 1 ? '社别' : '月份'"
                        />
                        <el-table-column
                            prop="yesVal"
                            label="已产权注销数量（栋）"
                        />
                        <el-table-column
                            prop="noVal"
                            label="未产权注销数量（栋）"
                        />
                        <el-table-column
                            prop="yesRate"
                            label="已产权注销百分比"
                        />
                        <el-table-column
                            prop="noRate"
                            label="未产权注销百分比"
                        />
                    </el-table>
                    <el-table
                        border
                        show-summary
                        :data="recvHouseTable"
                        :summary-method="
                            (param:any) => {
                                return getSummaries(param, 2);
                            }
                        "
                        size="small"
                        v-if="typeId == 8"
                    >
                        <el-table-column
                            prop="name"
                            :label="typeValue == 1 ? '社别' : '月份'"
                        />
                        <el-table-column
                            prop="yesVal"
                            label="已收房数量（栋）"
                        />
                        <el-table-column
                            prop="noVal"
                            label="未收房数量（栋）"
                        />
                        <el-table-column prop="yesRate" label="已收房百分比" />
                        <el-table-column prop="noRate" label="未收房百分比" />
                    </el-table>
                    <el-table
                        border
                        show-summary
                        :data="overlappingTable"
                        :summary-method="
                            (param:any) => {
                                return getSummaries(param,0);
                            }
                        "
                        size="small"
                        v-if="typeId == 9"
                    >
                        <el-table-column
                            v-if="forms.overlappingValue == 1"
                            prop="floor"
                            label="房屋层数"
                        />
                        <el-table-column
                            v-else-if="forms.overlappingValue == 2"
                            prop="community"
                            label="房屋社别"
                        />
                        <el-table-column
                            v-else-if="forms.overlappingValue == 3"
                            prop="houseStructure"
                            label="房屋结构"
                        />
                        <el-table-column
                            v-else-if="forms.overlappingValue == 4"
                            prop="ownershipProperty"
                            label="权属性质"
                        />
                        <el-table-column
                            prop="sumHouseBattlegroundAred"
                            label="实际占地面积（万/平方米）"
                        />
                        <el-table-column
                            prop="sumHouseBaseAred"
                            label="实际建基面积（万/平方米）"
                        />
                        <el-table-column
                            prop="sumHouseBuildingAred"
                            label="实际建筑面积（万/平方米）"
                        />
                        <el-table-column
                            prop="sumBuilding"
                            label="实际房屋数量（栋）"
                        />
                    </el-table>
                </div>
            </div>
        </el-drawer>
    </div>
</template>

<script lang="ts">
    import { mapState } from 'pinia';
    import { useMapStore } from '@/stores';
    import { Draw, Select, Modify } from 'ol/interaction';
    import type { Interaction } from 'ol/interaction';
    import { getArea, getLength } from 'ol/sphere';
    import { LineString, Polygon } from 'ol/geom';
    import { map } from '@/views/map/index.vue';

    import { primaryAction } from 'ol/events/condition';
    import { unByKey } from 'ol/Observable';
    import { Vector as VectorLayer } from 'ol/layer';
    import { Vector as VectorSource } from 'ol/source';
    import * as turf from '@turf/turf';
    import GeoJSON from 'ol/format/GeoJSON';

    import html2canvas from 'html2canvas';
    import Overlay from 'ol/Overlay';
    import { defineComponent } from 'vue';
    import type Feature from 'ol/Feature';

    export default defineComponent({
        components: {},
        props: {
            typeId: {
                // 1建筑物数据  2地块  3意愿征集  4确权  5测绘丈量  6拆除  7产权注销   8收房管理
                required: true,
                type: [String, Number],
            },
            isShow: {
                required: true,
                type: Boolean,
            },
        },
        data() {
            let select: any | undefined;
            let drawLInteraction: Interaction | undefined;
            let modifyLInteraction: Interaction | undefined;
            return {
                drawLInteraction,
                modifyLInteraction,
                select,
                isCollapse: false,
                isDrawing: false,
                typeValue: 0,
                measureNums: [],
                protocolNums: [],
                // 建筑物统计下拉数据
                buildingOption: [
                    { id: 1, name: '社别统计分析' },
                    { id: 2, name: '层数统计分析' },
                    { id: 3, name: '权属性质统计分析' },
                    { id: 4, name: '房屋结构统计分析' },
                    { id: 5, name: '是否有权属证件' },
                ],
                // 交叉统计下拉数据
                overlappingOption: [
                    { id: 1, name: '房屋层数' },
                    { id: 2, name: '房屋社别' },
                    { id: 3, name: '房屋结构' },
                    { id: 4, name: '权属性质' },
                ],
                drawerLeft: '',
                forms: {
                    buildingValue: 1,
                    overlappingValue: 1,
                    displayType: 1, // 1图表  2表格
                },
                //建筑物统计柱状图数据
                buildingBar: {
                    title: '',
                    xData: [],
                    series: [
                        {
                            name: '',
                            type: 'bar',
                            barWidth: '30%',
                            data: [],
                            label: {
                                show: true,
                            },
                        },
                    ],
                },
                //建筑物统计饼图数据
                buildingPie: {
                    seriesdata: [],
                },
                //地块统计饼图数据
                groundBar: {
                    title: '地块数据统计',
                    xData: [],
                    series: [
                        {
                            name: '建筑物数量',
                            type: 'bar',
                            barWidth: '30%',
                            data: [],
                            label: {
                                show: true,
                            },
                        },
                    ],
                },
                // 意愿征集/确权/测绘丈量/拆除/产权注销/收房等柱状图数据
                businessData: {
                    title: '',
                    xAxis: [
                        {
                            type: 'category',
                            data: [],
                        },
                    ],
                    yAxis: [
                        {
                            type: 'value',
                            name: '建筑物数量（栋）',
                            splitArea: false,
                            splitLine: { show: false },
                            axisTick: { show: false },
                        },
                        {
                            type: 'value',
                            name: '百分比',
                            splitArea: false,
                            splitLine: { show: false },
                            axisTick: { show: false },
                            min: 0,
                            max: 100,
                            interval: 10,
                            axisLabel: {
                                formatter: '{value} %',
                            },
                        },
                    ],
                    series: [],
                },
                // 交叉统计数据
                overlappingData: {
                    title: '房屋社别交叉统计数据',
                    xAxis: [
                        {
                            type: 'category',
                            data: [],
                        },
                    ],
                    yAxis: [
                        {
                            type: 'value',
                            name: '建筑物数量（栋）',
                            splitArea: false,
                            splitLine: { show: false },
                            axisTick: { show: false },
                        },
                        {
                            type: 'value',
                            name: '万/平方米',
                            splitArea: false,
                            splitLine: { show: false },
                            axisTick: { show: false },
                        },
                    ],
                    series: [],
                },
                // 各统计图表格数据
                buildingTableName: '',
                groundTable: [],
                aspirationTable: [],
                authentificationTable: [],
                measureTable: [],
                dismantleTable: [],
                rightCancelTable: [],
                recvHouseTable: [],
                overlappingTable: [],
            };
        },
        watch: {
            isShow(n, o) {
                // 隐藏
                if (!n) {
                    this.select?.setActive(true);
                    // 清除地图操作
                    this.exitDrawing();
                } else {
                    // 显示
                }
            },
            typeId: {
                immediate: true,
                handler() {
                    this.reRender();
                },
            },
        },
        computed: {
            ...mapState(useMapStore, {
                measuring: (state) => state.measuring, //获取子模块的
            }),
        },
        mounted() {},
        created() {},
        beforeDestroy() {
            this.select?.setActive(true);
            // 清除地图操作
            this.exitDrawing();
        },
        methods: {
            handleDrawFilterRegionClick() {
                if (this.measuring) {
                    return;
                }
                if (!this.isDrawing) {
                    this.select = map
                        .getInteractions()
                        .getArray()
                        .find(
                            (i) => i.getProperties().name === 'highlightSelect'
                        );
                    this.select.setActive(false);
                    this.initDrawLayer();
                    this.startDrawLayer();
                } else {
                    this.exitDrawing();
                    this.reRender();
                }
            },
            exitDrawing() {
                this.isDrawing = false;
                this.$store.commit('map/CHANGE_MAP_STATE', {
                    key: 'isDrawingRegion',
                    value: false,
                });
                this.measureNums = [];
                if (map) {
                    map.removeInteraction(this.drawLInteraction);
                    map.removeInteraction(this.modifyLInteraction);
                    this.drawS && this.drawS.clear();
                    map.removeLayer(this.drawL);
                    map.getViewport().oncontextmenu = null;
                    const {
                        helpTooltipOverLay,
                        pointerMoveMeasureTipHandler,
                        helpTooltipElement,
                    } = map;

                    map?.closerElements?.forEach((i) => {
                        i.parentNode && i.parentNode.removeChild(i);
                    });
                    map.closerElements = [];
                    map?.closerOverLays?.forEach((i) => {
                        map.removeOverlay(i);
                    });
                    map.closerOverLays = [];

                    helpTooltipOverLay && map.removeOverlay(helpTooltipOverLay);
                    pointerMoveMeasureTipHandler &&
                        map.un('pointermove', pointerMoveMeasureTipHandler);
                    helpTooltipElement?.parentNode?.removeChild(
                        helpTooltipElement
                    );
                }
            },
            reRender() {
                let typeId = this.typeId;
                this.typeValue = 1;
                if (typeId == 1) {
                    // 请求数据渲染建筑物图表
                    this.forms.buildingValue = 1;
                    this.getBuildingStat(this.forms.buildingValue);
                } else if (typeId == 2) {
                    // 请求数据渲染建筑物地块图表
                    this.typeValue = '';
                    this.getGroundStat();
                } else if (typeId == 3) {
                    // 请求数据渲染意愿征集图表
                    this.getAspirationStat(1);
                } else if (typeId == 4) {
                    // 请求数据渲染确权图表
                    this.getAuthentificationStat(1);
                } else if (typeId == 5) {
                    // 请求数据渲染测绘丈量图表
                    this.getMeasureStat(1);
                } else if (typeId == 6) {
                    // 请求数据渲染拆除图表
                    this.getDismantleStat(1);
                } else if (typeId == 7) {
                    // 请求数据渲染产权注销图表
                    this.getRightCancelStat(1);
                } else if (typeId == 8) {
                    // 请求数据渲染收房图表
                    this.getRecvHouseStat(1);
                } else if (typeId == 9) {
                    // 请求数据渲染交叉统计图表
                    this.getOverlappingStat(1);
                }
            },
            initDrawLayer() {
                this.isDrawing = true;
                this.$store.commit('map/CHANGE_MAP_STATE', {
                    key: 'isDrawingRegion',
                    value: true,
                });
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
                    map.getViewport().removeEventListener('mouseout', func);
                });

                // 绘制
                const draw = (this.drawLInteraction = new Draw({
                    condition: primaryAction,
                    source: drawS,
                    type: 'POLYGON',
                }));

                createHelpTooltip();

                let listener;
                draw.on('drawstart', (evt) => {
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
                        evt.feature.getGeometry().getLastCoordinate()
                    );
                    closerElement.onclick = (e) => {
                        this.drawS.removeFeature(evt.feature);
                        map.removeOverlay(closerOverLay);
                        this.$nextTick((_) => {
                            this.caculateInsectMeasureNumsAndReRender();
                        });
                    };
                    evt.feature.closerElement = closerElement;

                    sketchFea = null;
                    // 取消设置工具提示，以便可以创建一个新的
                    unByKey(listener);

                    this.$nextTick((_) => {
                        // 在异步的微任务里可以获取到图形
                        this.caculateInsectMeasureNumsAndReRender();
                    });
                });

                // 修改
                const modify = (this.modifyLInteraction = new Modify({
                    source: drawS,
                }));
                modify.on('modifyend', (evt) => {
                    this.caculateInsectMeasureNumsAndReRender();
                });

                map.getViewport().oncontextmenu = (e) => {
                    if (!sketchFea) return;
                    const ponintNum = sketchFea
                        .getGeometry()
                        .getCoordinates()[0]
                        .slice(0, -2).length;
                    // 右键, 2个点, 退出
                    if (ponintNum <= 2) {
                        if (drawS.getFeatures().length < 1) {
                            this.exitDrawing();
                            this.initDrawLayer();
                            this.startDrawLayer();
                            this.reRender();
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
                map.addInteraction(this.drawLInteraction);
                map.addInteraction(this.modifyLInteraction);
            },
            caculateInsectMeasureNumsAndReRender() {
                this.measureNums = [];
                const drawLfeas = this.drawL.getSource().getFeatures();
                const gson = new GeoJSON().writeFeatures(drawLfeas, {
                    featureProjection: 'EPSG:3857', // 3857(单位米),设置后返回的是经纬度
                });
                // 获取相交的建筑物的 测绘编号和档案编号 protocolNums: [], measureNums: [],
                const buidingLs = map.getLayersByProperty('flag', 'building');
                if (buidingLs.length < 1) {
                    this.$message.error(
                        '未找到建筑物图层,无法获得自建地块下的建筑物信息'
                    );
                    return;
                }
                const buidingLfeas = [];
                buidingLs.forEach((buidingL) =>
                    buidingLfeas.push(...buidingL.getSource().getFeatures())
                );
                const format = new GeoJSON();
                drawLfeas.forEach((drawLfea) => {
                    const drawLfeaTurfPolygon =
                        format.writeFeatureObject(drawLfea); // convert to a turf.js feature
                    buidingLfeas.forEach((buidingLfea) => {
                        let buidingLfeaTurfPolygon;
                        if (
                            buidingLfea.getGeometry().getType() ===
                            'MultiPolygon'
                        ) {
                            buidingLfeaTurfPolygon = format.writeGeometryObject(
                                buidingLfea.getGeometry().getPolygon(0)
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
                            // getMeasureAndProtocolNumsByFWBH 根据fwbh(房屋编号) (也是测绘编号?也是房屋编号? 未知)列表获取测绘id的列表和档案编号列表
                            // 请求:{fwbhs:["HQ234","HQ456"]}
                            // 返回{data:{measureNums:["HQ234的测绘编号","HQ456的测绘编号"], protocolNums:["HQ234的档案编号","HQ234的档案编号"]}}
                            const { fwbh, 测绘编号, protocolNum } =
                                buidingLfea.getProperties();
                            const measureNum = fwbh || 测绘编号;
                            // console.log(buidingLfea.getProperties())
                            !this.measureNums.includes(measureNum) &&
                                this.measureNums.push(measureNum);
                            // !this.protocolNums.includes(protocolNum) &&
                            //   this.protocolNums.push(protocolNum);
                            // console.log(this.protocolNums)
                        }
                    });
                });
                this.reRender();
            },
            // 导出统计图表（图片）
            downloadImg() {
                var imageDom = document.querySelector('.imageDom');
                html2canvas(imageDom).then((canvas) => {
                    // 转成图片，生成base64图片
                    var imgUrl = canvas.toDataURL('image/png');
                    // 下载图片
                    var eleLink = document.createElement('a');
                    eleLink.href = imgUrl;
                    eleLink.download = '统计图';
                    document.body.appendChild(eleLink);
                    eleLink.click();
                    document.body.removeChild(eleLink);
                });
            },
            // 建筑物下拉选中
            buildingChange(val) {
                this.typeValue = val;
                this.getBuildingStat(val);
            },
            // 交叉统计下拉选种
            overlappingChange(val) {
                this.typeValue = val;
                this.getOverlappingStat(val);
            },
            buttonChange(typeId, val) {
                this.typeValue = val;
                if (typeId == 3) {
                    this.getAspirationStat(val);
                } else if (typeId == 4) {
                    this.getAuthentificationStat(val);
                } else if (typeId == 5) {
                    this.getMeasureStat(val);
                } else if (typeId == 6) {
                    this.getDismantleStat(val);
                } else if (typeId == 7) {
                    this.getRightCancelStat(val);
                } else if (typeId == 8) {
                    this.getRecvHouseStat(val);
                }
            },
            // 建筑物数据统计
            getBuildingStat(type) {
                let arr = [
                    '社别',
                    '层数',
                    '权属性质',
                    '房屋结构',
                    '是否有权属证件',
                ];
                this.buildingTableName = arr[type - 1];

                getBuildingStat({
                    type: type,
                    measureNums: this.measureNums,
                }).then((res) => {
                    let xData = [];
                    let seriesdata = [];
                    res.data.forEach((item) => {
                        xData.push(item.name);
                        seriesdata.push(item.value);
                    });
                    this.buildingOption.forEach((item) => {
                        if (type == item.id) {
                            this.buildingBar.title = item.name;
                        }
                    });
                    this.buildingBar.xData = xData;
                    this.buildingBar.series[0].name = '建筑物数量';
                    this.buildingBar.series[0].data = seriesdata;
                    this.buildingPie.seriesdata = res.data;
                });
            },
            // 地块数据统计
            getGroundStat() {
                getGroundStat({
                    measureNums: this.measureNums,
                }).then((res) => {
                    this.groundBar.xData = res.data.name;
                    this.groundBar.series[0].data = res.data.value;
                    this.groundTable = res.data.dataList;
                });
            },
            // 意愿征集数据统计
            getAspirationStat(type) {
                getAspirationStat({
                    type: type,
                    measureNums: this.measureNums,
                }).then((res) => {
                    this.businessData.title = '意愿征集数据统计';
                    this.businessData.xAxis[0].data = res.data.name;
                    this.aspirationTable = res.data.dataList;
                    this.businessData.series = [
                        {
                            name: '支持百分比',
                            type: 'bar',
                            stack: '百分比',
                            label: {
                                show: true,
                            },
                            barWidth: '30%',
                            yAxisIndex: 1,
                            data: res.data.supportRate,
                        },
                        {
                            name: '不支持百分比',
                            type: 'bar',
                            stack: '百分比',
                            label: {
                                show: true,
                            },
                            yAxisIndex: 1,
                            data: res.data.nonSupportRate,
                        },
                        {
                            name: '观望百分比',
                            type: 'bar',
                            stack: '百分比',
                            label: {
                                show: true,
                            },
                            yAxisIndex: 1,
                            data: res.data.lookOnRate,
                        },
                        {
                            name: '支持数量',
                            type: 'line',
                            data: res.data.support,
                        },
                        {
                            name: '不支持数量',
                            type: 'line',
                            data: res.data.nonSupport,
                        },
                        {
                            name: '观望数量',
                            type: 'line',
                            data: res.data.lookOn,
                        },
                    ];
                });
            },
            // 确权数据统计
            getAuthentificationStat(type) {
                getAuthentificationStat({
                    type: type,
                    measureNums: this.measureNums,
                }).then((res) => {
                    this.businessData.title = '确权数据统计';
                    this.businessData.xAxis[0].data = res.data.name;
                    this.authentificationTable = res.data.dataList;
                    this.businessData.series = [
                        {
                            name: '已确权百分比',
                            type: 'bar',
                            stack: '百分比',
                            label: {
                                show: true,
                            },
                            barWidth: '30%',
                            yAxisIndex: 1,
                            data: res.data.yesRate,
                        },
                        {
                            name: '未确权百分比',
                            type: 'bar',
                            stack: '百分比',
                            label: {
                                show: true,
                            },
                            yAxisIndex: 1,
                            data: res.data.noRate,
                        },
                        {
                            name: '已确权数量',
                            type: 'line',
                            data: res.data.yesVal,
                        },
                        {
                            name: '未确权数量',
                            type: 'line',
                            data: res.data.noVal,
                        },
                    ];
                });
            },
            // 测绘丈量数据统计
            getMeasureStat(type) {
                getMeasureStat({
                    type: type,
                    measureNums: this.measureNums,
                }).then((res) => {
                    this.businessData.title = '测绘丈量数据统计';
                    this.businessData.xAxis[0].data = res.data.name;
                    this.measureTable = res.data.dataList;
                    this.businessData.series = [
                        {
                            name: '已测绘百分比',
                            type: 'bar',
                            stack: '百分比',
                            label: {
                                show: true,
                            },
                            barWidth: '30%',
                            yAxisIndex: 1,
                            data: res.data.yesRate,
                        },
                        {
                            name: '未测绘百分比',
                            type: 'bar',
                            stack: '百分比',
                            label: {
                                show: true,
                            },
                            yAxisIndex: 1,
                            data: res.data.noRate,
                        },
                        {
                            name: '已测绘数量',
                            type: 'line',
                            data: res.data.yesVal,
                        },
                        {
                            name: '未测绘数量',
                            type: 'line',
                            data: res.data.noVal,
                        },
                    ];
                });
            },
            // 拆除数据统计
            getDismantleStat(type) {
                getDismantleStat({
                    type: type,
                    measureNums: this.measureNums,
                }).then((res) => {
                    this.businessData.title = '拆除数据统计';
                    this.businessData.xAxis[0].data = res.data.name;
                    this.dismantleTable = res.data.dataList;
                    this.businessData.series = [
                        {
                            name: '已拆除百分比',
                            type: 'bar',
                            stack: '百分比',
                            label: {
                                show: true,
                            },
                            barWidth: '30%',
                            yAxisIndex: 1,
                            data: res.data.yesRate,
                        },
                        {
                            name: '未拆除百分比',
                            type: 'bar',
                            stack: '百分比',
                            label: {
                                show: true,
                            },
                            yAxisIndex: 1,
                            data: res.data.noRate,
                        },
                        {
                            name: '已拆除数量',
                            type: 'line',
                            data: res.data.yesVal,
                        },
                        {
                            name: '未拆除数量',
                            type: 'line',
                            data: res.data.noVal,
                        },
                    ];
                });
            },
            // 产权注销数据统计
            getRightCancelStat(type) {
                getRightCancelStat({
                    type: type,
                    measureNums: this.measureNums,
                }).then((res) => {
                    this.businessData.title = '产权注销数据统计';
                    this.businessData.xAxis[0].data = res.data.name;
                    this.rightCancelTable = res.data.dataList;
                    this.businessData.series = [
                        {
                            name: '已产权注销百分比',
                            type: 'bar',
                            stack: '百分比',
                            label: {
                                show: true,
                            },
                            barWidth: '30%',
                            yAxisIndex: 1,
                            data: res.data.yesRate,
                        },
                        {
                            name: '未产权注销百分比',
                            type: 'bar',
                            stack: '百分比',
                            label: {
                                show: true,
                            },
                            yAxisIndex: 1,
                            data: res.data.noRate,
                        },
                        {
                            name: '已产权注销数量',
                            type: 'line',
                            data: res.data.yesVal,
                        },
                        {
                            name: '未产权注销数量',
                            type: 'line',
                            data: res.data.noVal,
                        },
                    ];
                });
            },
            // 收房数据统计
            getRecvHouseStat(type) {
                getRecvHouseStat({
                    type: type,
                    measureNums: this.measureNums,
                }).then((res) => {
                    this.businessData.title = '收房数据统计';
                    this.businessData.xAxis[0].data = res.data.name;
                    this.recvHouseTable = res.data.dataList;
                    this.businessData.series = [
                        {
                            name: '已收房百分比',
                            type: 'bar',
                            stack: '百分比',
                            label: {
                                show: true,
                            },
                            barWidth: '30%',
                            yAxisIndex: 1,
                            data: res.data.yesRate,
                        },
                        {
                            name: '未收房百分比',
                            type: 'bar',
                            stack: '百分比',
                            label: {
                                show: true,
                            },
                            yAxisIndex: 1,
                            data: res.data.noRate,
                        },
                        {
                            name: '已收房数量',
                            type: 'line',
                            data: res.data.yesVal,
                        },
                        {
                            name: '未收房数量',
                            type: 'line',
                            data: res.data.noVal,
                        },
                    ];
                });
            },
            // 交叉数据统计
            getOverlappingStat(type) {
                getOverlappingStat({
                    type: type,
                    measureNums: this.measureNums,
                }).then((res) => {
                    this.overlappingData.title = `${
                        this.overlappingOption[type - 1].name
                    }交叉统计数据`;
                    this.overlappingData.xAxis[0].data = res.data.name;
                    this.overlappingTable = res.data.buildingList;
                    this.overlappingData.series = [
                        {
                            name: '实际占地面积',
                            type: 'bar',
                            yAxisIndex: 1,
                            barGap: 0,
                            data: res.data.sumHouseBattlegroundAred,
                        },
                        {
                            name: '实际建基面积',
                            type: 'bar',
                            yAxisIndex: 1,
                            data: res.data.sumHouseBaseAred,
                        },
                        {
                            name: '实际建筑面积',
                            type: 'bar',
                            yAxisIndex: 1,
                            data: res.data.sumHouseBuildingAred,
                        },
                        {
                            name: '实际房屋数量',
                            type: 'line',
                            data: res.data.sumBuilding,
                        },
                    ];
                });
            },
            // 数据导出
            exportExcel() {
                this.$confirm('此操作将导出数据, 是否继续?', '提示', {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    type: 'warning',
                }).then(() => {
                    let data = {
                        method: this.typeId,
                        type: this.typeValue,
                        measureNums: this.measureNums,
                    };
                    businessStatisticsExcel(data).then((res) => {
                        this.$alert(res.msg, '提示');
                    });
                });
            },
            getSummaries(param: any, type: number) {
                const { columns, data } = param;
                const sums: string[] | number[] = [];
                columns.forEach((column, index) => {
                    if (index === 0) {
                        sums[index] = '合计';
                        return;
                    }

                    if (type === 1 && index === 2) {
                        sums[index] = '100%';
                    }

                    if (type === 2) {
                        let val: number = 0;
                        let sum = Number(sums[1]) + Number(sums[2]);
                        if (index === 3) val = Number(sums[1]) / sum;
                        else if (index === 4) val = Number(sums[2]) / sum;
                        sums[index] = (val * 100).toFixed(2) + '%';
                    }

                    if (type === 3) {
                        let val;
                        let sum = sums[1] + sums[2] + sums[3];
                        if (index === 4) val = sums[1] / sum;
                        else if (index === 5) val = sums[2] / sum;
                        else if (index === 6) val = sums[3] / sum;
                        sums[index] = (val * 100).toFixed(2) + '%';
                    }

                    const values = data.map((item) =>
                        Number(item[column.property])
                    );
                    if (!values.every((value) => isNaN(value))) {
                        sums[index] = values.reduce((prev, curr) => {
                            const value = Number(curr);
                            if (!isNaN(value)) {
                                return prev + curr;
                            } else {
                                return prev;
                            }
                        }, 0);
                    }
                });
                return sums;
            },
        },
    });
</script>

<style lang="scss" scoped>
    .drawer-close {
        position: absolute;
        top: 20px;
        right: 20px;
        font-size: 20px;
        font-weight: bold;
        cursor: pointer;
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
    .drawer {
        >>> .el-drawer {
            overflow: hidden;
        }
        >>> .custom-drawer {
            background-color: rgba(255, 255, 255, 0.8);
        }
        top: auto;
        transition: left, transform 0.28s;
        .drawer-con {
            padding: 20px;
            .el-col {
                height: 300px;
                overflow: hidden;
            }
        }
    }
    .type-button {
        position: absolute;
        top: 30px;
        right: 100px;
        z-index: 10;
    }
    .table-box {
        height: 310px;
        overflow: auto;
        background-color: #fff;
    }
</style>
