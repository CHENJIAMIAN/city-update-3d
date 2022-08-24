<template>
    <!--  <map-view
            ref="mapVue"
            :showOpenList="$route.name !== 'projectOverview'"
            @openList="drawerList.visible = true"
            @clickBuildingOnMap="openEdit"
        /> -->
    <div class="map-vue">
        <!-- 地图容器 -->
        <div class="olmap">
            <div class="two-olmap" v-show="!is3D" ref="twoMap">
                <div id="olmap">
                    <!-- 图层控件 -->
                    <layer-control
                        ref="layerControl"
                        v-show="
                            showLayerControl && showLayerControl2 && !asKanban
                        "
                        :type="levelType"
                        :baseLayers="baseLayers"
                        :grounds="grounds"
                    />
                    <!-- 自建图层 -->
                    <draw-polygon
                        style="margin-top: 100px"
                        v-if="drawingPolygon"
                    />
                    <!-- 测量面板 -->
                    <measure-panel v-if="measuring" />
                    <!-- 多选房屋详情列表 -->
                    <div
                        class="multi-selecteds-detail-panel"
                        v-show="multiSelectedProps.length"
                    >
                        <div>测绘编号</div>
                        <div>权利人名称</div>
                        <template v-for="prop in multiSelectedProps">
                            <div
                                :key="prop.measureNum"
                                style="cursor: pointer; color: dodgerblue"
                                @click.prevent="
                                    $emit('clickBuildingOnMap', prop.measureNum)
                                "
                            >
                                {{ prop.measureNum }}
                            </div>
                            <div>
                                {{ prop.rightPerson }}
                            </div>
                        </template>
                    </div>
                    <!-- 缩放级别 -->
                    <div
                        class="ol-zoom ol-unselectable ol-control ol-zoomlevel"
                        v-show="!asKanban"
                    >
                        <button
                            class="ol-zoom-in"
                            type="button"
                            title="缩放级别"
                        >
                            {{ zoomLevel }}
                        </button>
                    </div>
                    <!-- 中山总规图特别适配一个图例 -->
                    <div ref="tuli" class="tuli"></div>
                    <div id="measureOverlayContainer"></div>
                </div>
                <compare-map v-if="showCompareMap" />
            </div>

            <!-- 工具箱 -->
            <tool-box
                v-if="
                    levelType === 'project' &&
                    !showCompareMap &&
                    !asKanban &&
                    showToolBox
                "
                @statistics="toolboxStatistics"
                @showDisburseBudget="disburseBudgetDrawerList.visible = true"
                @toggleLayerControl="showLayerControl2 = !showLayerControl2"
            />

            <!-- 请输入测绘编号或房屋编号定位房屋 -->
            <el-select
                size="mini"
                v-if="!asKanban && showSearchBar && levelType === 'project'"
                style="
                    position: absolute;
                    z-index: 1;
                    right: 144px;
                    bottom: 70px;
                    width: 220px;
                "
                v-model="searchMeasureNumVal"
                clearable
                filterable
                remote
                placeholder="请输入测绘编号或房屋编号"
                :no-data-text="searchNoDataText"
                :remote-method="remoteSearchBuilding"
                @change="fitMapViewToBuildingByMeasureNum(searchMeasureNumVal)"
            >
                <el-option
                    v-for="(item, index) in searchOptions"
                    :key="index"
                    :value="item.measureNum || item.protocolNum"
                >
                    {{ `${item.measureNum}/${item.protocolNum}` }}
                </el-option>
            </el-select>

            <!-- cesium 3D 冒出点击了哪个建筑物 -->
            <CesiumMap
                ref="cesiumMap"
                v-show="is3D"
                :showFlyCesiumMap="showFlyCesiumMap"
                @clickBuildingOnCesiumMap="handleClickBuildingOnCesiumMap"
                v-bind="$attrs"
            ></CesiumMap>
        </div>

        <!-- 底部展开列表按钮 -->
        <el-button
            v-if="showOpenList"
            class="bottom-show-open-list-btn"
            type="primary"
            @click="$emit('openList')"
        >
            展开列表
        </el-button>

        <!-- 看板地图展示类型切换 -->
        <el-button
            size="mini"
            class="map-toggler"
            v-show="asKanban"
            @click="showMapType = !showMapType"
        >
            地图切换
        </el-button>
        <div
            class="map-type"
            v-show="showMapType && !showCompareMap && levelType === 'project'"
        >
            <div
                class="null"
                :class="{ active: maptype == '空图层' }"
                @click="mapChange('空图层')"
            >
                <span>空图层</span>
            </div>
            <div
                class="vector"
                :class="{ active: maptype == '矢量图层' }"
                @click="mapChange('矢量图层')"
            >
                <span>矢量图层</span>
            </div>
            <div
                class="portrait"
                :class="{ active: maptype == '影像图层' }"
                @click="mapChange('影像图层')"
            >
                <span>影像图层</span>
            </div>
            <!-- v-loading="isUnLockViewByExtent" -->
            <div
                class="aerial-photography"
                :class="{ active: maptype == '航拍实景' }"
                @click="mapChange('航拍实景')"
            >
                <span>航拍实景</span>
            </div>
            <div
                v-if="asKanban"
                class="aerial-photography"
                :class="{ active: maptype == '飞行漫游' }"
                @click="mapChange('飞行漫游')"
            >
                <span>飞行漫游</span>
            </div>
        </div>

        <!-- 右上角hover时弹出的项目信息框 -->
        <div class="proj-info" v-show="Object.keys(projInfo).length > 0">
            <div>项目名称</div>
            <div>{{ projInfo.projectName }}</div>
            <div>项目摘要</div>
            <div>{{ projInfo.projectDesc || '-' }}</div>
            <div>建筑物数量</div>
            <div>{{ projInfo.buildingCount }}</div>
            <div>户籍人口数量</div>
            <div>{{ projInfo.personCount }}</div>
            <div>建筑面积</div>
            <div>{{ projInfo.buildingArea || '-' + ' ㎡' }}</div>
            <div>建基面积</div>
            <div>{{ projInfo.baseArea || '-' + ' ㎡' }}</div>
            <div>占地面积</div>
            <div>{{ projInfo.battlegroundArea || '-' + ' ㎡' }}</div>
        </div>

        <!-- 对比统计组件 -->
        <!-- <projectChart :isShow.sync="showStatistics" :typeId="statisticsId" /> -->

        <!-- 拆赔预算 -->
        <el-drawer
            class="drawer"
            custom-class="custom-drawer"
            title="拆赔预算"
            style="top: 60%; transition: transform 0.28s"
            :style="{
                left: disburseBudgetDrawerList.leftVal,
                transform: isDisburseBudgetCollapse ? 'translateY(66%)' : '',
            }"
            direction="btt"
            size="100%"
            :withHeader="false"
            :modal="false"
            :close-on-press-escape="false"
            :wrapperClosable="false"
            :visible.sync="disburseBudgetDrawerList.visible"
        >
            <DisburseBudget
                @clickClose="disburseBudgetDrawerList.visible = false"
            >
                <span
                    slot="collapser"
                    class="drawer-collapse el-icon-d-arrow-right"
                    :style="{
                        transform: isDisburseBudgetCollapse
                            ? 'rotate(-90deg)'
                            : 'rotate(90deg)',
                    }"
                    @click="
                        isDisburseBudgetCollapse = !isDisburseBudgetCollapse
                    "
                ></span>
            </DisburseBudget>
        </el-drawer>
    </div>
</template>

<script lang="ts">
    import { mapState } from 'pinia';
    import { useMapStore } from '@/stores';
    import 'ol/ol.css';

    // import Map from 'ol/Map';
    import View from 'ol/View';
    import { platformModifierKeyOnly, click } from 'ol/events/condition';
    import {
        XYZ,
        Vector as VectorSource,
        ImageWMS,
        WMTS,
        TileWMS,
    } from 'ol/source';
    import { optionsFromCapabilities } from 'ol/source/WMTS';
    import { WMTSCapabilities, GeoJSON } from 'ol/format';
    import {
        Image as ImageLayer,
        Tile as TileLayer,
        Vector,
        Vector as VectorLayer,
        VectorImage,
    } from 'ol/layer';
    import { transform, fromLonLat } from 'ol/proj';

    import type Feature from 'ol/Feature';
    import type Collection from 'ol/Collection';
    import type { Geometry, SimpleGeometry } from 'ol/geom';
    import type { StyleFunction } from 'ol/style/Style';
    import type { default as SelectInteraction } from 'ol/interaction/Select';
    import type { Options as BaseTileOptions } from 'ol/layer/BaseTile';
    import type Event from 'ol/events/Event';

    import { Circle, Point } from 'ol/geom';
    import { Fill, Stroke, Style, Text, Icon } from 'ol/style';
    import { getCenter, containsExtent } from 'ol/extent';
    import { DragBox, Select } from 'ol/interaction';
    import Overlay from 'ol/Overlay';

    import ResizeObserver from 'resize-observer-polyfill';

    import { getFWSelectedStyleFunc } from '@/views/map/olmap-common';
    import { defaultBaseLayers } from '@/views/map/olmap-config';
    import { provinceAndCityData, CodeToText } from 'element-china-area-data';
    import {
        loadGSONToVecLayer,
        loadGSONToVecLayer2,
        getBuildingFeaByMeasureNum,
        lockViewByExtent,
    } from './olmap-utils';

    import {
        getGeoServerUrlByProjectId,
        fw_geojson,
        wmtsGetCapabilities,
    } from './mockdata';

    import DisburseBudget from '@/views/map/components/DisburseBudget.vue';
    // import projectChart from '@/views/chart/projectChart.vue';
    import MeasurePanel from './components/MeasurePanel.vue';
    import LayerControl from './components/LayerControl.vue';
    import DrawPolygon from './components/DrawPolygon.vue';
    import CompareMap from './components/CompareMap.vue';
    import ToolBox from './components/ToolBox.vue';
    import CesiumMap from './components/CesiumMap.vue';

    import { defineComponent } from 'vue';
    import type BaseEvent from 'ol/events/Event';
    import Map, { createMap } from '@/views/map/enhance-olmap';

    // 此处this为undefined
    // 不要放store里，不要被vue劫持，否则性能堪忧

    export let map: Map | undefined;

    export default defineComponent({
        props: {
            showOpenList: {
                type: Boolean,
                default: false,
            },
            asKanban: {
                type: Boolean,
                default: false,
            },
            showToolBox: {
                type: Boolean,
                default: true,
            },
            showLayerControl: {
                type: Boolean,
                default: true,
            },
            showSearchBar: {
                type: Boolean,
                default: true,
            },
        },
        components: {
            ToolBox,
            MeasurePanel,
            LayerControl,
            DrawPolygon,
            CompareMap,
            CesiumMap,
            // projectChart,
            DisburseBudget,
        },
        data() {
            this.zoomThatCanSelect = 17.465768204547796;

            let projectFeasProps: any[] = [];
            let multiSelectedProps: any[] = [];
            let searchOptions: any[] = [];
            let projInfo: any = {};
            let buildingLayers: VectorImage<VectorSource>[] | undefined;

            return {
                buildingLayers,
                is3D: false,
                projInfo,
                multiSelectedProps,
                projectFeasProps,
                isUnLockViewByExtent: true,
                //
                showLayerControl2: true,
                searchOptions,
                searchNoDataText: '',
                //
                isDisburseBudgetCollapse: false,
                showFlyCesiumMap: false,
                showMapType: true,
                disburseBudgetDrawerList: {
                    leftVal: '',
                    visible: false,
                },
                zoomLevel: 0,
                maptype: '影像图层',
                showStatistics: false, // 是否显示统计对比组件
                statisticsId: '', // 统计对比组件显示的内容
                // 地块对象列表,从api获取,传给LayerControl
                baseLayers: [],
                grounds: [],
                searchMeasureNumVal: '',
            };
        },
        watch: {
            asKanban: {
                immediate: true,
                handler(n: boolean) {
                    if (n) this.showMapType = false;
                },
            },
        },
        computed: {
            ...mapState(useMapStore, {
                measuring: (state) => state.measuring,
                drawingPolygon: (state) => state.drawingPolygon,
                showCompareMap: (state) => state.showCompareMap,
            }),
            levelType: {
                get() {
                    // levelType:"city",//"country" //"project"
                    if (
                        this.$route.path.includes('/mappage') ||
                        this.$route.path.includes('/kanban')
                    ) {
                        return 'project';
                    }
                    return 'country';
                },
                set() {},
            },
        },
        async mounted() {
            console.log('map/index mounted');

            window.mapvue = this;
            this.maptype;
            // 轮询直到获取到项目id,才去请求接口,很多接口需要要那个到项目id
            const interval1 = setInterval(async () => {
                // 找到项目id时才初始化地图，防止获取不到图层
                clearInterval(interval1);

                map = this.map = window.olmap = createMap();

                // levelType根据路由去判断属于项目预览还是首页地图
                if (this.levelType === 'project') {
                    // 加载图层
                    const r = getGeoServerUrlByProjectId;
                    if (!r.data) {
                        this.$message.error(
                            '未配置GeoServer图层地址，图层将无法正常显示，请联系系统管理员'
                        );
                        return;
                    }
                    const { geoserver, namespace, layers } = r.data;
                    this.namespace = namespace; //给儿子ToolBox.vue WFS插入时用
                    // 用于LayerControl用来控制图层
                    this.baseLayers = layers.concat(defaultBaseLayers as any);
                    // 用于cesium加载
                    this.buildingGsonUrl = [];
                    // 用于添加建筑物图层们的选中/框选事件
                    this.buildingLayers = [];
                    // WMTS的方式加载
                    // GetCapabilities只需调用一次即可
                    const response = await fetch(
                        '/geoserver/gwc/service/wmts?REQUEST=GetCapabilities'
                    );
                    // const text = await response.text();
                    const text = wmtsGetCapabilities;
                    let parser = new WMTSCapabilities();
                    let capabilitiesResult = parser.read(text);

                    // 添加图层
                    layers.forEach((layer) => {
                        const { name: layername, title, type, zindex } = layer;
                        if (type === 'vec') {
                            const gsonUrl = `${geoserver}/${namespace}/ows?service=WFS&version=1.0.0&request=GetFeature&srsname=EPSG:3857&typeName=${namespace}:${layername}&outputFormat=application/json`;
                            const tileWMSUrl = `${geoserver}/${namespace}/wms`;
                            // 房屋跟附属物都属于建筑图层
                            if (
                                layername.includes('_fw') ||
                                layername.includes('_fsw')
                            ) {
                                this.buildingGsonUrl = gsonUrl;
                                // 建筑图层
                                const buildingL = loadGSONToVecLayer2({
                                    flag: 'building',
                                    geojsonObject: fw_geojson,
                                    layername,
                                    zIndex: zindex,
                                });
                                map?.addLayer(buildingL);
                                this.buildingLayers?.push(buildingL);
                                // 可能会执行两次
                                const listener = (evt: Event) => {
                                    const source = evt.target;
                                    if (source.getState() === 'ready') {
                                        this.isUnLockViewByExtent = false;
                                        buildingL
                                            ?.getSource()
                                            ?.un('change', listener);
                                    }
                                };
                                buildingL?.getSource()?.on('change', listener);
                            } else if (
                                layername.includes(
                                    'jitang_2009erdiaodixingceng'
                                ) ||
                                layername.includes('jitang_tuguidiejiadixingtu')
                            ) {
                                // 处理数据大的cad图
                                let tiled = new TileLayer({
                                    name: layername,
                                    visible: false,
                                    zIndex: zindex,
                                    minZoom: layername.includes('_Annotation')
                                        ? 19
                                        : undefined,
                                    source: new TileWMS({
                                        url: tileWMSUrl,
                                        serverType: 'geoserver',
                                        params: {
                                            FORMAT: 'image/png',
                                            tiled: true,
                                            LAYERS: `${namespace}:${layername}`,
                                        },
                                    }),
                                } as BaseTileOptions<TileWMS>);
                                map?.addLayer(tiled);
                            } else {
                                const vecL = loadGSONToVecLayer({
                                    gsonUrl,
                                    layername,
                                    zIndex: zindex,
                                    // 默认显示红色范围线
                                    visible: layername.includes('_fanwei')
                                        ? true
                                        : false,
                                    // 标注图层放大到19再显示,不然太密集了
                                    minZoom: layername.includes('_Annotation')
                                        ? 19
                                        : undefined,
                                });
                                map?.addLayer(vecL);
                                const listener = (evt: Event) => {
                                    const source = evt.target;
                                    if (source.getState() === 'ready') {
                                        vecL.getSource()?.un(
                                            'change',
                                            listener
                                        );
                                    }
                                };
                                vecL.getSource()?.on('change', listener);
                            }
                        } else if (type === 'img') {
                            // ‘img不只有影像地图，还有历史影像，要限制一下

                            // 找到切片影像的范围,设置未view的范围
                            const l = capabilitiesResult.Contents.Layer.find(
                                (i: any) => i.Identifier.includes(layername)
                            );
                            if (!l) {
                                this.$message.error(
                                    layername + ' 没有配准影像图层'
                                );
                                return;
                            }
                            const extent = l.WGS84BoundingBox;
                            const extent2 = [
                                ...fromLonLat(extent.slice(0, 2)),
                                ...fromLonLat(extent.slice(2, 4)),
                            ];
                            if (layername.includes('_yx')) {
                                map && lockViewByExtent(extent2, map);
                            }
                            let options = optionsFromCapabilities(
                                capabilitiesResult,
                                {
                                    layer: `${namespace}:${layername}`,
                                    matrixSet: 'EPSG:900913',
                                }
                            );
                            if (!options) {
                                alert('geoserver配置错误！没有切片！');
                                return;
                            }
                            // 不修改options.urls[0];的话,会造成地址生成的是, 缺少端口,造成访问不到对的位置
                            // ("http://local-dev1.jrnet888.com/geoserver/gwc/service/wmts?");
                            let i = options.urls?.at(0);
                            i = '/geoserver/gwc/service/wmts?';
                            let imgL = new TileLayer({
                                visible: layername.includes('_yx'),
                                name: layername,
                                extent: extent2,
                                source: new WMTS(options),
                            } as BaseTileOptions<WMTS>);
                            imgL && map?.addLayer(imgL);
                        } else {
                            debugger;
                        }
                    });
                    // 中山总规图特别适配一个图例
                    const interval2 = setInterval(() => {
                        const tgL = map?.getLayerByProperty(
                            'name',
                            'quanyan_tg'
                        );
                        if (tgL) {
                            clearInterval(interval2);
                            tgL.setVisible(false);
                            tgL.setOpacity(0.7);
                            tgL.addEventListener('change:visible', (e) => {
                                const visible = !(e as any).oldValue;
                                let display = (this.$refs.tuli as HTMLElement)
                                    .style.display;
                                display &&
                                    (visible
                                        ? (display = 'block')
                                        : (display = 'none'));
                            });
                        }
                    }, 1000);
                    // 添加建筑物图层们的选中/框选事件
                    this.addSelectBuildingInteraction(
                        this.buildingLayers as VectorImage<
                            VectorSource<Geometry>
                        >[]
                    );
                } else if (this.levelType === 'country') {
                    // 只有特定缩放范围才显示项目信息overylay
                    // const projectSourceChangelistener = (evt) => {
                    //     const source = evt.target;
                    //     if (source.getState() === 'ready') {
                    //         // 再这里设置显示范围, 因为如果在VectorLayer的options里设置
                    //         // 那只有一开始视图不在其范围内,图层就不会被加载
                    //         // 造成在enterLockViewByLayer中获取不到extent
                    //         projectL.setMaxResolution(20);
                    //         projectL.setMinResolution(0.5);
                    //     }
                    // };
                }

                // 控制overlay的层级显示
                map.on('moveend', (e) => {
                    // 实时获取当前缩放级别显示到界面控件上
                    const zoom = map?.getView().getZoom(); //获取当前地图的缩放级别
                    if (!zoom) return;
                    this.zoomLevel = Math.round(zoom);

                    const overlays = map?.getOverlays().getArray();
                    if (!overlays) return;

                    if (this.cityL) {
                        const cityOverlays = overlays.filter(
                            // @ts-ignore
                            (i) => i.options.belong === this.cityL
                        );
                        if (zoom <= 4.5) {
                            cityOverlays.forEach(
                                (i) => i && i.setPosition(undefined)
                            );
                        } else {
                            cityOverlays.forEach(
                                // @ts-ignore
                                (i) => i && i.setPosition(i.options.pos)
                            );
                        }
                    }

                    if (this.projectL) {
                        const projOverlays = overlays.filter(
                            // @ts-ignore
                            (i) => i.options.belong === this.projectL
                        );
                        if (16.6 >= zoom && zoom >= 15.5) {
                            projOverlays.forEach(
                                // @ts-ignore
                                (i) => i && i.setPosition(i.options.pos)
                            );
                        } else {
                            projOverlays.forEach(
                                (i) => i && i.setPosition(undefined)
                            );
                        }
                    }
                });
                // 大于某个级别才可以选择要素, 为map添加鼠标移动事件监听，当指向标注时改变鼠标光标状态
                map.on('pointermove', (evt) => {
                    if (!map) return;
                    let pixel = map?.getEventPixel(evt.originalEvent);
                    let hit = map?.hasFeatureAtPixel(pixel);
                    const zoom = map?.getView()?.getZoom();
                    if (zoom && zoom > this.zoomThatCanSelect) {
                        map.getTargetElement().style.cursor = hit
                            ? 'pointer'
                            : '';
                    } else {
                        map.getTargetElement().style.cursor = '';
                    }
                });
                // 点击时弹出信息,或跳转到视图
                map.on('click', (evt) => {
                    let fea = map?.forEachFeatureAtPixel(
                        evt.pixel,
                        (feature, layer) => {
                            if (!layer) return;

                            const { name: layername, flag } =
                                layer.getProperties();
                            const props = feature.getProperties();

                            if (flag === 'building') {
                                // 冒出建筑id,统一由select交互冒出
                                // 但是选中建筑后,再次点击它,并不会再进select事件,也就不会再冒出,所以需要做以下处理
                                const select = this.map
                                    .getInteractions()
                                    .getArray()
                                    .find(
                                        (i: SelectInteraction) =>
                                            i.getProperties().name ===
                                            'highlightSelect'
                                    );
                                const fwbh = props.fwbh || props['测绘编号'];
                                const clickedIsSelectedFwbh = select
                                    .getFeatures()
                                    .getArray()
                                    .findIndex(
                                        (i: Feature) => i.get('fwbh') === fwbh
                                    );
                                if (clickedIsSelectedFwbh > -1) {
                                    this.$emit('clickBuildingOnMap', fwbh);
                                }
                            }
                            return feature;
                        }
                    );
                });
            }, 1000);
        },
        updated() {
            console.log('map/index updated');
        },
        destroyed() {
            console.log('map/index destroyed');
            map?.getLayers().forEach((i) => {
                map?.removeLayer(i);
            });
            map = null;
        },
        methods: {
            // 全局搜索（权利人/建筑物检索）
            remoteSearchBuilding(query: string) {
                if (query == '') {
                    this.searchOptions = [];
                } else if (query.length >= 3) {
                    this.searchOptions = [
                        { measureNum: 'C20001F002001' },
                        { measureNum: 'C20001F001001' },
                        { measureNum: 'W30041F001001' },
                        { measureNum: 'B30042F001001' },
                        { measureNum: 'B00023F001001' },
                        { measureNum: 'W00008F002001' },
                        { measureNum: 'W00008F001001' },
                    ];
                    this.searchNoDataText = '无数据';
                } else {
                    this.searchNoDataText = '输入3个字符以上触发自动搜索';
                }
            },
            fitMapViewToBuildingByMeasureNum(measureNum: string) {
                console.log('fitMapViewToBuildingByMeasureNum', measureNum);
                if (measureNum) {
                    if (this.is3D) {
                        const feas = map?.getAllBuildingFeas();
                        (
                            this.$refs?.cesiumMap as any
                        )?.flyToBuildingByMeasureNum(measureNum, feas);
                    } else {
                        let foundFlag = false;
                        const interval = setInterval(() => {
                            if (!map) return;
                            const layers = map.getLayersByProperty(
                                'flag',
                                'building'
                            );
                            const feas: Feature[] = [];
                            layers.forEach((layer) => {
                                const fs = layer?.getSource()?.getFeatures();
                                if (fs) feas.push(...fs);
                            });
                            // 直到建筑图层要素加载出来为止
                            feas.length > 0 && clearInterval(interval);
                            const fea = feas.find((i) => {
                                const fwbh =
                                    i.getProperties().fwbh ||
                                    i.getProperties()['测绘编号'];
                                return fwbh === measureNum;
                            });
                            if (fea) {
                                // 设置搜索到的要素的样式未选中
                                foundFlag = true;
                                const select: SelectInteraction = map
                                    .getInteractions()
                                    .getArray()
                                    .find(
                                        (i) =>
                                            i.getProperties().name ===
                                            'highlightSelect'
                                    ) as SelectInteraction;
                                if (select) {
                                    select.getFeatures().clear();
                                    select.getFeatures().push(fea);
                                    select.dispatchEvent({
                                        type: 'select',
                                        selected: [fea],
                                    } as any);
                                }
                                const geom = fea.getGeometry();
                                geom &&
                                    map.getView().fit(geom as SimpleGeometry);
                                this.$message.success(measureNum);
                            }
                        }, 1000);
                        // 实在找不到, 就报错
                        setTimeout(() => {
                            clearInterval(interval);
                            !foundFlag &&
                                this.$message.error(`找不到[${measureNum}]`);
                        }, 10 * 1000);
                    }
                }
            },
            // 子组件传回的统计对比方法
            toolboxStatistics(id: string) {
                this.showStatistics = true;
                this.statisticsId = id;
            },
            // 框选, 点选
            addSelectBuildingInteraction(layers: VectorImage<VectorSource>[]) {
                // 添加建筑物的点击高亮
                let selectSingleClick = new Select({
                    condition: (mapBrowserEvent) => {
                        const zoom = map?.getView()?.getZoom();
                        // 放大到一定范围才可以选择房屋
                        return zoom
                            ? click(mapBrowserEvent) &&
                                  zoom > this.zoomThatCanSelect
                            : false;
                    },
                    style: getFWSelectedStyleFunc as StyleFunction,
                    layers: layers,
                });
                selectSingleClick.on('select', (e) => {
                    if (e.selected.length > 0) {
                        const props = e.selected[0].getProperties();
                        const fwbh = props.fwbh || props['测绘编号'];
                        this.$emit('clickBuildingOnMap', fwbh);
                    }
                });
                selectSingleClick.set('name', 'highlightSelect');
                let selectedFeatures: Collection<Feature<Geometry>> =
                    selectSingleClick.getFeatures();

                //一个DragBox交互，用于通过绘图框选择要素
                let dragBox = new DragBox({
                    condition: platformModifierKeyOnly,
                });
                this.map.addInteraction(dragBox);
                dragBox.on('boxend', () => {
                    let rotation = this.map.getView().getRotation();
                    let oblique = rotation % (Math.PI / 2) !== 0;
                    let candidateFeatures:
                        | Collection<Feature<Geometry>>
                        | any[] = oblique ? [] : selectedFeatures;
                    let extent = dragBox.getGeometry().getExtent();
                    this.buildingLayers?.forEach((i) => {
                        const vectorSource = i.getSource();
                        vectorSource?.forEachFeatureIntersectingExtent(
                            extent,
                            (feature: Feature) => {
                                candidateFeatures.push(feature);
                            }
                        );
                    });
                    let props = (
                        candidateFeatures as Collection<Feature<Geometry>>
                    )
                        .getArray()
                        .map((i) => i.getProperties());
                    let fwbhs = props.map((i) => i.fwbh || i['测绘编号']);

                    const r = {
                        res: '0',
                        msg: '操作成功!',
                        data: [
                            {
                                rightPerson: '',
                                measureNum: 'W30079F003001',
                            },
                            {
                                rightPerson: '',
                                measureNum: 'W30079F004001',
                            },
                            {
                                rightPerson: '',
                                measureNum: 'C30077F002001',
                            },
                            {
                                rightPerson: '',
                                measureNum: 'W30079F002001',
                            },
                            {
                                rightPerson: '',
                                measureNum: 'B30053F001001',
                            },
                            {
                                rightPerson: '',
                                measureNum: 'C30046F001001',
                            },
                            {
                                rightPerson: '',
                                measureNum: 'B00082F001001',
                            },
                        ],
                    };

                    this.multiSelectedProps = r.data;

                    //倾斜旋转视图时，框范围将超出其几何形状，因此框和候选要素几何围绕公共锚旋转
                    //确认这一点，并且框的几何形状与其对齐范围，几何相交
                    if (oblique) {
                        let anchor = [0, 0];
                        let geometry = dragBox.getGeometry().clone();
                        geometry.rotate(-rotation, anchor);
                        let extent$1 = geometry.getExtent();
                        candidateFeatures.forEach((feature) => {
                            let geometry = feature?.getGeometry()?.clone();
                            geometry?.rotate(-rotation, anchor);
                            if (geometry?.intersectsExtent(extent$1)) {
                                selectedFeatures.push(feature);
                            }
                        });
                        props = selectedFeatures
                            .getArray()
                            .map((i) => i.getProperties());
                        this.multiSelectedProps = r.data;
                    }
                });
                //绘制新框和单击地图时清除选择
                dragBox.on('boxstart', () => {
                    selectedFeatures.clear();
                });

                selectedFeatures.on(['add', 'remove'], () => {
                    let feas = selectedFeatures.getArray();
                    if (feas.length > 0) {
                        // this.multiSelectedProps = props;
                    } else {
                        this.multiSelectedProps = [];
                    }
                });
                this.map.addInteraction(selectSingleClick);
            },
            // 查询建筑物信息
            handleClickBuildingOnCesiumMap(fwbh: string) {
                this.$emit('clickBuildingOnMap', fwbh);
            },
            // 切换地图显示类型
            mapChange(maptype: string) {
                const twoMap = this.$refs.twoMap;
                (twoMap as HTMLElement).style.background = 'initial';

                if (maptype == '航拍实景') {
                    // if (this.isUnLockViewByExtent) return;
                    this.is3D = true;
                    this.showFlyCesiumMap = false;
                } else if (maptype == '飞行漫游') {
                    this.is3D = true;
                    this.showFlyCesiumMap = true;
                } else {
                    this.is3D = false;
                    let arr = ['矢量图层', '影像图层'];
                    if (!map) {
                        console.error('mapChange 找不到map');
                        return;
                    }
                    arr.forEach((i) => {
                        map?.getLayersByProperty('name', i).forEach((i) =>
                            i.setVisible(false)
                        );
                    });
                    if (maptype == '空图层') {
                        (twoMap as HTMLElement).style.background = 'black';
                    } else {
                        map.getLayersByProperty('name', maptype).forEach((i) =>
                            i.setVisible(true)
                        );
                    }
                    console.log('mapChange getView().changed()');
                    map.getView().changed();
                }
                this.maptype = maptype;
            },
        },
    });
</script>

<style lang="scss" scoped>
    .map-vue {
        // position: absolute;
        height: 100%;
        width: 100%;
        .olmap {
            position: absolute;
            height: 100%;
            width: 100%;

            .two-olmap {
                display: grid;
                position: absolute;
                height: 100%;
                width: 100%;
                grid-auto-flow: column;
                gap: 2px;

                #olmap {
                    position: relative;
                    height: 100%;
                    width: 100%;
                    ::v-deep {
                        .ol-control button {
                            background-color: rgb(0, 108, 105);
                        }
                        .ol-control button:hover,
                        .ol-control button:focus {
                            background-color: rgb(74, 146, 144);
                        }
                        .ol-zoom {
                            top: auto;
                            left: auto;
                            right: 1rem;
                            bottom: 10rem;
                        }
                        .ol-zoom {
                            transform: translate(0px, 70px);
                        }
                        .ol-zoomlevel {
                            z-index: 1;
                            transform: translate(0px, 10px);
                        }
                    }
                }
            }
        }
    }

    ::v-deep {
        .box-card {
            position: absolute;
            z-index: 1;
            top: 68px;
            right: 20px;
            max-width: 350px;
            font-size: 14px;
        }
    }

    /* 测量 */
    ::v-deep {
        .ol-tooltip {
            position: relative;
            background: rgba(0, 0, 0, 0.5);
            border-radius: 4px;
            color: white;
            padding: 4px 8px;
            opacity: 0.7;
            white-space: nowrap;
            font-size: 12px;
        }
        .ol-tooltip-measure {
            opacity: 1;
            font-weight: bold;
        }
        .ol-tooltip-static {
            background-color: rgb(0, 0, 0);
            color: white;
            border: 1px solid white;
        }
        .ol-tooltip-measure:before,
        .ol-tooltip-static:before {
            border-top: 6px solid rgba(0, 0, 0, 0.5);
            border-right: 6px solid transparent;
            border-left: 6px solid transparent;
            content: '';
            position: absolute;
            bottom: -6px;
            margin-left: -7px;
            left: 50%;
        }
        .ol-tooltip-static:before {
            border-top-color: #ffcc33;
        }
    }

    .bottom-show-open-list-btn,
    .bottom-show-open-list-btn:hover,
    .bottom-show-open-list-btn:focus {
        position: absolute;
        bottom: 20px;
        left: 50%;
        z-index: 1;
        margin-left: -103px;
        width: 206px;
        height: 69px;
        border: 0;
        border-radius: 50px;
        background: url(../../assets/mappage/btn-bg1.png);
    }

    .city-overlay {
        max-height: 400px;
        overflow: auto;
        .proj-row {
            display: grid;
            grid-template-columns: 110px 130px 100px;
            align-items: center;
        }
    }
    .proj-overlay {
        width: 200px;
        max-height: 300px;
        overflow: auto;
    }
    .city-overlay,
    .proj-overlay {
        .head {
            margin-bottom: 1rem;
            margin-top: -1rem;
        }
        .body {
            display: grid;
            gap: 5px;
        }
    }

    .multi-selecteds-detail-panel {
        display: grid;
        grid-template-columns: 1fr 1fr;
        position: absolute;
        z-index: 1;
        background: rgba(255, 255, 255, 0.8);
        top: 200px;
        right: 0px;
        height: 40vh;
        overflow: auto;
        div {
            border: 1px solid black;
            text-align: center;
        }
    }

    .proj-info {
        display: grid;
        grid-template-columns: 1fr 1fr;
        z-index: 1;
        position: absolute;
        top: 5px;
        right: 5px;
        background: rgba(255, 255, 255, 0.8);
        overflow: auto;
        align-items: center;
        div {
            text-align: center;
            width: 10rem;
            word-break: break-all;
        }
    }
    .map-type {
        position: absolute;
        right: 0;
        bottom: 0;
        padding: 4px;
        display: flex;
        background-color: #fff;
        overflow: hidden;
        z-index: 1;
        div {
            position: relative;
            margin-right: 4px;
            width: 86px;
            height: 60px;
            cursor: pointer;
            border: 1px solid #fff;
            &:last-child {
                margin-right: 0;
            }
            &.null {
                background: black;
            }
            &.vector {
                background-image: url(../../assets/maptype.png);
                background-position: 0 0;
            }
            &.portrait {
                background-image: url(../../assets/maptype.png);
                background-position: 0 -181px;
            }
            &.aerial-photography {
                background-image: url(../../assets/maptype.png);
                background-position: 0 -61px;
            }
            span {
                position: absolute;
                bottom: 0;
                padding: 2px;
                line-height: 1;
                right: 0;
                color: #fff;
                font-size: 14px;
            }
        }
    }

    .tuli {
        background-image: url(../../assets/map/tuli.png);
        width: 21vh;
        height: 29vh;
        z-index: 1;
        position: absolute;
        right: 20px;
        background-size: cover;
        opacity: 0.7;
        bottom: 208px;
        border-radius: 5px;
        display: none;
    }

    .drawer {
        >>> .custom-drawer {
            background-color: rgba(255, 255, 255, 0.8);
        }
        top: auto;
        transition: left 0.28s;
        .drawer-con {
            padding: 20px;
            .el-col {
                height: 300px;
                overflow: hidden;
            }
        }
    }

    .map-toggler {
        top: 70px;
        right: 1%;
        position: absolute;
        z-index: 1;
        cursor: pointer;
        background: #d6ba7194;
        color: white;
    }
</style>
