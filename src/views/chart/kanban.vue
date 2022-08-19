<template>
    <div class="kanbanvue">
        <map-view asKanban v-show="!isPureBg" />
        <div
            v-show="isPureBg"
            class="bg"
            :style="{
                background: '#212b3b url(' + bgUrl + ') top center / 100% 100%',
            }"
        ></div>

        <i
            title="切换显示/隐藏"
            class="el-icon-view box-toggler left-box-toggler"
            :class="{ 'toggler-bg': hideLeft }"
            @click="hideLeft = !hideLeft"
        ></i>
        <div class="left-box" v-show="!hideLeft">
            <div
                @mouseover="
                    () => {
                        showLeftEnlargeBtn1 = true;
                    }
                "
                @mouseleave="
                    () => {
                        showLeftEnlargeBtn1 = false;
                    }
                "
            >
                <span>共 {{ leftCount1 }} 栋</span>
                <i
                    v-show="showLeftEnlargeBtn1"
                    class="el-icon-zoom-in"
                    @click="handleEnlarge('left1')"
                ></i>
            </div>
            <div
                @mouseover="
                    () => {
                        showLeftEnlargeBtn2 = true;
                    }
                "
                @mouseleave="
                    () => {
                        showLeftEnlargeBtn2 = false;
                    }
                "
            >
                <span>累计签约 {{ leftCount2 }} 人</span>
                <i
                    v-show="showLeftEnlargeBtn2"
                    class="el-icon-zoom-in"
                    @click="handleEnlarge('left2')"
                ></i>
            </div>
            <div
                @mouseover="
                    () => {
                        showLeftEnlargeBtn3 = true;
                    }
                "
                @mouseleave="
                    () => {
                        showLeftEnlargeBtn3 = false;
                    }
                "
            >
                <i
                    v-show="showLeftEnlargeBtn3"
                    class="el-icon-zoom-in"
                    @click="handleEnlarge('left3')"
                ></i>
            </div>
        </div>

        <i
            title="切换显示/隐藏"
            class="el-icon-view box-toggler"
            :class="{ 'toggler-bg': hideRight }"
            style="right: 1.1%; bottom: 1.1%"
            @click="hideRight = !hideRight"
        ></i>
        <div class="right-box" v-show="!hideRight">
            <div
                @mouseover="
                    () => {
                        showRightEnlargeBtn1 = true;
                    }
                "
                @mouseleave="
                    () => {
                        showRightEnlargeBtn1 = false;
                    }
                "
            >
                <span>共 {{ rightCount1 }} 栋交楼</span>
                <i
                    v-show="showRightEnlargeBtn1"
                    class="el-icon-zoom-in"
                    @click="handleEnlarge('right1')"
                ></i>
            </div>
            <div
                @mouseover="
                    () => {
                        showRightEnlargeBtn2 = true;
                    }
                "
                @mouseleave="
                    () => {
                        showRightEnlargeBtn2 = false;
                    }
                "
            >
                <span>已拆卸 {{ rightCount2 }} 栋</span>
                <i
                    v-show="showRightEnlargeBtn2"
                    class="el-icon-zoom-in"
                    @click="handleEnlarge('right2')"
                ></i>
            </div>
            <div
                @mouseover="
                    () => {
                        showRightEnlargeBtn3 = true;
                    }
                "
                @mouseleave="
                    () => {
                        showRightEnlargeBtn3 = false;
                    }
                "
            >
                <i
                    v-show="showRightEnlargeBtn3"
                    class="el-icon-zoom-in"
                    @click="handleEnlarge('right3')"
                ></i>
            </div>
        </div>

        <i
            title="切换显示/隐藏"
            class="el-icon-view box-toggler"
            :class="{ 'toggler-bg': hideTop }"
            @click="hideTop = !hideTop"
            style="left: 0px; top: 0px"
        ></i>
        <i
            title="退出数据大屏"
            class="el-icon-switch-button box-toggler"
            style="right: 0px; top: 10px"
            @click="$router.push({ name: 'projectOverview' })"
        />
        <div class="top-box" v-show="!hideTop">
            <div class="title">城市更新可视化3D</div>
            <div class="date">
                <b>{{ nowTime }}</b>
                <span>{{ nowDate }}</span>

                <el-dropdown :hide-on-click="false">
                    <el-link :underline="false">
                        <i
                            class="el-icon-setting"
                            style="color: white"
                            title="设置"
                        ></i>
                    </el-link>
                    <el-dropdown-menu slot="dropdown">
                        <el-dropdown-item>
                            <el-checkbox v-model="isPureBg">
                                纯图片背景
                            </el-checkbox>
                        </el-dropdown-item>
                    </el-dropdown-menu>
                </el-dropdown>
            </div>
            <div v-if="isPureBg" class="upload-bg-btn">
                <el-button type="primary" size="mini">
                    <el-upload
                        ref="upload"
                        name="attach"
                        accept=".jpg, .jpeg, .png"
                        class="upload-container"
                        :limit="1"
                        :on-exceed="
                            () => {
                                $message.warning('只允许上传一个文件!');
                            }
                        "
                        :headers="headers"
                        :action="kanbanDoUploadUrl"
                        :data="{}"
                        :on-success="uploadSuccess"
                    >
                        上传背景
                    </el-upload>
                </el-button>
            </div>
        </div>

        <i
            title="切换显示/隐藏"
            class="el-icon-view box-toggler"
            :class="{ 'toggler-bg': hideBottom }"
            style="left: 30%; bottom: 1%"
            @click="hideBottom = !hideBottom"
        ></i>
        <div class="bottom-box" v-show="!hideBottom">
            <ul class="flex">
                <li>
                    <img src="../../assets/kanban/icon-hjrk.png" />
                    <span>户籍人口</span>
                    <b>{{ summary.persons }}人</b>
                </li>
                <li>
                    <img src="../../assets/kanban/icon-jzw.png" />
                    <span>建筑物数量</span>
                    <b>{{ summary.buildings }}栋</b>
                </li>
                <li>
                    <img src="../../assets/kanban/icon-fgmj.png" />
                    <span>覆盖面积</span>
                    <b>{{ summary.areas }}m²</b>
                </li>
                <li>
                    <img src="../../assets/kanban/icon-xmjd.png" />
                    <span>项目阶段</span>
                    <b>{{ summary.projectStage }}</b>
                </li>
            </ul>
        </div>

        <el-dialog
            :title="dialogEnlarge.title"
            :visible.sync="dialogEnlarge.visible"
            :append-to-body="true"
            fullscreen
            center
        >
            <div class="dialog-content"></div>
        </el-dialog>
    </div>
</template>

<script lang="ts">
    import mapView from '@/views/map/index.vue';
    import CesiumMap from '@/views/map/components/CesiumMap.vue';

    export default {
        components: { mapView, CesiumMap },
        data() {
            return {
                hideTop: false,
                hideBottom: false,
                hideLeft: false,
                hideRight: false,
                isPureBg: false,
                kanbanDoUploadUrl: '',
                bgUrl: '',
                headers: {
                    token: '',
                },
                nowDate: '',
                nowTime: '',
                summary: {},
                leftCount1: '',
                leftCount2: '',
                rightCount1: '',
                rightCount2: '',
                leftData1: {
                    yAxisName: '栋',
                    xAxisData: [],
                    series: [
                        {
                            name: '',
                            type: 'bar',
                            barWidth: '20%',
                            data: [],
                            label: {
                                show: true,
                                position: 'top',
                                color: '#fff',
                            },
                            itemStyle: {
                                barBorderRadius: [5, 5, 0, 0],
                            },
                        },
                    ],
                },
                leftData2: {
                    yAxisName: '人',
                    xAxisData: [],
                    series: [
                        {
                            name: '',
                            type: 'line',
                            data: [],
                            symbol: 'circle',
                            itemStyle: {
                                color: 'rgba(61,97,245)',
                            },
                            areaStyle: {
                                color: {
                                    x: 1,
                                    y: 1,
                                    colorStops: [
                                        {
                                            offset: 0,
                                            color: 'rgba(61,97,245,0)',
                                        },
                                        {
                                            offset: 1,
                                            color: 'rgba(61,97,245,.5)',
                                        },
                                    ],
                                },
                            },
                        },
                    ],
                },
                leftData3: {
                    yAxisName: '人',
                    xAxisData: [],
                    series: [
                        {
                            name: '观望',
                            type: 'bar',
                            barWidth: '20%',
                            data: [],
                            label: {
                                show: true,
                                position: 'top',
                                color: '#fff',
                            },
                            itemStyle: {
                                barBorderRadius: [5, 5, 0, 0],
                            },
                        },
                        {
                            name: '不同意见',
                            type: 'bar',
                            barWidth: '20%',
                            data: [],
                            label: {
                                show: true,
                                position: 'top',
                                color: '#fff',
                            },
                            itemStyle: {
                                barBorderRadius: [5, 5, 0, 0],
                            },
                        },
                        {
                            name: '同意(已签约)',
                            type: 'bar',
                            barWidth: '20%',
                            data: [],
                            label: {
                                show: true,
                                position: 'top',
                                color: '#fff',
                            },
                            itemStyle: {
                                barBorderRadius: [5, 5, 0, 0],
                            },
                        },
                        {
                            name: '同意(未签约)',
                            type: 'bar',
                            barWidth: '20%',
                            data: [],
                            label: {
                                show: true,
                                position: 'top',
                                color: '#fff',
                            },
                            itemStyle: {
                                barBorderRadius: [5, 5, 0, 0],
                            },
                        },
                    ],
                },
                rightData1: {
                    yAxisName: '栋',
                    xAxisData: [],
                    series: [
                        {
                            name: '',
                            type: 'bar',
                            barWidth: '20%',
                            data: [],
                            label: {
                                show: true,
                                position: 'top',
                                color: '#fff',
                            },
                            itemStyle: {
                                barBorderRadius: [5, 5, 0, 0],
                            },
                        },
                    ],
                },
                rightData2: {
                    yAxisName: '栋',
                    xAxisData: [],
                    series: [
                        {
                            name: '',
                            type: 'line',
                            data: [],
                            label: {
                                show: true,
                                position: 'top',
                                color: '#fff',
                            },
                            symbol: 'circle',
                            itemStyle: {
                                color: 'rgba(61,97,245)',
                            },
                            areaStyle: {
                                color: {
                                    x: 1,
                                    y: 1,
                                    colorStops: [
                                        {
                                            offset: 0,
                                            color: 'rgba(61,97,245,0)',
                                        },
                                        {
                                            offset: 1,
                                            color: 'rgba(61,97,245,.5)',
                                        },
                                    ],
                                },
                            },
                        },
                        // {
                        //   name: "",
                        //   type: "line",
                        //   data: [],
                        //   symbol: "circle",
                        //   itemStyle: {
                        //     color: "rgba(229,55,75,1)",
                        //   },
                        //   areaStyle: {
                        //     color: {
                        //       x: 1,
                        //       y: 1,
                        //       colorStops: [
                        //         { offset: 0, color: "rgba(229,55,75,0)" },
                        //         { offset: 1, color: "rgba(229,55,75,.5)" },
                        //       ],
                        //     },
                        //   },
                        // },
                    ],
                },
                rightData3: {
                    yAxisName: '人',
                    xAxisData: [],
                    series: [
                        {
                            name: '观望',
                            type: 'bar',
                            barWidth: '20%',
                            data: [],
                            label: {
                                show: true,
                                position: 'top',
                                color: '#fff',
                            },
                            itemStyle: {
                                barBorderRadius: [5, 5, 0, 0],
                            },
                        },
                        {
                            name: '不同意见',
                            type: 'bar',
                            barWidth: '20%',
                            data: [],
                            label: {
                                show: true,
                                position: 'top',
                                color: '#fff',
                            },
                            itemStyle: {
                                barBorderRadius: [5, 5, 0, 0],
                            },
                        },
                        {
                            name: '同意(已签约)',
                            type: 'bar',
                            barWidth: '20%',
                            data: [],
                            label: {
                                show: true,
                                position: 'top',
                                color: '#fff',
                            },
                            itemStyle: {
                                barBorderRadius: [5, 5, 0, 0],
                            },
                        },
                        {
                            name: '同意(未签约)',
                            type: 'bar',
                            barWidth: '20%',
                            data: [],
                            label: {
                                show: true,
                                position: 'top',
                                color: '#fff',
                            },
                            itemStyle: {
                                barBorderRadius: [5, 5, 0, 0],
                            },
                        },
                    ],
                },
                dialogEnlarge: {
                    visible: false,
                    title: '',
                    data: {},
                },
                showLeftEnlargeBtn1: false,
                showLeftEnlargeBtn2: false,
                showLeftEnlargeBtn3: false,
                showRightEnlargeBtn1: false,
                showRightEnlargeBtn2: false,
                showRightEnlargeBtn3: false,
            };
        },
        created() {
            /* 
    this.getSummaryData();
    this.getLeftData1();
    this.getLeftData2();
    this.getLeftData3();
    this.getRightData1();
    this.getRightData2();
    this.getRightData3();
    kanbanQueryKanbanBG().then((r) => (this.bgUrl = r.data?.filePath));
   */
        },
        methods: {
            handleEnlarge(type) {
                if (type === 'left1') {
                    this.dialogEnlarge.title = '建筑物累计详查数据';
                    this.dialogEnlarge.data = this.leftData1;
                } else if (type === 'left2') {
                    this.dialogEnlarge.title = '签约进度';
                    this.dialogEnlarge.data = this.leftData2;
                } else if (type === 'left3') {
                    this.dialogEnlarge.title = '签约意愿';
                    this.dialogEnlarge.data = this.leftData3;
                } else if (type === 'right1') {
                    this.dialogEnlarge.title = '交楼进度';
                    this.dialogEnlarge.data = this.rightData1;
                } else if (type === 'right2') {
                    this.dialogEnlarge.title = '拆卸进度';
                    this.dialogEnlarge.data = this.rightData2;
                } else if (type === 'right3') {
                    this.dialogEnlarge.title = '今日意愿';
                    this.dialogEnlarge.data = this.rightData3;
                }
                this.dialogEnlarge.visible = true;
            },
            // 附件上传成功
            uploadSuccess(response, file, fileList) {
                if (response.res === '0') {
                    this.$refs.upload.clearFiles();
                    this.$message.success('背景上传成功!');
                    kanbanQueryKanbanBG().then(
                        (r) => (this.bgUrl = r.data?.filePath)
                    );
                } else {
                    this.$message.error(response.msg);
                }
            },
            // 看板时间
            // 摘要数据
            getSummaryData() {
                getKanbanStat().then((res) => {
                    this.summary = res.data;
                });
            },
            // 左边图表1
            getLeftData1() {
                getKanBuildingTotal().then((res) => {
                    this.leftData1.xAxisData = res.data.name;
                    this.leftData1.series[0].data = res.data.valList;
                    this.leftCount1 = res.data.countTotal;
                });
            },
            // 左边图表2
            getLeftData2() {
                getKanCompensationDeal().then((res) => {
                    this.leftData2.xAxisData = res.data.name;
                    this.leftData2.series[0].data = res.data.yesVal;
                    this.leftCount2 = res.data.countTotal;
                });
            },
            // 左边图表3
            getLeftData3() {
                getKanbanAspiration().then((res) => {
                    this.leftData3.xAxisData = res.data.name;
                    this.leftData3.series[0].data = res.data.nonSupport;
                    this.leftData3.series[1].data = res.data.lookOn;
                    this.leftData3.series[2].data = res.data.support;
                    this.leftData3.series[3].data = res.data.supportNo;
                });
            },
            // 右边图表1
            getRightData1() {
                getKanDeliverySchedule().then((res) => {
                    this.rightData1.xAxisData = res.data.name;
                    this.rightData1.series[0].data = res.data.valList;
                    this.rightCount1 = res.data.countTotal;
                });
            },
            // 右边图表2
            getRightData2() {
                getKanDismantle().then((res) => {
                    this.rightData2.xAxisData = res.data.name;
                    this.rightData2.series[0].data = res.data.valList;
                    this.rightCount2 = res.data.countTotal;
                });
            },
            // 右边图表3
            getRightData3() {
                getKanbanAspirationNow().then((res) => {
                    this.rightData3.xAxisData = res.data.name;
                    this.rightData3.series[0].data = res.data.nonSupport;
                    this.rightData3.series[1].data = res.data.lookOn;
                    this.rightData3.series[2].data = res.data.support;
                    this.rightData3.series[3].data = res.data.supportNo;
                });
            },
        },
    };
</script>

<style lang="scss" scoped>
    .kanbanvue {
        height: 100%;
    }
    .bg {
        position: absolute;
        left: 0;
        top: 0;
        right: 0;
        bottom: 0;
        background: #212b3b url(../../assets/kanban/bg.png) top center / 100%
            100%;
    }
    .top-box {
        position: absolute;
        left: 0;
        top: 0;
        right: 0;
        height: 108px;
        background: url(../../assets/kanban/top-bg.png) top center;
        .title {
            line-height: 90px;
            text-align: center;
            color: #fddb83;
            font-size: 24px;
            font-weight: bold;
            font-family: Adobe Heiti Std;
        }
        .date {
            position: absolute;
            right: 30px;
            top: 8px;
            line-height: 1;
            color: #fff;
            font-weight: bold;
            text-align: right;
            b {
                display: block;
                font-size: 24px;
            }
            span {
                // display: block;
                margin-top: 4px;
                font-size: 14px;
            }
        }

        .upload-bg-btn {
            position: absolute;
            top: 70px;
            right: 1%;
        }
    }
    .left-box,
    .right-box,
    .bottom-box {
        position: absolute;
        background: rgba(34, 26, 26, 0.3);
        border-radius: 12px 12px 12px 12px;
    }
    .left-box,
    .right-box {
        top: 100px;
        bottom: 1%;
        width: 28%;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        div {
            position: relative;
            height: 32%;
        }
        span {
            position: absolute;
            top: 6%;
            right: 4%;
            font-size: 14px;
            color: #fff;
        }
        i.el-icon-zoom-in {
            color: #fff;
            position: absolute;
            left: 1%;
            top: 7.5%;
            cursor: pointer;
            z-index: 1;
        }
    }
    .left-box {
        left: 1%;
    }
    .left-box-toggler {
        left: 1.1%;
        bottom: 1.1%;
    }
    .box-toggler {
        color: white;
        position: absolute;
        cursor: pointer;
        z-index: 1;
        text-align: center;
        line-height: 30px;
        border-radius: 50%;
        width: 30px;
    }
    .toggler-bg {
        background: rgba(34, 26, 26, 0.1);
    }
    .right-box {
        right: 1%;
    }
    .bottom-box {
        bottom: 1%;
        left: 30%;
        width: 40%;
        padding: 20px;
        ul {
            list-style-type: none;
            padding: 0;
            margin: 0;
            li {
                flex-grow: 1;
                text-align: center;
                color: #fff;
                span {
                    display: block;
                }
                b {
                    font-size: 12px;
                }
            }
        }
    }
    .dialog-content {
        height: calc(100vh - 110px);
        background: rgba(34, 26, 26, 0.5);
        border-radius: 12px 12px 12px 12px;
    }
</style>
