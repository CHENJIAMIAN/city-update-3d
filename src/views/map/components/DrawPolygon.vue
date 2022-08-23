<template>
    <el-card class="box-card">
        <div slot="header" class="clearfix">
            <span>自建图层</span>
        </div>
        <el-form
            ref="ruleForm"
            :model="form"
            :rules="rules"
            label-width="100px"
        >
            <el-form-item label="图层名称" prop="layerName">
                <el-input v-model="form.layerName"></el-input>
            </el-form-item>
            <el-form-item label="图层颜色">
                <el-color-picker
                    v-model="form.styleColor"
                    show-alpha
                ></el-color-picker>
            </el-form-item>
            <!-- <el-form-item label="修改图层范围">
      </el-form-item>-->
            <el-form-item label="图层权限" prop="auth">
                <el-select v-model="form.auth" placeholder="请选择图层权限">
                    <el-option label="公共" value="public"></el-option>
                    <el-option label="私有" value="private"></el-option>
                </el-select>
            </el-form-item>
            <!-- <el-form-item label="嵌入原有图层">
        <el-switch v-model="form.embed"></el-switch>
      </el-form-item>-->
            <el-form-item>
                <el-button type="primary" @click="onSubmit('ruleForm')">
                    立即创建
                </el-button>
                <el-button @click="onCancel">取消</el-button>
            </el-form-item>
        </el-form>
    </el-card>
</template>

<script lang="ts">
    import { Vector as VectorSource, WMTS } from 'ol/source';
    import { Vector as VectorLayer } from 'ol/layer';
    import Feature from 'ol/Feature';
    import { Circle } from 'ol/geom';

    import { Fill, Stroke, Style } from 'ol/style';
    import GeoJSON from 'ol/format/GeoJSON';
    import { Draw, Modify } from 'ol/interaction';
    import Overlay from 'ol/Overlay';
    import * as turf from '@turf/turf';
    import { v4 as uuidv4 } from 'uuid';
    import { map } from '@/views/map/index.vue';

    import { defineComponent } from 'vue';
    export default defineComponent({
        name: 'MeasurePanel',
        data() {
            return {
                form: {
                    groundNum: uuidv4(), // ⇨ '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d'
                    layerName: '',
                    styleColor: 'rgba(10, 73, 140, 0.8)',
                    auth: 'public',
                    // embed: false,
                    protocolNums: [],
                    measureNums: [],
                    geojson: '',
                },
                rules: {
                    layerName: [
                        {
                            required: true,
                            message: '请输入图层名称',
                            trigger: 'blur',
                        },
                        {
                            min: 1,
                            max: 50,
                            message: '长度在 1 到 50 个字符',
                            trigger: 'blur',
                        },
                    ],
                    auth: [
                        {
                            required: true,
                            message: '图层权限',
                            trigger: 'change',
                        },
                    ],
                },
            };
        },
        watch: {
            'form.styleColor': {
                handler(n, v) {
                    this.setLayerStyleColor(n);
                },
            },
        },
        mounted() {
            this.$nextTick((_) => {
                this.initDrawLayer();
                this.startDrawLayer();
            });
        },
        beforeDestroy() {
            // this.resetForm("ruleForm"); 此处清空,请求时携带的表单的引用对象,也被清空了!
        },
        destroyed() {
            map.removeInteraction(this.drawLInteraction);
            map.removeInteraction(this.modifyLInteraction);
            this.drawS.clear();
            map.removeLayer(this.drawL);
        },
        methods: {
            setLayerStyleColor(color) {
                this.drawL.setStyle(
                    new Style({
                        stroke: new Stroke({ width: 1, color: 'lightblue' }),
                        fill: new Fill({ color: color }),
                    })
                );
            },
            onSubmit(formName) {
                console.log(this.form);
                if (this.drawS.getFeatures().length < 1) {
                    this.$message.error('未绘制图层');
                    return;
                }
                if (
                    this.form.measureNums.length !==
                    this.form.protocolNums.length
                ) {
                    this.$message.error('正在获取协议号中...');
                    return;
                }
                this.$refs[formName].validate((valid) => {
                    if (valid) {
                        uploadLayerData(this.form).then((r) => {
                            this.$message.success(r.msg);
                            this.$parent.loadPlots();
                        });
                        // {
                        //      groundNum:"",
                        //     layerName:"",
                        //     styleColor:"",
                        //     auth:"",
                        //     embed:"",
                        //     protocolNums:[],
                        //     measureNums:[],
                        //     geojson:"",
                        // }
                        this.$store.commit('map/CHANGE_MAP_STATE', {
                            key: 'drawingPolygon',
                            value: false,
                        });
                    } else {
                        return false;
                    }
                });
            },
            resetForm(formName) {
                this.$refs[formName].resetFields();
            },
            onCancel() {
                this.$store.commit('map/CHANGE_MAP_STATE', {
                    key: 'drawingPolygon',
                    value: false,
                });
            },
            initDrawLayer() {
                const drawS = (this.drawS = new VectorSource({ wrapX: false }));
                const vector = (this.drawL = new VectorLayer({
                    name: '自定义绘制图层',
                    source: drawS,
                }));
                map.addLayer(vector);
                // 绘制
                const draw = (this.drawLInteraction = new Draw({
                    source: drawS,
                    type: 'POLYGON',
                }));
                draw.on('drawend', (evt) => {
                    const geom = evt.feature.getGeometry();
                    const coordinates = geom.getCoordinates()[0];
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
            },
            // 开始地块标绘
            startDrawLayer() {
                map.addInteraction(this.drawLInteraction);
                map.addInteraction(this.modifyLInteraction);
            },
            saveDrawLayerGson() {
                const drawLfeas = this.drawL.getSource().getFeatures();
                const gson = new GeoJSON().writeFeatures(drawLfeas, {
                    featureProjection: 'EPSG:3857', // 3857(单位米),设置后返回的是经纬度
                });
                this.form.geojson = gson;
                this.setLayerStyleColor(this.form.styleColor);

                // 获取相交的建筑物的 测绘编号和档案编号 protocolNums: [], measureNums: [],
                // console.log(gson);
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
                            const { fwbh, 测绘编号, protocolNum } =
                                buidingLfea.getProperties();
                            const measureNum = fwbh || 测绘编号;
                            !this.form.measureNums.includes(measureNum) &&
                                this.form.measureNums.push(measureNum);
                        }
                    });
                });
                // 遍历完相交的要素
                getProtocolNumsByMeasureNums({
                    measureNums: this.form.measureNums,
                }).then((r) => {
                    this.form.protocolNums = r.data;
                });
            },
        },
    });
</script>

<style lang="scss" scoped></style>
