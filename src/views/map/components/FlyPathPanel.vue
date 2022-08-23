<template>
    <div class="flypath-toolbar toolbar" v-show="showFlyPathPanel && !asKanban">
        <!-- 当前路径:{{ currentPathName || "无" }}
    <el-dropdown @command="handlePathListCommand">
      <el-button size="mini" type="primary" style="width: 100%;">
        路径列表<i class="el-icon-arrow-down el-icon--right"></i>
      </el-button>
      <el-dropdown-menu slot="dropdown">
        <el-dropdown-item
          :command="pathObj.id"
          :key="pathObj.id"
          v-for="pathObj in pathList"
          >{{ pathObj.name }}</el-dropdown-item
        >
      </el-dropdown-menu>
    </el-dropdown> 
    <el-button size="mini" @click="handleDeleteFlyPathClick"
      >删除当前路径</el-button
    >-->
        <el-button size="mini" type="primary" @click="hancleFlyStart">
            开始飞行
        </el-button>
        <el-button size="mini" type="primary" @click="hancleFlyPause">
            暂停/继续
        </el-button>
        <el-button size="mini" type="primary" @click="handleClear">
            清除
        </el-button>
        <el-button size="mini" type="primary" @click="handleSaveAsKanbanPath">
            保存为看板路径
        </el-button>
        <!-- <el-button size="mini" type="primary" @click="handleSavePath"
      >保存</el-button
    > -->
        <div class="flypath-toolbar-row2">
            速度:
            <el-input-number
                v-model="speed"
                @change="handleSpeedChange"
                :min="1"
                :max="20"
                size="mini"
                label="飞行速度"
            ></el-input-number>
            高度:
            <el-input-number
                v-model="height"
                @change="handleHeightChange"
                :min="10"
                :max="1000"
                :step="2"
                size="mini"
                label="飞行高度"
            ></el-input-number>
            角度x:
            <el-input-number
                v-model="jiaodux"
                @change="handleJiaoDuXChange"
                :min="-1000"
                :max="1000"
                :step="10"
                size="mini"
                label="飞行角度"
            ></el-input-number>
            角度y:
            <el-input-number
                v-model="jiaoduy"
                @change="handleJiaoDuYChange"
                :min="-1000"
                :max="1000"
                :step="10"
                size="mini"
                label="飞行角度"
            ></el-input-number>
        </div>
    </div>
</template>
<script lang="ts">
    import { mapState } from 'pinia';
    import { useMapStore } from '@/stores';
    import Sandcastle from '@/views/map/sandcastle-toolbox';
    import { viewer } from '@/views/map/components/CesiumMap.vue';
    import * as Cesium from 'cesium';
    import type {
        Cartographic,
        Viewer,
        Entity,
        Cartesian3,
        ScreenSpaceEventHandler,
        JulianDate,
    } from 'cesium';
    import { defineComponent } from 'vue';

    export default defineComponent({
        props: {
            asKanban: { type: Boolean, default: false },
        },
        data() {
            // 飞行
            let coordinates: Cartesian3[] = [];
            let stopPoints: Entity[] = [];
            let entityFlyLine: Entity | undefined;
            let start: JulianDate | undefined;
            let stop: JulianDate | undefined;
            return {
                start,
                stop,
                entityFlyLine,
                stopPoints,
                coordinates,
                playingCurrentPath: false,
                pathList: [],
                currentPathCameraViews: [],
                currentPathId: '',
                currentPathName: '',
                speed: Number(localStorage.getItem('flySpeed')) || 1,
                height: Number(localStorage.getItem('flyHeight')) || 20,
                jiaodux: Number(localStorage.getItem('flyJiaodux')) || -50,
                jiaoduy: Number(localStorage.getItem('flyJiaoduy')) || 0,
            };
        },
        computed: {
            ...mapState(useMapStore, {
                showFlyPathPanel: (state) => state.showFlyPathPanel,
            }),
            pathLength() {
                const length = this.coordinates.reduce(
                    (acc, cur, index, arr) => {
                        if (index < arr.length - 1)
                            acc += Cesium.Cartesian3.distance(
                                cur,
                                arr[index + 1]
                            );
                        return acc;
                    },
                    0
                );
                console.log(`路径长度为:${length}`);
                return length;
            },
        },
        watch: {
            showFlyPathPanel: {
                handler(n, o) {
                    if (!viewer) return;
                    if (n) {
                        // getFlyPaths().then(r => (this.pathList = r.data));
                        this.$message('点击地图添加路径途径点');
                        this.initFunc();
                    } else {
                        this.destoryFunc();
                        this.$message.success('清除成功');
                    }
                },
            },
        },
        methods: {
            handleClear() {
                this.clearFlyingOrFlyPath();
                // 重新添加事件
                viewer.screenSpaceEventHandler.setInputAction(
                    this.addFlyPointListener,
                    Cesium.ScreenSpaceEventType.LEFT_CLICK
                );
                this.$message.success('清除成功');
            },
            destoryFunc() {
                Object.assign(this.$data, this.$options.data());
                viewer.screenSpaceEventHandler.removeInputAction(
                    Cesium.ScreenSpaceEventType.LEFT_CLICK
                );
                // 添加为父类原来的监听
                viewer.screenSpaceEventHandler.setInputAction(
                    this.$parent.hightLightClickedBuildingListener,
                    Cesium.ScreenSpaceEventType.LEFT_CLICK
                );
                this.clearFlyingOrFlyPath();
            },
            addFlyPointListener(movement) {
                var scene = viewer.scene;
                let cartesian = viewer.camera.pickEllipsoid(
                    movement.position,
                    scene.globe.ellipsoid
                );
                if (cartesian) {
                    let cartographic =
                        Cesium.Cartographic.fromCartesian(cartesian);
                    cartographic.height = 40;
                    console.log('cartographic', cartographic);

                    cartesian =
                        scene.globe.ellipsoid.cartographicToCartesian(
                            cartographic
                        );
                    console.log('cartesian', cartesian);

                    this.coordinates.length === 0 &&
                        this.$message.success('添加成功，请继续添加途径点');
                    this.coordinates.push(cartesian);
                    if (this.coordinates.length >= 2) {
                        this.removeFlyPointFlyPath();
                        this.genPath();
                    } else {
                        const entityjson = {
                            show: !this.asKanban,
                            position: cartesian,
                            point: {
                                pixelSize: 6,
                                color: Cesium.Color.YELLOW,
                                outlineColor: Cesium.Color.YELLOW,
                                outlineWidth: 3,
                            },
                            label: {
                                text: '第' + 1 + '个站点',
                                font: '12pt sans-serif',
                                style: Cesium.LabelStyle.FILL_AND_OUTLINE, //FILL  FILL_AND_OUTLINE OUTLINE
                                fillColor: Cesium.Color.RED,
                                outlineColor: Cesium.Color.WHITE,
                                outlineWidth: 4,
                                horizontalOrigin: Cesium.HorizontalOrigin.LEFT, // CENTER LEFT RIGHT
                                verticalOrigin: Cesium.VerticalOrigin.BOTTOM, //BASELINE BOTTOM CENTER TOP
                                pixelOffset: new Cesium.Cartesian2(10, -10), //指定像素偏移量的属性
                            },
                        };
                        const entity = viewer.entities.add(entityjson);
                        this.stopPoints.push(entity);
                    }
                }
            },
            initFunc() {
                viewer.clock.multiplier = this.speed; // 倍速率播放默认速度/高度从local读
                // 点击增加路径点
                viewer.screenSpaceEventHandler.removeInputAction(
                    Cesium.ScreenSpaceEventType.LEFT_CLICK
                );

                viewer.screenSpaceEventHandler.setInputAction(
                    this.addFlyPointListener,
                    Cesium.ScreenSpaceEventType.LEFT_CLICK
                );
            },
            handleSpeedChange(v) {
                viewer.clock.multiplier = +this.speed || 5; // 倍速率播放
                localStorage.setItem('flySpeed', v);
            },
            handleHeightChange(v) {
                localStorage.setItem('flyHeight', v);
            },
            handleJiaoDuXChange(v) {
                localStorage.setItem('flyJiaodux', v);
            },
            handleJiaoDuYChange(v) {
                localStorage.setItem('flyJiaoduy', v);
            },
            handleDeleteFlyPathClick() {
                if (!this.currentPathId) {
                    this.$message.info('当前无选中路径');
                    return;
                }
                // 删除前如果正在播放,则先停止播放
                // this.playingCurrentPath && this.handlePlayFlyPathClick();
                deleteFlyPath({ id: this.currentPathId }).then((r) => {
                    this.$message.success(r.msg);
                    Object.assign(this.$data, this.$options.data());
                    getFlyPaths().then((r) => (this.pathList = r.data));
                });
            },
            handlePathListCommand(command) {
                getFlyPaths().then((r) => (this.pathList = r.data));

                const pathObj = this.pathList.find((i) => i.id === command);
                if (!pathObj) {
                    debugger;
                    return;
                }
                const cameraViews = JSON.parse(pathObj.path);
                let views = Object.values(cameraViews);
                this.currentPathCameraViews = cameraViews;
                this.currentPathId = pathObj.id;
                this.currentPathName = pathObj.name;
            },
            flyTickListener() {
                const { entityFlyLine } = this;
                if (!entityFlyLine) {
                    this.$message('请点击地图添加路径途径点');
                    viewer.clock.onTick.removeEventListener(
                        this.flyTickListener
                    );
                    return;
                }
                // 中心
                let center = entityFlyLine.position?.getValue(
                    viewer.clock.currentTime
                );
                // 当前位置的旋转矩阵
                let orientation = entityFlyLine.orientation?.getValue(
                    viewer.clock.currentTime
                );
                // 设置camera的坐标系
                if (center) {
                    let transform =
                        Cesium.Transforms.eastNorthUpToFixedFrame(center);
                    transform = Cesium.Matrix4.fromRotationTranslation(
                        Cesium.Matrix3.fromQuaternion(orientation),
                        center
                    );

                    viewer.camera.lookAtTransform(
                        transform,
                        new Cesium.Cartesian3(
                            this.jiaodux || -(this.pathLength / 10),
                            this.jiaoduy || 0,
                            this.height || this.pathLength / 10
                        )
                    );
                }
            },
            computeCircularTrack(coordinates, resultEntities) {
                let property = new Cesium.SampledPositionProperty();

                for (let i = 0; i < coordinates.length; i++) {
                    // start为当前时间 julianDate, seconds, result
                    let time = Cesium.JulianDate.addSeconds(
                        this.start,
                        this.pathLength * i,
                        new Cesium.JulianDate()
                    );
                    let position = coordinates[i];
                    property.addSample(time, position);
                    // 点数只有一个
                    // 点数2个或以上
                    coordinates.length >= 2 &&
                        resultEntities.push(
                            viewer.entities.add({
                                show: !this.asKanban,
                                position: position,
                                point: {
                                    pixelSize: 6,
                                    color: Cesium.Color.YELLOW,
                                    outlineColor: Cesium.Color.YELLOW,
                                    outlineWidth: 3,
                                },
                                label: {
                                    text: '第' + (i + 1) + '个站点',
                                    font: '12pt sans-serif',
                                    style: Cesium.LabelStyle.FILL_AND_OUTLINE, //FILL  FILL_AND_OUTLINE OUTLINE
                                    fillColor: Cesium.Color.RED,
                                    outlineColor: Cesium.Color.WHITE,
                                    outlineWidth: 4,
                                    horizontalOrigin:
                                        Cesium.HorizontalOrigin.LEFT, // CENTER LEFT RIGHT
                                    verticalOrigin:
                                        Cesium.VerticalOrigin.BOTTOM, //BASELINE BOTTOM CENTER TOP
                                    pixelOffset: new Cesium.Cartesian2(10, -10), //指定像素偏移量的属性
                                },
                            })
                        );
                }

                return property;
            },
            hancleFlyStart() {
                viewer.screenSpaceEventHandler.removeInputAction(
                    Cesium.ScreenSpaceEventType.LEFT_CLICK
                );
                this.entityFlyLine &&
                    this.stopPoints
                        .concat(this.entityFlyLine)
                        .forEach((i) => (i.show = false));
                viewer.clock.onTick.addEventListener(this.flyTickListener);
                viewer.animation.viewModel.pauseViewModel.toggled &&
                    viewer.animation.viewModel.pauseViewModel.command();
            },
            hancleFlyPause() {
                this.entityFlyLine &&
                    this.stopPoints
                        .concat(this.entityFlyLine)
                        .forEach(
                            (i) =>
                                (i.show =
                                    !viewer.animation.viewModel.pauseViewModel
                                        .toggled)
                        );
                viewer.animation.viewModel.pauseViewModel.command();
            },
            clearFlyingOrFlyPath() {
                viewer.homeButton.viewModel.command();
                this.removeFlyPointFlyPath();
                this.stopPoints = [];
                this.coordinates = [];
            },
            handleSaveAsKanbanPath() {
                if (this.coordinates.length < 2) {
                    this.$message.error('无效路径');
                    return;
                }
                const pathStr = JSON.stringify({
                    coordinates: this.coordinates,
                    speed: this.speed,
                    jiaodux: this.jiaodux,
                    jiaoduy: this.jiaoduy,
                    height: this.height,
                });
                localStorage.pathStr = JSON.stringify(pathStr);
                this.$message.success('保存成功');
            },
            handleSavePath() {
                if (this.coordinates.length < 2) {
                    this.$message.error('无效路径');
                    return;
                }
                const name = prompt('请输入路径名称');
                const pathStr = JSON.stringify({
                    coordinates: this.coordinates,
                    speed: this.speed,
                    jiaodux: this.jiaodux,
                    jiaoduy: this.jiaoduy,
                    height: this.height,
                });
                if (!name) return;
                addFlyPath({ name: name, path: pathStr }).then((r) => {
                    this.$message.success(r.msg);
                    getFlyPaths().then((r) => (this.pathList = r.data));
                });
            },
            genPath() {
                // 一系列坐标，轨迹回溯
                if (this.coordinates.length < 2) {
                    this.$message(`途径点数量不足,请再添加几个`);
                    return;
                }

                this.start = Cesium.JulianDate.fromDate(new Date());
                this.stop = Cesium.JulianDate.addSeconds(
                    this.start,
                    this.pathLength * (this.coordinates.length - 1),
                    new Cesium.JulianDate()
                );

                viewer.clock.startTime = this.start.clone();
                viewer.clock.stopTime = this.stop.clone();
                viewer.clock.currentTime = this.start.clone();
                viewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP; //Loop at the end

                viewer.timeline.zoomTo(this.start, this.stop);

                let position = this.computeCircularTrack(
                    this.coordinates,
                    this.stopPoints
                );
                // 一条折线
                this.entityFlyLine = viewer.entities.add({
                    show: !this.asKanban,
                    availability: new Cesium.TimeIntervalCollection([
                        new Cesium.TimeInterval({
                            start: this.start,
                            stop: this.stop,
                        }),
                    ]),
                    position: position,
                    orientation: new Cesium.VelocityOrientationProperty(
                        position
                    ),
                    path: {
                        resolution: 1,
                        material: new Cesium.PolylineGlowMaterialProperty({
                            glowPower: 0.5,
                            color: Cesium.Color.YELLOW,
                        }),
                        width: 4,
                    },
                });
                // 让这条折线变得有弧度
                if (this.entityFlyLine)
                    this.entityFlyLine.position.setInterpolationOptions({
                        interpolationDegree: 5,
                        interpolationAlgorithm:
                            Cesium.LagrangePolynomialApproximation,
                    });
                viewer.scene.requestRender();
            },
            removeFlyPointFlyPath() {
                // 恢复场景信息
                viewer.clock.onTick.removeEventListener(this.flyTickListener);
                !viewer.animation.viewModel.pauseViewModel.toggled &&
                    viewer.animation.viewModel.pauseViewModel.command();
                if (this.entityFlyLine)
                    viewer.entities.remove(this.entityFlyLine);
                this.stopPoints.forEach((stop) => {
                    viewer.entities.remove(stop);
                });
            },
        },
    });
</script>
<style lang="scss" scoped>
    .flypath-toolbar {
        &-row2 {
            display: grid;
            grid-template-columns: 45px 1fr;
            grid-gap: 10px;
            align-items: center;
        }
        display: grid;
        grid-gap: 10px;
        color: white;
    }
    ::v-deep {
        .el-button {
            margin-left: initial;
        }
    }
</style>
