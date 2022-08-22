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
                        <template
                            :key="prop.measureNum"
                            v-for="prop in multiSelectedProps"
                        >
                            <div
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
                @statistics="statistics"
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
                :loading="searchLoading"
                :no-data-text="searchNoDataText"
                :remote-method="remoteSearchBuilding"
                @change="fitMapViewToBuildingByMeasureNum(searchMeasureNumVal)"
            >
                <el-option
                    v-for="(item, index) in searchOptions"
                    :key="index"
                    :value="item.measureNum || item.protocolNum"
                >
                    <span v-if="item.type == 1" class="el-icon-office-building">
                        {{ `${item.measureNum}/${item.protocolNum}` }}
                    </span>
                    <span v-else-if="item.type == 2" class="el-icon-user">
                        {{
                            `${item.rightName}/${item.identityCard}/${item.mobile}`
                        }}
                    </span>
                    <span v-else-if="item.type == 3" class="el-icon-house">
                        {{ `${item.clanCode}/${item.clanGroundNum}` }}
                    </span>
                </el-option>
            </el-select>

            <!-- cesium 3D 冒出点击了哪个建筑物 -->
            <CesiumMap
                ref="cesiumMap"
                v-if="levelType === 'project' && showCesiumMap"
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
            <div
                v-loading="isUnLockViewByExtent"
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

        <!-- 城市点旁边的overlay展示项目信息 -->
        <div>
            <!-- 用城市id 作为元素id 也作为overlayid 这样根据获得城市的id,即可显示出对应的overlay -->
            <div
                :id="cityFeaProps.id"
                v-for="cityFeaProps in cityFeasPropsThatHasManyProj"
                :key="cityFeaProps.id"
                class="city-overlay el-card is-always-shadow el-card__body"
            >
                <template>
                    <div class="head">
                        <el-button type="text">
                            {{ cityFeaProps.cityName }}
                        </el-button>
                        <el-button
                            style="float: right"
                            type="text"
                            @click="handleCloseMoreProjClick(cityFeaProps.id)"
                        >
                            关闭
                        </el-button>
                    </div>
                    <div class="body">
                        <div
                            class="proj-row"
                            :key="projectInfo"
                            v-for="projectInfo in cityFeaProps.projectInfoList"
                        >
                            <div>{{ projectInfo.projectName }}</div>
                            <div>{{ projectInfo.projectStageVal }}</div>
                            <el-button
                                size="mini"
                                @click="
                                    handleEnterProjClick(projectInfo.projectId)
                                "
                            >
                                进入项目
                            </el-button>
                        </div>
                    </div>
                </template>
            </div>
        </div>

        <!-- 项目面旁边的overlay展示项目信息 -->
        <div style="display: none">
            <div
                class="proj-overlay el-card is-always-shadow el-card__body"
                v-for="projFeaProps in projectFeasProps"
                :id="projFeaProps.id"
                :key="projFeaProps.projsum"
                :title="projFeaProps.projsum"
            >
                <div class="head">
                    <el-button
                        type="text"
                        @click="handleEnterProjClick(projFeaProps.id)"
                    >
                        进入项目
                    </el-button>
                    <el-button
                        style="float: right"
                        type="text"
                        @click="handleCloseMoreProjClick(projFeaProps.id)"
                    >
                        关闭
                    </el-button>
                </div>
                <div class="body">
                    <div>{{ projFeaProps.projsum }}</div>
                </div>
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
        <project-chart :isShow.sync="showStatistics" :typeId="statisticsId" />

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

    import Map from '@/views/map/enhance-olmap';
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
        Vector as VectorLayer,
        VectorImage,
    } from 'ol/layer';
    import { transform, fromLonLat } from 'ol/proj';
    import Feature from 'ol/Feature';
    import { Circle, Point } from 'ol/geom';
    import { Fill, Stroke, Style, Text, Icon } from 'ol/style';
    import { getCenter, containsExtent } from 'ol/extent';
    import { DragBox, Select } from 'ol/interaction';
    import Overlay from 'ol/Overlay';
    import {
        defaults as defaultControls, // 比例尺
    } from 'ol/control';

    import ResizeObserver from 'resize-observer-polyfill';

    import {
        tdtVec,
        tdtVecNotation,
        tdtSatelite,
        tdtSateliteNotation,
        getFWSelectedStyleFunc,
    } from '@/views/map/olmap-common';
    import { defaultBaseLayers } from '@/views/map/olmap-config';
    import { provinceAndCityData, CodeToText } from 'element-china-area-data';
    import {
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
    import projectChart from '@/views/chart/projectChart.vue';
    import MeasurePanel from './components/MeasurePanel.vue';
    import LayerControl from './components/LayerControl.vue';
    import DrawPolygon from './components/DrawPolygon.vue';
    import CompareMap from './components/CompareMap.vue';
    import ToolBox from './components/ToolBox.vue';
    import CesiumMap from './components/CesiumMap.vue';

    import { defineComponent } from 'vue';

    // 此处this为undefined
    // 不要放store里，不要被vue劫持，否则性能堪忧
    export let map: Map;

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
            projectChart,
            DisburseBudget,
        },
        data() {
            this.zoomThatCanSelect = 17.465768204547796;
            this.chinaView = new View({
                center: fromLonLat([
                    104.11137264774226, 34.584094621462896,
                ]) /* 中国中心*/,
                zoom: 5,
            });
            this.map = map;
            let cityFeasPropsThatHasManyProj: any[] = [];
            let projectFeasProps: any[] = [];
            let multiSelectedProps: any[] = [];
            let searchOptions: any[] = [];
            let projInfo: any = {};

            return {
                is3D: false,
                projInfo,
                multiSelectedProps,
                projectFeasProps,
                cityFeasPropsThatHasManyProj,
                isUnLockViewByExtent: true,
                //
                showLayerControl2: true,
                searchOptions,
                searchLoading: false,
                searchNoDataText: '',
                //
                isDisburseBudgetCollapse: false,
                showCesiumMap: true,
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
                        this.$route.path.includes('building/approval') ||
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
            window.mapvue = this;
            this.maptype;
            // 轮询直到获取到项目id,才去请求接口,很多接口需要要那个到项目id
            const interval1 = setInterval(async () => {
                // 找到项目id时才初始化地图，防止获取不到图层
                clearInterval(interval1);

                const mapElementId = 'olmap';
                const mapElement = document.querySelector('#' + mapElementId);
                tdtVec.setVisible(false);
                tdtVecNotation.setVisible(false);
                // 多个组件引用同一个vue组件，这个组件又引用同一个tdtSatelite，始终会造成状态不一致问题
                tdtSatelite.setVisible(true);
                tdtSateliteNotation.setVisible(true);
                console.log('实例化map,给map赋值');
                map =
                    this.map =
                    window.olmap =
                        new Map({
                            controls: defaultControls({
                                attribution: false,
                                zoom: !this.asKanban,
                            }),
                            layers: [
                                tdtSatelite,
                                tdtVec,
                                tdtVecNotation,
                                tdtSateliteNotation /* googleMapLayer */,
                            ],
                            view: this.chinaView,
                            target: mapElementId,
                        });
                // 为什么缩放或单击地图时不正确/不正确？ https://openlayers.org/en/latest/doc/faq.html
                const sizeObserver = new ResizeObserver(() => {
                    console.log('ResizeObserver updateSize');
                    map && map.updateSize();
                });
                mapElement && sizeObserver.observe(mapElement);

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
                    this.baseLayers = layers.concat(defaultBaseLayers);
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
                    var parser = new WMTSCapabilities();
                    var capabilitiesResult = parser.read(text);

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
                                map.addLayer(buildingL);
                                this.buildingLayers.push(buildingL);
                                // 可能会执行两次
                                const listener = (evt) => {
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
                                var tiled = new TileLayer({
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
                                });
                                map.addLayer(tiled);
                            } else {
                                const vecL = loadGSONToVecLayer2({
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
                                map.addLayer(vecL);
                                const listener = (evt) => {
                                    const source = evt.target;
                                    if (source.getState() === 'ready') {
                                        vecL.getSource().un('change', listener);
                                    }
                                };
                                vecL.getSource().on('change', listener);
                            }
                        } else if (type === 'img') {
                            // ‘img不只有影像地图，还有历史影像，要限制一下

                            // 找到切片影像的范围,设置未view的范围
                            const l = capabilitiesResult.Contents.Layer.find(
                                (i) => i.Identifier.includes(layername)
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
                                lockViewByExtent(extent2, map);
                            }
                            var options = optionsFromCapabilities(
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
                            options.urls[0] = '/geoserver/gwc/service/wmts?';
                            let imgL = new TileLayer({
                                visible: layername.includes('_yx'),
                                name: layername,
                                extent: extent2,
                                source: new WMTS(options),
                            });
                            imgL && map.addLayer(imgL);
                            this.$on('hook:destroyed', () => {
                                imgL = null;
                            });
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
                                const visible = !e.oldValue;
                                visible
                                    ? (this.$refs.tuli.style.display = 'block')
                                    : (this.$refs.tuli.style.display = 'none');
                            });
                        }
                    }, 1000);
                    // 添加建筑物图层们的选中/框选事件
                    this.addSelectBuildingInteraction(this.buildingLayers);

                    // 加载自建地块图层图层列表
                    // this.loadPlots();
                } else if (this.levelType === 'country') {
                    // 第一屏都要加载城市图层, 具体城市图层
                    getGeoServerBaseLayerUrl().then((r) => {
                        const data = r.data;
                        if (!data) {
                            this.$message.error('未找到首屏项目基础地图配置');
                            return;
                        }
                        const { geoserver, namespace, layers } = data;
                        layers.forEach((layer) => {
                            const { name: layername, type, zindex } = layer;
                            const gsonUrl = `${geoserver}/${namespace}/ows?service=WFS&request=GetFeature&srsname=EPSG:3857&typeName=${namespace}:${layername}&outputFormat=application/json`;
                            layername === 'project' &&
                                map.addLayer(
                                    loadGSONToVecLayer2({
                                        gsonUrl,
                                        layername: 'project',
                                    })
                                );
                            // layername === "city" &&
                            //   map.addLayer(this.loadCityGSONToVecLayer(gsonUrl));
                            // 城市图层改为在下面加载, 创建一个空矢量图层,请求接口动态添加要素上去
                        });

                        // 添加城市图层
                        var cityS = new VectorSource();
                        const cityL = (this.cityL = new VectorLayer({
                            name: 'city',
                            source: cityS,
                            style: function (feature) {
                                const { projectNum, cityName, projectName } =
                                    feature.getProperties();
                                const style = new Style({
                                    image: new Icon({
                                        src: './position.png',
                                    }),
                                    text: new Text({
                                        textAlign: 'left',
                                        offsetX: 15,
                                        font: 'normal 16px Arial',
                                        text:
                                            projectNum > 1
                                                ? `${projectNum}`
                                                : `${cityName}(${projectName})`,
                                        fill: new Fill({
                                            color: 'white',
                                        }),
                                    }),
                                });
                                return style;
                            },
                        }));
                        map.addLayer(cityL);
                        // 添加城市图层-要素
                        listAllProject({}).then((r) => {
                            const allProjs = r.data.filter((i) => i.location);
                            const allProjs2 = allProjs.map((i) => {
                                if (!i.city) return i;
                                const citycodearr = i.city
                                    .split(' ')
                                    .join('')
                                    .slice(1, -1)
                                    .split(',');
                                i.location = fromLonLat(
                                    i.location.split(',').map(parseFloat)
                                );
                                i.cityName =
                                    CodeToText[citycodearr[0]] +
                                    CodeToText[citycodearr[1]];
                                return i;
                            });
                            const allCities = allProjs2.map((i) => i.city);
                            const theCitys = new Set(allCities);
                            theCitys.forEach((i) => {
                                // 一个城市添加一个点,有多个点的话合并显示
                                const cityObjs = allProjs2.filter(
                                    (j) => j.city === i
                                );
                                const cityObj = cityObjs.slice(0, 1)[0];
                                const projectNum = allProjs2.filter(function (
                                    j
                                ) {
                                    return j.city === i;
                                }).length;
                                const fea = new Feature({
                                    geometry: new Point(cityObj.location),
                                });
                                const id = '';
                                const projectStageVals = cityObjs.map(
                                    (i) => i.projectStageVal
                                );
                                fea.setProperties(
                                    Object.assign(cityObj, {
                                        projectNum,
                                        projectStageVals,
                                    })
                                );
                                cityS.addFeature(fea);
                                /* city: "[110000, 110100]"
                  cityRegionVal: "京津冀"
                  location: "116.407526,39.904030"
                  locationName: "北京市"
                  projectId: 164
                  projectName: "1"
                  projectNum: 2
                  projectStageVal: "安置房回迁阶段
              */
                                if (projectNum > 1) {
                                    const projs = allProjs2.filter(
                                        (i) => i.city === cityObj.city
                                    );
                                    this.cityFeasPropsThatHasManyProj.push({
                                        id: id,
                                        projsum: projectNum,
                                        city: cityObj.cityName,
                                        projectInfoList: projs,
                                    });
                                }
                            });
                            // 超过1个项目,旁边显示项目列表,cityFeasProps动态绑定了overlay的元素
                            // 用来构造overlay
                            // 获取每个城市的详情
                            this.$nextTick(() => {
                                // 这里才能获取到element
                                this.cityFeasPropsThatHasManyProj.forEach(
                                    (cityFeasProps, index) => {
                                        // 添加该城市的overlay
                                        const center =
                                            cityFeasProps.projectInfoList[0]
                                                .location;
                                        const ele = document.getElementById(
                                            cityFeasProps.id
                                        );
                                        const overlay = new Overlay({
                                            id: cityFeasProps.id,
                                            belong: cityL,
                                            offset: [10, 10],
                                            pos: center,
                                            position: undefined,
                                            element: ele,
                                        });
                                        console.log(
                                            '添加了cityOverlay',
                                            cityFeasProps.id
                                        );
                                        map?.addOverlay(overlay);
                                    }
                                );
                            });
                        });

                        const projectL = (this.projectL =
                            map.getLayerByProperty('name', 'project'));
                        // 只有特定缩放范围才显示项目信息overylay
                        const projectSourceChangelistener = (evt) => {
                            const source = evt.target;
                            if (source.getState() === 'ready') {
                                // 再这里设置显示范围, 因为如果在VectorLayer的options里设置
                                // 那只有一开始视图不在其范围内,图层就不会被加载
                                // 造成在enterLockViewByLayer中获取不到extent
                                projectL.setMaxResolution(20);
                                projectL.setMinResolution(0.5);

                                // 添加项目overylay
                                this.projectFeasProps = source
                                    .getFeatures()
                                    .map((fea) =>
                                        // 设置属性对应的图层名,点击进入项目时,根据图层名找到图层源,进而找到要素
                                        Object.assign(fea.getProperties(), {
                                            id: fea
                                                .getId()
                                                .replace('project.', ''), //'project.60' -> 60
                                            layername: 'project',
                                        })
                                    );
                                // 添加overlay介绍项目信息
                                this.$nextTick(() => {
                                    this.projectFeasProps.forEach(
                                        (projFeaProps) => {
                                            // 获取要素中心
                                            const feaExtent =
                                                projFeaProps.geometry.getExtent();
                                            const center = getCenter(feaExtent);
                                            const overlay = new Overlay({
                                                id: projFeaProps.id,
                                                belong: projectL, //用于区分类型
                                                offset: [10, 10],
                                                pos: center,
                                                position: undefined,
                                                element:
                                                    document.getElementById(
                                                        projFeaProps.id
                                                    ),
                                            });
                                            console.log(
                                                '添加了projOverlay',
                                                projFeaProps.id
                                            );
                                            overlay && map?.addOverlay(overlay);
                                        }
                                    );
                                }); //nexttick结束

                                // hover项目时弹出项目信息框
                                var select = new Select({
                                    condition: click,
                                    layers: [projectL],
                                });
                                select.on('select', (e) => {
                                    if (e.selected.length > 0) {
                                        const feature = e.selected[0];
                                        const projectId = feature
                                            .getId()
                                            .replace('project.', '');
                                        getProjectInfoByProjectId({
                                            projectId: projectId,
                                        }).then((r) => {
                                            if (!r.data) {
                                                debugger;
                                            }
                                            this.projInfo = r.data;
                                        });
                                    } else {
                                        this.projInfo = {};
                                    }
                                });
                                map.addInteraction(select);
                            }
                            projectL
                                .getSource()
                                .un('change', projectSourceChangelistener);
                        };
                        projectL
                            .getSource()
                            .on('change', projectSourceChangelistener);
                    });
                }

                // 控制overlay的层级显示
                map.on('moveend', (e) => {
                    // 实时获取当前缩放级别显示到界面控件上
                    this.zoomLevel = Math.round(map?.getView().getZoom());

                    const zoom = map?.getView().getZoom(); //获取当前地图的缩放级别
                    const overlays = map?.getOverlays().getArray();

                    if (this.cityL) {
                        const cityOverlays = overlays.filter(
                            (i) => i.options.belong === this.cityL
                        );
                        if (zoom <= 4.5) {
                            cityOverlays.forEach(
                                (i) => i && i.setPosition(undefined)
                            );
                        } else {
                            cityOverlays.forEach(
                                (i) => i && i.setPosition(i.options.pos)
                            );
                        }
                    }

                    if (this.projectL) {
                        const projOverlays = overlays.filter(
                            (i) => i.options.belong === this.projectL
                        );
                        if (16.6 >= zoom && zoom >= 15.5) {
                            projOverlays.forEach(
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
                    var pixel = map?.getEventPixel(evt.originalEvent);
                    var hit = map?.hasFeatureAtPixel(pixel);
                    if (map?.getView().getZoom() > this.zoomThatCanSelect) {
                        map.getTargetElement().style.cursor = hit
                            ? 'pointer'
                            : '';
                    } else {
                        map.getTargetElement().style.cursor = '';
                    }
                });
                // 点击时弹出信息,或跳转到视图
                map.on('click', (evt) => {
                    var fea = map?.forEachFeatureAtPixel(
                        evt.pixel,
                        (feature, layer) => {
                            if (!layer) return;

                            const { name: layername, flag } =
                                layer.getProperties();
                            const props = feature.getProperties();

                            if (layername === 'city') {
                                // 多于一个项目的城市,点击显示所有项目的overlay
                                if (props.projectNum > 1) {
                                    const overlay = map.getOverlayById(
                                        props.id
                                    );
                                    overlay &&
                                        overlay.setPosition(
                                            overlay.options.pos
                                        );
                                } else {
                                    // 一个项目的城市,点击直接跳转到视图
                                    if (
                                        feature.getGeometry().getType() ===
                                            'POINT' ||
                                        feature.getGeometry().getType() ===
                                            'MULTI_POINT'
                                    ) {
                                        this.$confirm(
                                            `进入项目[${props.projectName}]?`,
                                            '提示',
                                            {
                                                confirmButtonText: '确定',
                                                cancelButtonText: '取消',
                                                type: 'info',
                                            }
                                        )
                                            .then(() => {
                                                props.projectId &&
                                                    this.handleEnterProjClick(
                                                        props.projectId
                                                    );
                                            })
                                            .catch(() => {});
                                        // const center = feature.getGeometry().getExtent().slice(0, 2);
                                        // map.getView().setCenter(center);
                                        // map.getView().setZoom(12.6);
                                    }
                                }
                            } else if (flag === 'building') {
                                // 冒出建筑id,统一由select交互冒出
                                // 但是选中建筑后,再次点击它,并不会再进select事件,也就不会再冒出,所以需要做以下处理
                                const select = this.map
                                    .getInteractions()
                                    .getArray()
                                    .find(
                                        (i) =>
                                            i.getProperties().name ===
                                            'highlightSelect'
                                    );
                                const fwbh = props.fwbh || props['测绘编号'];
                                const clickedIsSelectedFwbh = select
                                    .getFeatures()
                                    .getArray()
                                    .findIndex((i) => i.get('fwbh') === fwbh);
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
        destroyed() {
            map?.getLayers().forEach((i) => {
                map.removeLayer(i);
                i = null;
            });
            map = null;
        },
        methods: {
            // 全局搜索（权利人/建筑物检索）
            remoteSearchBuilding(query) {
                if (query == '') {
                    this.searchOptions = [];
                } else if (query.length >= 3) {
                    this.searchLoading = true;
                    searchBuilding({
                        cond: query,
                    }).then((res) => {
                        this.searchOptions = res.data;
                        this.searchLoading = false;
                    });
                    this.searchNoDataText = '无数据';
                } else {
                    this.searchNoDataText = '输入3个字符以上触发自动搜索';
                }
            },
            fitMapViewToBuildingByMeasureNum(measureNum) {
                console.log('fitMapViewToBuildingByMeasureNum', measureNum);
                if (measureNum) {
                    if (this.is3D) {
                        const feas = map.getAllBuildingFeas();
                        this.$refs.cesiumMap.flyToBuildingByMeasureNum(
                            measureNum,
                            feas
                        );
                    } else {
                        let foundFlag = false;
                        const interval = setInterval(() => {
                            if (!map) return;
                            const layers = map.getLayersByProperty(
                                'flag',
                                'building'
                            );
                            const feas = [];
                            layers.forEach((layer) =>
                                feas.push(...layer.getSource().getFeatures())
                            );
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
                                const select = map
                                    .getInteractions()
                                    .getArray()
                                    .find(
                                        (i) =>
                                            i.getProperties().name ===
                                            'highlightSelect'
                                    );
                                select.getFeatures().clear();
                                select.getFeatures().push(fea);
                                select.dispatchEvent({
                                    type: 'select',
                                    selected: [fea],
                                });
                                const geom = fea.getGeometry();
                                map.getView().fit(geom);
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
            statistics(id) {
                this.showStatistics = true;
                this.statisticsId = id;
            },
            addSelectBuildingInteraction(layers) {
                // 添加建筑物的点击高亮
                var selectSingleClick = new Select({
                    condition: (mapBrowserEvent) => {
                        // 放大到一定范围才可以选择房屋
                        return (
                            click(mapBrowserEvent) &&
                            map.getView().getZoom() > this.zoomThatCanSelect
                        );
                    },
                    style: getFWSelectedStyleFunc,
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
                var selectedFeatures = selectSingleClick.getFeatures();

                //一个DragBox交互，用于通过绘图框选择要素
                var dragBox = new DragBox({
                    condition: platformModifierKeyOnly,
                });
                this.map.addInteraction(dragBox);
                dragBox.on('boxend', () => {
                    var rotation = this.map.getView().getRotation();
                    var oblique = rotation % (Math.PI / 2) !== 0;
                    var candidateFeatures = oblique ? [] : selectedFeatures;
                    var extent = dragBox.getGeometry().getExtent();
                    this.buildingLayers.forEach((i) => {
                        const vectorSource = i.getSource();
                        vectorSource.forEachFeatureIntersectingExtent(
                            extent,
                            (feature) => {
                                candidateFeatures.push(feature);
                            }
                        );
                    });
                    let props = candidateFeatures
                        .getArray()
                        .map((i) => i.getProperties());
                    let fwbhs = props.map((i) => i.fwbh || i['测绘编号']);
                    getRightPersonsByMeasureNums({ measureNums: fwbhs }).then(
                        (r) => {
                            this.multiSelectedProps = r.data;
                        }
                    );

                    //倾斜旋转视图时，框范围将超出其几何形状，因此框和候选要素几何围绕公共锚旋转
                    //确认这一点，并且框的几何形状与其对齐范围，几何相交
                    if (oblique) {
                        var anchor = [0, 0];
                        var geometry = dragBox.getGeometry().clone();
                        geometry.rotate(-rotation, anchor);
                        var extent$1 = geometry.getExtent();
                        candidateFeatures.forEach((feature) => {
                            var geometry = feature.getGeometry().clone();
                            geometry.rotate(-rotation, anchor);
                            if (geometry.intersectsExtent(extent$1)) {
                                selectedFeatures.push(feature);
                            }
                        });
                        props = selectedFeatures
                            .getArray()
                            .map((i) => i.getProperties());
                        getRightPersonsByMeasureNums({
                            measureNums: fwbhs,
                        }).then((r) => {
                            this.multiSelectedProps = r.data;
                        });
                    }
                });
                //绘制新框和单击地图时清除选择
                dragBox.on('boxstart', () => {
                    selectedFeatures.clear();
                });

                selectedFeatures.on(['add', 'remove'], () => {
                    var feas = selectedFeatures.getArray();
                    if (feas.length > 0) {
                        // this.multiSelectedProps = props;
                    } else {
                        this.multiSelectedProps = [];
                    }
                });
                this.map.addInteraction(selectSingleClick);
            },
            handleClickBuildingOnCesiumMap(fwbh) {
                this.$emit('clickBuildingOnMap', fwbh);
            },
            // 加载自建地块
            loadPlots() {
                const map = this.map;
                getGroundsByProjId({ projectId: this.projectId }).then((r) => {
                    // 地块分两种,1.加载自己绘制的地块(只显示自己,不高亮相关房屋)  2.项目中新建的地块(没有自己的图形,只用来高亮相关房屋)
                    // 加载自己绘制的地块
                    const grounds = r.data;
                    this.grounds = grounds;
                    // 先清空
                    grounds.forEach((ground) => {
                        const layer = map.getLayerByProperty(
                            'name',
                            ground.layerName
                        );
                        map.removeLayer(layer);
                    });
                    grounds.forEach((ground) => {
                        const geojsonObject = JSON.parse(ground.geojson);
                        let vectorSource = new VectorSource({
                            // 转换坐标为3857(米)
                            features: new GeoJSON().readFeatures(
                                geojsonObject,
                                {
                                    dataProjection: 'EPSG:4326',
                                    featureProjection: 'EPSG:3857',
                                }
                            ),
                        });
                        this.$on('hook:destroyed', () => (vectorSource = null));
                        const layer = new VectorLayer({
                            zIndex: 10,
                            name: ground.layerName,
                            source: vectorSource,
                            visible: false,
                            style: function (feature) {
                                const style = new Style({
                                    stroke: new Stroke({
                                        width: 1,
                                        color: 'lightblue',
                                    }),
                                    fill: new Fill({
                                        color: ground.styleColor,
                                    }),
                                    text: new Text({
                                        font: 'normal 16px Arial',
                                        text: ground.layerName,
                                        fill: new Fill({
                                            color: 'white',
                                        }),
                                    }),
                                });
                                return style;
                            },
                        });
                        map.addLayer(layer);
                    });

                    // 加载项目中自己定义的地块
                    clanGroundGetGround().then((r2) => {
                        if (!r2.data) return;
                        const layerNames = r.data.map((i) => i.layerName); //自建的地块们;
                        const uniquePlots = r2.data.filter(
                            (i) => !layerNames.includes(i.groundName)
                        );
                        uniquePlots.forEach((i) => {
                            const { id, groundName, measureNumAry } = i;
                            this.grounds.push({
                                layerName: groundName,
                                styleColor: '',
                                groundNum: id,
                                measureNums: measureNumAry || [],
                            });
                            let vectorSource = new VectorSource();
                            this.$on(
                                'hook:destroyed',
                                () => (vectorSource = null)
                            );
                            const layer = new VectorLayer({
                                name: groundName,
                                source: vectorSource,
                                visible: false,
                            });
                            layer.addEventListener('change:visible', (e) => {
                                const select = map
                                    .getInteractions()
                                    .getArray()
                                    .find(
                                        (i) =>
                                            i.getProperties().name ===
                                            'highlightSelect'
                                    );
                                select.getFeatures().clear();
                                const visible = !e.oldValue;
                                if (visible) {
                                    // 高亮 ground.measureNums 的建筑
                                    (measureNumAry || []).forEach(
                                        (measureNum) => {
                                            if (!measureNum) return;
                                            const fea =
                                                getBuildingFeaByMeasureNum(
                                                    measureNum,
                                                    map
                                                );
                                            if (fea) {
                                                select.getFeatures().push(fea);
                                                // select.dispatchEvent({ type: "select", selected: [fea] });
                                            }
                                        }
                                    );
                                } else {
                                    // 前面已经清除了,什么都不做
                                }
                            });
                            map.addLayer(layer);
                        });
                    });
                });
            },
            handleEnterProjClick(projectId) {
                //'project.60'
                const map = this.map;
                // 隐藏overlay
                const overlay = map.getOverlayById(projectId);
                overlay && overlay.setPosition(undefined);
                console.log('项目id', projectId);
                selectProject({
                    projectId: projectId,
                }).then((res) => {
                    this.$store.commit('app/SET_PROJECT_ID', projectId);
                    // 路由跳到该项目
                    this.$router.push('/mappage/projectOverview/index');
                    setTimeout(() => {
                        location.reload();
                    }, 100);
                });
            },
            handleCloseMoreProjClick(id) {
                const map = this.map;
                const overlay = map.getOverlayById(id);
                overlay && overlay.setPosition(undefined);
            },
            // 切换地图显示类型
            mapChange(maptype) {
                this.$refs.twoMap.style.background = 'initial';

                if (maptype == '航拍实景') {
                    if (this.isUnLockViewByExtent) return;
                    this.is3D = true;
                    this.showFlyCesiumMap = false;
                    // // 让组件重载,会造成多个容器混乱,原因未知
                    // this.showCesiumMap = false;
                    // this.$nextTick(() => (this.showCesiumMap = true));
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
                        map.getLayersByProperty('name', i).forEach((i) =>
                            i.setVisible(false)
                        );
                    });
                    if (maptype == '空图层') {
                        this.$refs.twoMap.style.background = 'black';
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
            &:hover,
            &.active {
                border-color: #006c69;
                span {
                    background-color: #006c69;
                }
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
