<template>
    <div class="toolbar" v-show="showFlyPathPanel">
        <table class="infoPanel" style="color: white">
            <tbody>
                <tr>
                    <td>路径录制模式：</td>
                </tr>
                <tr>
                    <td>W/S - 前进/后退</td>
                </tr>
                <tr>
                    <td>A/D - 向左/向右移动</td>
                </tr>
                <tr>
                    <td>Q/E - 上/下移动</td>
                </tr>
                <tr>
                    <td>按住鼠标左键并拖动鼠标改变移动的方向</td>
                </tr>
                <tr>
                    <td>
                        当前路径: {{ currentPathName || '无' }} , 帧数:
                        {{ currentPathFPS || '无' }}
                    </td>
                </tr>
            </tbody>
        </table>
        <div class="path-list">
            <el-dropdown
                @command="handlePathListCommand"
                style="margin-right: 10px"
            >
                <el-button size="mini" type="primary">
                    路径列表
                    <i class="el-icon-arrow-down el-icon--right"></i>
                </el-button>
                <el-dropdown-menu slot="dropdown">
                    <el-dropdown-item
                        :command="pathObj.id"
                        :key="pathObj.id"
                        v-for="pathObj in pathList"
                    >
                        {{ pathObj.name }}
                    </el-dropdown-item>
                </el-dropdown-menu>
            </el-dropdown>
            <el-button size="mini" @click="handleDeleteFlyPathClick">
                删除当前路径
            </el-button>
            <el-button size="mini" @click="handlePlayFlyPathClick">
                {{ playingCurrentPath ? '停止播放' : '播放当前路径' }}
            </el-button>
        </div>
        <div id="flypath-toolbar"></div>
    </div>
</template>
<script lang="ts">
    import { mapState } from 'pinia';
    import { useMapStore } from '@/stores';
    import Sandcastle from '@/views/map/sandcastle-toolbox';

    import { defineComponent } from 'vue';
    export default defineComponent({
        data() {
            this.onTickPlayPathListener = () => {};
            this.viewer = null;
            return {
                playingCurrentPath: false,
                pathList: [],
                currentPathCameraViews: [],
                currentPathId: '',
                currentPathName: '',
                currentPathFPS: '',
            };
        },
        computed: {
            ...mapState(useMapStore, {
                showFlyPathPanel: (state) => state.showFlyPathPanel,
            }),
        },
        watch: {
            showFlyPathPanel(n, o) {
                if (n) {
                    getFlyPaths().then((r) => (this.pathList = r.data));
                } else {
                    Object.assign(this.$data, this.$options.data());
                }
            },
        },
        methods: {
            handlePlayFlyPathClick() {
                if (!this.playingCurrentPath) {
                    this.playingCurrentPath = true;
                    let views = Object.values(this.currentPathCameraViews);
                    if (views.length < 1) {
                        this.$message.info('无效路径');
                        return;
                    }
                    this.onTickPlayPathListener = (clock) => {
                        const view = views.shift();
                        if (view) {
                            viewer.camera.setView(view);
                        } else {
                            views = Object.values(this.currentPathCameraViews);
                        }
                    };
                    this.viewer.clock.onTick.addEventListener(
                        this.onTickPlayPathListener
                    );
                } else {
                    this.playingCurrentPath = false;
                    this.viewer.clock.onTick.removeEventListener(
                        this.onTickPlayPathListener
                    );
                }
            },
            handleDeleteFlyPathClick() {
                if (!this.currentPathId) {
                    this.$message.info('当前无选中路径');
                    return;
                }
                // 删除前如果正在播放,则先停止播放
                this.playingCurrentPath && this.handlePlayFlyPathClick();
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
                this.currentPathFPS = views.length;
            },
            add3DFlyPath(viewer) {
                this.viewer = viewer;
                let scene = viewer.scene;
                let canvas = viewer.canvas;
                let startMousePosition;
                let mousePosition;
                let flags = {
                    looking: false,
                    moveForward: false,
                    moveBackward: false,
                    moveUp: false,
                    moveDown: false,
                    moveLeft: false,
                    moveRight: false,
                };
                let handler = new Cesium.ScreenSpaceEventHandler(canvas);
                let ellipsoid = scene.globe.ellipsoid;
                let camera = viewer.camera;
                let cameraViews = (window.cameraViews = {});
                let keydownListener = () => {};
                let keyupListener = () => {};
                let onTickListener = () => {};
                let onTickPlayPathListener = this.onTickPlayPathListener;
                let savedViewOpt = {};
                let pathPolyLine = null;

                const exitRecordMode = () => {
                    // 恢复场景信息
                    viewer.camera.setView({
                        destination: savedViewOpt.position,
                        orientation: {
                            direction: savedViewOpt.direction,
                            up: savedViewOpt.up,
                        },
                    });

                    scene.screenSpaceCameraController.enableRotate = true;
                    scene.screenSpaceCameraController.enableTranslate = true;
                    scene.screenSpaceCameraController.enableZoom = true;
                    scene.screenSpaceCameraController.enableTilt = true;
                    scene.screenSpaceCameraController.enableLook = true;

                    handler.removeInputAction(
                        Cesium.ScreenSpaceEventType.LEFT_DOWN
                    );
                    handler.removeInputAction(
                        Cesium.ScreenSpaceEventType.MOUSE_MOVE
                    );
                    handler.removeInputAction(
                        Cesium.ScreenSpaceEventType.LEFT_UP
                    );

                    document.removeEventListener(
                        'keydown',
                        keydownListener,
                        false
                    );
                    document.removeEventListener('keyup', keyupListener, false);

                    viewer.clock.onTick.removeEventListener(onTickListener);
                };

                Sandcastle.addToggleButton(
                    '路径录制模式',
                    false,
                    (checked) => {
                        if (checked) {
                            pathPolyLine = viewer.entities.add({
                                name: '路径轨迹',
                                polyline: {
                                    width: 10,
                                    material:
                                        new Cesium.PolylineArrowMaterialProperty(
                                            Cesium.Color.CYAN
                                        ),
                                },
                            });
                            // 保存场景信息
                            savedViewOpt.position = camera.positionWC.clone();
                            savedViewOpt.up = camera.up.clone();
                            savedViewOpt.direction = camera.direction.clone();

                            canvas.setAttribute('tabindex', '0'); //需要将focus放在画布上
                            canvas.onclick = () => {
                                canvas.focus();
                            };

                            //禁用默认事件处理程序
                            scene.screenSpaceCameraController.enableRotate =
                                false;
                            scene.screenSpaceCameraController.enableTranslate =
                                false;
                            scene.screenSpaceCameraController.enableZoom =
                                false;
                            scene.screenSpaceCameraController.enableTilt =
                                false;
                            scene.screenSpaceCameraController.enableLook =
                                false;

                            handler.setInputAction((movement) => {
                                flags.looking = true;
                                mousePosition = startMousePosition =
                                    Cesium.Cartesian3.clone(movement.position);
                            }, Cesium.ScreenSpaceEventType.LEFT_DOWN);

                            handler.setInputAction((movement) => {
                                mousePosition = movement.endPosition;
                            }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

                            handler.setInputAction((position) => {
                                flags.looking = false;
                            }, Cesium.ScreenSpaceEventType.LEFT_UP);

                            const getFlagForKeyCode = (keyCode) => {
                                switch (keyCode) {
                                    case 'W'.charCodeAt(0):
                                        return 'moveForward';
                                    case 'S'.charCodeAt(0):
                                        return 'moveBackward';
                                    case 'Q'.charCodeAt(0):
                                        return 'moveUp';
                                    case 'E'.charCodeAt(0):
                                        return 'moveDown';
                                    case 'D'.charCodeAt(0):
                                        return 'moveRight';
                                    case 'A'.charCodeAt(0):
                                        return 'moveLeft';
                                    default:
                                        return undefined;
                                }
                            };

                            keydownListener = (e) => {
                                let flagName = getFlagForKeyCode(e.keyCode);
                                if (typeof flagName !== 'undefined') {
                                    flags[flagName] = true;
                                }
                            };
                            document.addEventListener(
                                'keydown',
                                keydownListener,
                                false
                            );
                            keyupListener = (e) => {
                                let flagName = getFlagForKeyCode(e.keyCode);
                                if (typeof flagName !== 'undefined') {
                                    flags[flagName] = false;
                                }
                            };
                            document.addEventListener(
                                'keyup',
                                keyupListener,
                                false
                            );
                            onTickListener = (clock) => {
                                // 记录视图变化,用于后续播放
                                let {
                                    looking,
                                    moveForward,
                                    moveBackward,
                                    moveUp,
                                    moveDown,
                                    moveLeft,
                                    moveRight,
                                } = flags;
                                if (
                                    looking ||
                                    moveForward ||
                                    moveBackward ||
                                    moveUp ||
                                    moveDown ||
                                    moveLeft ||
                                    moveRight
                                ) {
                                    // Cesium.JulianDate.fromDate(new Date())
                                    cameraViews[+new Date()] = {
                                        destination: camera.positionWC.clone(),
                                        orientation: {
                                            up: camera.up.clone(),
                                            direction: camera.direction.clone(),
                                        },
                                    };
                                }
                                if (flags.looking) {
                                    // 不断得获取计算和设置拖动后的相机偏移
                                    let width = canvas.clientWidth;
                                    let height = canvas.clientHeight;

                                    // Coordinate (0.0, 0.0) will be where the mouse was clicked.
                                    let x =
                                        (mousePosition.x -
                                            startMousePosition.x) /
                                        width;
                                    let y =
                                        -(
                                            mousePosition.y -
                                            startMousePosition.y
                                        ) / height;

                                    let lookFactor = 0.05;
                                    camera.lookRight(x * lookFactor);
                                    camera.lookUp(y * lookFactor);
                                }

                                //根据相机到椭球表面的距离更改移动速度。
                                let cameraHeight =
                                    ellipsoid.cartesianToCartographic(
                                        camera.position
                                    ).height;
                                let moveRate = cameraHeight / 100.0;

                                if (flags.moveForward) {
                                    camera.moveForward(moveRate);
                                }
                                if (flags.moveBackward) {
                                    camera.moveBackward(moveRate);
                                }
                                if (flags.moveUp) {
                                    camera.moveUp(moveRate);
                                }
                                if (flags.moveDown) {
                                    camera.moveDown(moveRate);
                                }
                                if (flags.moveLeft) {
                                    camera.moveLeft(moveRate);
                                }
                                if (flags.moveRight) {
                                    camera.moveRight(moveRate);
                                }
                            };
                            viewer.clock.onTick.addEventListener(
                                onTickListener
                            );
                        } else {
                            exitRecordMode();
                            pathPolyLine.polyline.positions = Object.values(
                                cameraViews
                            ).map((i) => i.destination);
                        }
                    },
                    'flypath-toolbar'
                );
                Sandcastle.addToolbarButton(
                    '保存录制路径',
                    () => {
                        let views = Object.values(cameraViews);
                        if (views.length < 1) {
                            this.$message.error('保存失败,请先录制路径');
                            return;
                        }
                        const name = prompt('请输入路径名称');
                        if (!name) return;
                        const pathStr = JSON.stringify(cameraViews);
                        addFlyPath({ name: name, path: pathStr }).then((r) => {
                            this.$message.success(r.msg);
                            getFlyPaths().then((r) => (this.pathList = r.data));
                        });
                    },
                    'flypath-toolbar'
                );

                Sandcastle.addToolbarButton(
                    '播放录制路径',
                    () => {
                        viewer.entities.remove(pathPolyLine);
                        let views = Object.values(cameraViews);
                        if (views.length < 1) {
                            this.$message.info('请先录制路径');
                            return;
                        }
                        onTickPlayPathListener = (clock) => {
                            const view = views.shift();
                            if (view) {
                                viewer.camera.setView(view);
                                // window.requestAnimationFrame(step);
                            }
                        };
                        viewer.clock.onTick.addEventListener(
                            onTickPlayPathListener
                        );
                        // const step = () => {
                        //   const view = views.shift();
                        //   if (view) {
                        //     viewer.camera.setView(view);
                        //     window.requestAnimationFrame(step);
                        //   }
                        // };
                        // window.requestAnimationFrame(step);
                    },
                    'flypath-toolbar'
                );
                const clearFlyPath = () => {
                    viewer.entities.remove(pathPolyLine);
                    cameraViews = window.cameraViews = {};
                    viewer.clock.onTick.removeEventListener(
                        onTickPlayPathListener
                    );
                    this.$message.success('已清除');
                };
                Sandcastle.addToolbarButton(
                    '清除录制路径',
                    () => {
                        clearFlyPath();
                    },
                    'flypath-toolbar'
                );
                Sandcastle.addToolbarButton(
                    '保存录制路径为看板背景',
                    () => {
                        let views = Object.values(cameraViews);
                        if (views.length < 1) {
                            this.$message.error('保存失败,请先录制路径');
                            return;
                        }
                        localStorage.cameraViews = JSON.stringify(cameraViews);
                        this.$message.success('保存成功');
                    },
                    'flypath-toolbar'
                );
                Sandcastle.addToolbarButton(
                    '关闭',
                    (checked) => {
                        clearFlyPath();
                        exitRecordMode();
                        const $store = useMapStore();
                        $store.CHANGE_MAP_STATE({
                            key: 'showFlyPathPanel',
                            value: false,
                        });
                    },
                    'flypath-toolbar'
                );
            },
        },
    });
</script>
<style lang="scss" scoped>
    #flypath-toolbar {
        display: grid;
    }
    .path-list {
    }
</style>
