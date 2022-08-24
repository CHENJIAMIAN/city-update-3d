<template>
    <el-tabs v-model="activeTabName" type="card" class="layer-control">
        <el-tab-pane label="图层控制" name="图层控制">
            <el-collapse
                v-model="activeCollapseNames"
                class="layer-ctrl"
                accordion
            >
                <template v-if="type === 'project'">
                    <el-collapse-item
                        title="图层管理"
                        style="text-align: center"
                        name="1"
                    >
                        <el-collapse v-model="activeLayerCollapseNames">
                            <el-collapse-item
                                title="基础底图"
                                style="text-align: center"
                            >
                                <el-checkbox-group v-model="baseLayerCheckList">
                                    <div
                                        :key="layer.name"
                                        v-for="layer in baseLayersFilterCollapse1"
                                        class="layr-ctrl-item"
                                    >
                                        <el-checkbox
                                            :label="layer"
                                            :disabled="layer.disabled"
                                        >
                                            {{ layer.title || layer.name }}
                                        </el-checkbox>
                                    </div>
                                </el-checkbox-group>
                            </el-collapse-item>
                            <el-collapse-item
                                title="历史影像"
                                style="text-align: center"
                                name="2"
                            >
                                <el-checkbox-group v-model="baseLayerCheckList">
                                    <div
                                        :key="layer.name"
                                        v-for="layer in baseLayersFilterCollapse2"
                                        class="layr-ctrl-item"
                                    >
                                        <el-checkbox
                                            :label="layer"
                                            :disabled="layer.disabled"
                                        >
                                            {{ layer.title || layer.name }}
                                        </el-checkbox>
                                    </div>
                                </el-checkbox-group>
                            </el-collapse-item>
                            <!-- <el-collapse-item title="CAD图层" style="text-align: center" name="3">
                <el-checkbox-group v-model="baseLayerCheckList">
                  <div
                    :key="layer.name"
                    v-for="layer in baseLayersFilterCollapse3"
                    class="layr-ctrl-item"
                  >
                    <el-checkbox
                      :label="layer"
                      :disabled="layer.disabled"
                    >{{ layer.title || layer.name }}</el-checkbox>
                  </div>
                </el-checkbox-group>
              </el-collapse-item> -->
                        </el-collapse>
                    </el-collapse-item>
                </template>

                <!-- 国家级 -->
                <template v-if="type === 'country'">
                    <el-collapse-item title="项目阶段">
                        <el-checkbox-group v-model="projProgressCheckList">
                            <el-checkbox
                                v-for="item in projectStageOption"
                                :key="item.id"
                                :label="item.paramValue"
                                :value="item.id"
                            />
                        </el-checkbox-group>
                    </el-collapse-item>
                    <el-collapse-item title="区域点选">
                        <el-checkbox-group v-model="regionCheckList">
                            <el-checkbox
                                :key="obj.value"
                                v-for="obj in regions"
                                :label="obj.label"
                            />
                        </el-checkbox-group>
                    </el-collapse-item>
                </template>

                <!-- 城市级 -->
                <template v-if="type === 'city'">
                    <el-collapse-item title="土规">
                        <el-checkbox-group v-model="landPlanCheckList">
                            <el-checkbox
                                :key="obj.value"
                                v-for="obj in landPlans"
                                :label="obj.label"
                            />
                        </el-checkbox-group>
                    </el-collapse-item>
                    <el-collapse-item title="控规">
                        <el-checkbox-group v-model="controlPlanCheckList">
                            <el-checkbox
                                :key="obj.value"
                                v-for="obj in controlPlans"
                                :label="obj.label"
                            />
                        </el-checkbox-group>
                    </el-collapse-item>
                </template>

                <!-- 项目级 -->
                <template v-if="type === 'project' && !showCompareMap">
                    <el-collapse-item
                        title="业务管理"
                        name="业务管理"
                        v-loading="businessManageCheckListLoading"
                    >
                        <el-popover
                            placement="right"
                            v-for="(typename, index) in condtionObjsTypeName"
                            :key="index"
                        >
                            <el-checkbox-group
                                v-model="businessManageCheckList"
                            >
                                <div
                                    :key="obj.id"
                                    v-for="obj in condtionObjs.filter(
                                        (i) => i.typename === typename
                                    )"
                                    class="layr-ctrl-item"
                                >
                                    <el-checkbox :label="obj.id">
                                        {{ obj.label }}
                                    </el-checkbox>
                                    <div
                                        :style="{
                                            width: '15px',
                                            height: '15px',
                                            background: obj.color,
                                        }"
                                    ></div>
                                </div>
                            </el-checkbox-group>
                            <li
                                :ref="`li-${typename}`"
                                tabindex="-1"
                                :class="{
                                    'el-dropdown-menu__item': true,
                                    'is-disabled': (() => {
                                        if (
                                            businessManageCheckList.length === 0
                                        )
                                            return false;
                                        if (!businessManageLastCheckedTypeName)
                                            return false;
                                        if (
                                            businessManageLastCheckedTypeName !==
                                            typename
                                        )
                                            return true;
                                        return false;
                                    })(),
                                }"
                                slot="reference"
                            >
                                {{ typename }}
                            </li>
                        </el-popover>
                        <el-button
                            size="mini"
                            style="width: 100%"
                            @click="handleResetBusinessManage"
                        >
                            重置
                        </el-button>
                    </el-collapse-item>

                    <el-collapse-item title="地块管理">
                        <el-checkbox-group v-model="plotCheckList">
                            <div
                                :key="groundObj.groundNum"
                                v-for="groundObj in grounds"
                                class="layr-ctrl-item"
                            >
                                <el-checkbox :label="groundObj.layerName" />
                                <el-color-picker
                                    v-show="groundObj.geojson"
                                    size="mini"
                                    show-alpha
                                    v-model="groundObj.styleColor"
                                    @change="colorChange($event, groundObj)"
                                ></el-color-picker>
                            </div>
                        </el-checkbox-group>
                    </el-collapse-item>
                </template>
            </el-collapse>
        </el-tab-pane>
        <el-tab-pane
            label="自定义筛选"
            name="自定义筛选"
            v-loading="filterLoading"
            v-if="type === 'project' && !showCompareMap"
        >
            <div style="text-align: center">
                <el-radio v-model="filterType" label="1">建筑物筛选</el-radio>
                <el-radio v-model="filterType" label="2">宗地筛选</el-radio>
            </div>
            <div
                class="custom-filter"
                name="建筑物筛选"
                v-show="filterType == '1'"
            >
                <div>人员性质</div>
                <el-select
                    v-model="buildingFilter.propertyId"
                    size="mini"
                    multiple
                >
                    <el-option
                        v-for="item in personnelNatureOption"
                        :key="item.id"
                        :label="item.paramValue"
                        :value="item.id"
                    />
                </el-select>
                <div>意愿征集</div>
                <el-select
                    v-model="buildingFilter.isRemoulds"
                    size="mini"
                    multiple
                >
                    <el-option
                        v-for="item in isRemouldOption"
                        :key="item.id"
                        :label="item.paramValue"
                        :value="item.id"
                    />
                </el-select>
                <div>改造意见</div>
                <el-input
                    size="mini"
                    v-model="buildingFilter.aspirationVal"
                ></el-input>
                <div>有无房产证</div>
                <el-select
                    v-model="buildingFilter.houseProprietaryCertificate"
                    size="mini"
                >
                    <el-option label="有" :value="1" />
                    <el-option label="无" :value="2" />
                </el-select>
                <div>有无土地证</div>
                <el-select v-model="buildingFilter.landDeed" size="mini">
                    <el-option label="有" :value="1" />
                    <el-option label="无" :value="2" />
                </el-select>
                <div>权属证件类型</div>
                <el-select
                    v-model="buildingFilter.rightTypeId"
                    size="mini"
                    multiple
                >
                    <el-option
                        v-for="item in listRightTypeOption"
                        :key="item.id"
                        :label="item.paramValue"
                        :value="item.id"
                    />
                </el-select>
                <div>房屋结构</div>
                <el-select
                    v-model="buildingFilter.houseStructure"
                    size="mini"
                    multiple
                >
                    <el-option
                        v-for="item in houseStructureTypeOption"
                        :key="item.id"
                        :label="item.paramValue"
                        :value="item.id"
                    />
                </el-select>
                <div>房屋层数</div>
                <el-input
                    size="mini"
                    v-model="buildingFilter.houseFloors"
                ></el-input>
                <div>现状不超过4层建筑面积</div>
                <div class="three-col">
                    <el-input
                        size="mini"
                        v-model="buildingFilter.nowNo4TierBuildingAreaStrat"
                        :placeholder="areaPlaceholderTxt"
                    ></el-input>
                    {{ '-' }}
                    <el-input
                        size="mini"
                        v-model="buildingFilter.nowNo4TierBuildingAreaEnd"
                        :placeholder="areaPlaceholderTxt"
                    ></el-input>
                </div>
                <div>现状4层以上建筑面积</div>
                <div class="three-col">
                    <el-input
                        size="mini"
                        v-model="buildingFilter.nowExceed4TierBuildingAreaStrat"
                        :placeholder="areaPlaceholderTxt"
                    ></el-input>
                    {{ '-' }}
                    <el-input
                        size="mini"
                        v-model="buildingFilter.nowExceed4TierBuildingAreaEnd"
                        :placeholder="areaPlaceholderTxt"
                    ></el-input>
                </div>
                <div>现状不超过3.5层建筑面积</div>
                <div class="three-col">
                    <el-input
                        size="mini"
                        v-model="buildingFilter.nowNo35TierBuildingAreaStrat"
                        :placeholder="areaPlaceholderTxt"
                    ></el-input>
                    {{ '-' }}
                    <el-input
                        size="mini"
                        v-model="buildingFilter.nowNo35TierBuildingAreaEnd"
                        :placeholder="areaPlaceholderTxt"
                    ></el-input>
                </div>
                <div>现状3.5层以上建筑面积</div>
                <div class="three-col">
                    <el-input
                        size="mini"
                        v-model="
                            buildingFilter.nowExceed35TierBuildingAreaStrat
                        "
                        :placeholder="areaPlaceholderTxt"
                    ></el-input>
                    {{ '-' }}
                    <el-input
                        size="mini"
                        v-model="buildingFilter.nowExceed35TierBuildingAreaEnd"
                        :placeholder="areaPlaceholderTxt"
                    ></el-input>
                </div>
                <div>社别</div>
                <el-input
                    size="mini"
                    v-model="buildingFilter.communityVal"
                ></el-input>
                <div>组团</div>
                <el-input
                    size="mini"
                    v-model="buildingFilter.zuTuan"
                ></el-input>
                <div>户号</div>
                <el-input
                    size="mini"
                    v-model="buildingFilter.accountNo"
                ></el-input>
            </div>
            <div
                class="custom-filter"
                name="宗地筛选"
                v-show="filterType == '2'"
            >
                <div>人员性质</div>
                <el-select
                    v-model="zongdiFlter.propertyId"
                    size="mini"
                    multiple
                >
                    <el-option
                        v-for="item in personnelNatureOption"
                        :key="item.id"
                        :label="item.paramValue"
                        :value="item.id"
                    />
                </el-select>
                <div>意愿征集</div>
                <el-input
                    size="mini"
                    v-model="zongdiFlter.aspirationVal"
                ></el-input>
                <div>权利性质</div>
                <el-select
                    v-model="zongdiFlter.rightProperty"
                    size="mini"
                    multiple
                >
                    <el-option
                        v-for="item in clanGroundRightPropertyOption"
                        :key="item.id"
                        :label="item.paramValue"
                        :value="item.id"
                    />
                </el-select>
                <div>权利类型</div>
                <el-select v-model="zongdiFlter.rightType" size="mini" multiple>
                    <el-option
                        v-for="item in clanGroundRightTypeOption"
                        :key="item.id"
                        :label="item.paramValue"
                        :value="item.id"
                    />
                </el-select>
                <div>宗地面积</div>
                <div class="three-col">
                    <el-input
                        size="mini"
                        v-model="zongdiFlter.clanGroundAredStrat"
                        :placeholder="areaPlaceholderTxt"
                    ></el-input>
                    {{ '-' }}
                    <el-input
                        size="mini"
                        v-model="zongdiFlter.clanGroundAredEnd"
                        :placeholder="areaPlaceholderTxt"
                    ></el-input>
                </div>
                <div>无合法手续用地发生在87年前</div>
                <div class="three-col">
                    <el-input
                        size="mini"
                        v-model="
                            zongdiFlter.notLegalFormalitiesGroundAred87FrontStrat
                        "
                        :placeholder="areaPlaceholderTxt"
                    ></el-input>
                    {{ '-' }}
                    <el-input
                        size="mini"
                        v-model="
                            zongdiFlter.notLegalFormalitiesGroundAred87FrontEnd
                        "
                        :placeholder="areaPlaceholderTxt"
                    ></el-input>
                </div>
                <div>无合法手续用地发生在87年-98年</div>
                <div class="three-col">
                    <el-input
                        size="mini"
                        v-model="
                            zongdiFlter.notLegalFormalitiesGroundAred8798Strat
                        "
                        :placeholder="areaPlaceholderTxt"
                    ></el-input>
                    {{ '-' }}
                    <el-input
                        size="mini"
                        v-model="
                            zongdiFlter.notLegalFormalitiesGroundAred8798End
                        "
                        :placeholder="areaPlaceholderTxt"
                    ></el-input>
                </div>
                <div>无合法手续用地发生在99年-09年</div>
                <div class="three-col">
                    <el-input
                        size="mini"
                        v-model="
                            zongdiFlter.notLegalFormalitiesGroundAred9909Strat
                        "
                        :placeholder="areaPlaceholderTxt"
                    ></el-input>
                    {{ '-' }}
                    <el-input
                        size="mini"
                        v-model="
                            zongdiFlter.notLegalFormalitiesGroundAred9909End
                        "
                        :placeholder="areaPlaceholderTxt"
                    ></el-input>
                </div>
            </div>
            <div style="text-align: center">
                <el-button
                    type="primary"
                    size="small"
                    @click="handleConfirmFilter"
                >
                    确认
                </el-button>
                <el-button size="small" @click="handleResetFilter">
                    重置
                </el-button>
            </div>
            <div class="buttom-group">
                <div>
                    所属{{ this.filterType == '1' ? '建筑物' : '宗地' }}数量:{{
                        filteredNum
                    }}
                </div>
                <el-button size="small" @click="handleExportBuildings">
                    导出建筑物信息
                </el-button>
            </div>
        </el-tab-pane>

        <!-- 导出弹窗 -->
        
    </el-tabs>
</template>

<script lang="ts">    import { mapState } from 'pinia';
    import { useMapStore } from '@/stores';
    import {
        redSelectedPolygonStyle,
        defaultSelectedPolygonStyle,
        getFWStyleFunc,
        getFWSelectedStyleFunc,
        cssColorNames,
    } from '@/views/map/olmap-common';
    import Feature from 'ol/Feature';

    import { Fill, Stroke, Style, Text, Icon } from 'ol/style';
    import { createDefaultStyle, createEditingStyle } from 'ol/style/Style';
    import { extend } from 'ol/array';
    import GeoJSON from 'ol/format/GeoJSON';
    import { map } from  '@/views/map/index.vue';

    import { defineComponent } from 'vue';
    export default defineComponent({
        name: 'LayerControl',
        components: {  },
        props: {
            type: {
                type: String,
                required: true,
                validator: function (value) {
                    // 限制
                    return (
                        value === 'country' ||
                        value === 'city' ||
                        value === 'project'
                    );
                },
            },
            baseLayers: {
                type: Array,
                required: true,
            },
            grounds: {
                type: Array,
                required: true,
            },
        },
        data() {
            this.m1s = []; //消息提示1
            this.highLightedIdFeasObjs = {}; //{id:[高亮的要素们]}
            return {
                isRemouldOption:[],
                dialogExport: {
                    visible: false,
                },
                projectStageOption: [], // 项目阶段下拉
                clanGroundRightTypeOption: [], // 权利类型
                clanGroundRightPropertyOption: [], // 权利性质
                houseStructureTypeOption: [], // 房屋结构
                listRightTypeOption: [], // 权属证件类型
                personnelNatureOption: '',
                areaPlaceholderTxt: '请输入面积',
                filterType: '1',
                baseLayerCheckList: [],
                downloadExportBuildingsUrl: 'http://www.baidu.com',
                filteredNum: 0,
                filterLoading: false,
                businessManageCheckListLoading: false,
                activeTabName: '图层控制',
                activeCollapseNames: [],
                activeLayerCollapseNames: ['1'],
                // 国家级
                projProgressCheckList: [],
                regionCheckList: [],
                // 城市级别
                landPlanCheckList: [],
                controlPlanCheckList: [],
                // 项目级
                businessManageCheckList: [],
                // 地块管理
                plotCheckList: [],

                /*  选项 */
                // 国家
                projProgresses: [
                    { label: '已完成', value: '' },
                    { label: '未完成', value: '' },
                ],
                regions: [
                    { label: '华中', value: '' },
                    { label: '华东', value: '' },
                    { label: '华南', value: '' },
                    { label: '西北', value: '' },
                    { label: '东北', value: '' },
                    { label: '西南', value: '' },
                    { label: '珠三角', value: '' },
                    { label: '长三角', value: '' },
                    { label: '京津冀', value: '' },
                ],
                // 城市
                landPlans: [
                    { label: '土规1', value: '' },
                    { label: '土规2', value: '' },
                ],
                controlPlans: [
                    { label: '控规1', value: '' },
                    { label: '控规2', value: '' },
                ],
                condtionObjs: [
                    // 业务管理,用来构造下拉选择ui,以及获取传参字段键值
                    {
                        id: 0,
                        label: '已签约',
                        typename: '拆补协议',
                        value: 2,
                        color: '#3ac569', //绿色
                        type: 'signStatus',
                    },
                    {
                        id: 1,
                        label: '未签约',
                        typename: '拆补协议',
                        value: 1,
                        color: '#0080ff', //蓝色
                        type: 'signStatus',
                    },
                    {
                        id: 2,
                        label: '已注销',
                        typename: '产权注销',
                        value: 1,
                        color: '#3ac569', //绿色
                        type: 'isRightCancel',
                    },
                    {
                        id: 3,
                        label: '未注销',
                        typename: '产权注销',
                        value: 2,
                        color: '#0080ff', //蓝色
                        type: 'isRightCancel',
                    },
                    {
                        id: 4,
                        label: '已拆卸',
                        typename: '拆卸管理',
                        value: 1,
                        color: '#3ac569', //绿色
                        type: 'isDismantle',
                    },
                    {
                        id: 5,
                        label: '未拆卸',
                        typename: '拆卸管理',
                        value: 2,
                        color: '#0080ff', //蓝色
                        type: 'isDismantle',
                    },
                    {
                        id: 6,
                        label: '已收房',
                        typename: '收房管理',
                        value: 1,
                        color: '#3ac569', //绿色
                        type: 'isRecvHouse',
                    },
                    {
                        id: 7,
                        label: '未收房',
                        typename: '收房管理',
                        value: 2,
                        color: '#0080ff', //蓝色
                        type: 'isRecvHouse',
                    },
                    {
                        id: 8,
                        label: '已测绘',
                        typename: '测绘查丈',
                        value: 1,
                        color: '#3ac569', //绿色
                        type: 'isMeasure',
                    },
                    {
                        id: 9,
                        label: '未测绘',
                        typename: '测绘查丈',
                        value: 2,
                        color: '#0080ff', //蓝色
                        type: 'isMeasure',
                    },
                    {
                        id: 10,
                        label: '支持',
                        typename: '意愿征集',
                        value: 1,
                        color: '#3ac569', //绿色
                        type: 'isAspiration',
                    },
                    {
                        id: 11,
                        label: '观望',
                        typename: '意愿征集',
                        value: 2,
                        color: '#0080ff', //蓝色
                        type: 'isAspiration',
                    },
                    {
                        id: 12,
                        label: '持不同意见',
                        typename: '意愿征集',
                        value: 4, //isAspiration后端还是用的标志位,所以单选它是4,而不是3
                        color: '#fbd14b', //黄色
                        type: 'isAspiration',
                    },
                    {
                        id: 13,
                        label: '已确权',
                        typename: '确权管理',
                        value: 1,
                        color: '#3ac569', //绿色
                        type: 'isAuth',
                    },
                    {
                        id: 14,
                        label: '未确权',
                        typename: '确权管理',
                        value: 2,
                        color: '#0080ff', //蓝色
                        type: 'isAuth',
                    },
                    {
                        id: 15,
                        label: '未交楼',
                        typename: '交楼状态',
                        value: 1,
                        color: '#3ac569', //绿色
                        type: 'recvhouseStatus',
                    },
                    {
                        id: 16,
                        label: '已交楼',
                        typename: '交楼状态',
                        value: 2,
                        color: '#0080ff', //蓝色
                        type: 'recvhouseStatus',
                    },
                    {
                        id: 17,
                        label: '未全部交楼',
                        typename: '交楼状态',
                        value: 3,
                        color: '#fbd14b', //黄色
                        type: 'recvhouseStatus',
                    },
                    //
                    {
                        id: 18,
                        label: '已签约已交楼',
                        typename: '混合图层',
                        value: 1,
                        color: '#fbd14b', //黄色
                        type: 'mixLayerStatus',
                    },
                    {
                        id: 19,
                        label: '已签约未交楼',
                        typename: '混合图层',
                        value: 2,
                        color: '#0080ff', //蓝色
                        type: 'mixLayerStatus',
                    },
                    {
                        id: 20,
                        label: '已收房已拆除',
                        typename: '混合图层',
                        value: 3,
                        color: '#3ac569', //绿色
                        type: 'mixLayerStatus',
                    },
                    {
                        id: 21,
                        label: '已收房未拆除',
                        typename: '混合图层',
                        value: 4,
                        color: '#fd3a69', //粉红色
                        type: 'mixLayerStatus',
                    },
                    {
                        id: 22,
                        label: '未签约已拆除',
                        typename: '混合图层',
                        value: 5,
                        color: '#9d0191', //紫色
                        type: 'mixLayerStatus',
                    },
                    {
                        id: 23,
                        label: '未交楼已拆除',
                        typename: '混合图层',
                        value: 6,
                        color: '#120078', //深蓝色
                        type: 'mixLayerStatus',
                    },

                    // 建筑管理,用来构造下拉选择ui,以及获取传参字段键值
                    // {
                    //   id: 15,
                    //   label: "国有房产",
                    //   typename: "权属性质",
                    //   value: 1,
                    //   color: "#3ac569", //绿色
                    //   type: "rightBelong"
                    // },
                    // {
                    //   id: 16,
                    //   label: "集体物业",
                    //   typename: "权属性质",
                    //   value: 2,
                    //   color: "#0080ff", //蓝色
                    //   type: "rightBelong"
                    // },
                    // {
                    //   id: 17,
                    //   label: "私宅",
                    //   typename: "权属性质",
                    //   value: 3,
                    //   color: "#fbd14b", //黄色
                    //   type: "rightBelong"
                    // },
                    // {
                    //   id: 18,
                    //   label: "公房",
                    //   typename: "权属性质",
                    //   value: 4,
                    //   color: "#E53A40",
                    //   type: "rightBelong"
                    // },
                    // {
                    //   id: 19,
                    //   label: "产权房",
                    //   typename: "权属性质",
                    //   value: 5,
                    //   color: "#791E94",
                    //   type: "rightBelong"
                    // }
                ],
                condtionObjsTypeName: [],
                theFilter: {},

                // 自定义筛选
                buildingFilter: {
                    // 建筑物
                    // Integer 类型字段
                    propertyId: '', //人员性质
                    isRemoulds: '',
                    houseStructure: '', //房屋结构
                    houseProprietaryCertificate: '', // 有无房产证 1有 2无
                    landDeed: '', //有无土地证 1有 2无
                    rightTypeId: '', // 权属证件类型id
                    // double类型字段
                    nowNo35TierBuildingAreaStrat: '', // 现状不超3.5层建筑面积区间开始
                    nowNo35TierBuildingAreaEnd: '', //现状不超3.5层建筑面积区间结束
                    nowExceed35TierBuildingAreaStrat: '', //现状超3.5层建筑面积区间开始
                    nowExceed35TierBuildingAreaEnd: '', //现状超3.5层建筑面积区间结束
                    nowNo4TierBuildingAreaStrat: '', //现状不超四层建筑面积区间开始
                    nowNo4TierBuildingAreaEnd: '', //现状不超四层建筑面积区间结束
                    nowExceed4TierBuildingAreaStrat: '', //现状超四层建筑面积区间开始
                    nowExceed4TierBuildingAreaEnd: '', //现状超四层建筑面积区间结束
                    houseFloors: '', //房屋层数
                    // string 类型字段
                    aspirationVal: '', // 意愿征集
                    communityVal: '', //  设别
                    zuTuan: '', //组团
                    accountNo: '', //户号
                },
                zongdiFlter: {
                    // 宗地
                    // Integer 类型字段
                    propertyId: '', // 人员性质
                    rightType: '', //权利类型
                    rightProperty: '', //  权利性质
                    // double类型字段
                    clanGroundAredStrat: '', //    宗地面积区间开始
                    clanGroundAredEnd: '', // 宗地面积区间结束
                    notLegalFormalitiesGroundAredStrat: '', //    现状超3.5层建筑面积区间开始
                    notLegalFormalitiesGroundAredEnd: '', //    现状超3.5层建筑面积区间结束
                    notLegalFormalitiesGroundAred87FrontStrat: '', //  无合法手续用地发生在87年前区间开始
                    notLegalFormalitiesGroundAred87FrontEnd: '', //   无合法手续用地发生在87年前区间结束
                    notLegalFormalitiesGroundAred8798Strat: '', //   无合法手续用地发生在87-98年区间开始
                    notLegalFormalitiesGroundAred8798End: '', //  无合法手续用地发生在87-98年区间结束
                    notLegalFormalitiesGroundAred9909Strat: '', //   无合法手续用地发生在87-98年区间开始
                    notLegalFormalitiesGroundAred9909End: '', //  无合法手续用地发生在87-98年区间结束
                    // string 类型字段
                    aspirationVal: '', // 意愿征集
                },
                businessManageLastCheckedTypeName: '',
            };
        },
        watch: {
            activeTabName(n) {
                n === '图层控制' && this.handleResetFilter();
            },
            // 只可多选同一类型的值
            async businessManageCheckList(checkeds, olds) {
                if (olds.length > checkeds.length) {
                    // 取消勾选
                    const unCheckId = olds.filter((i) => !checkeds.includes(i));
                    // checkedObjs的type只有可能是同一种类型
                    const currentUnCheckObj = this.condtionObjs.find(
                        (i) => i.id === unCheckId[0]
                    );
                    this.$nextTick((_) => {
                        const elem =
                            this.$refs[`li-${currentUnCheckObj.typename}`]?.[0];
                        if (!elem) {
                            // A页面请求,还没出来,就点到B页面,elem就会是不存在的,要做判断
                            debugger;
                            return;
                        }
                        elem.click();
                    });
                    // console.log(currentUnCheckObj.label);
                    this.highLightedIdFeasObjs[currentUnCheckObj.id] &&
                        this.highLightedIdFeasObjs[
                            currentUnCheckObj.id
                        ].forEach((fea) => fea.setStyle(getFWStyleFunc(fea)));
                    delete this.highLightedIdFeasObjs[currentUnCheckObj.id];
                    return;
                } else {
                    // 勾选
                    // 选的时候要禁止勾选其他任何互斥类型的
                    const checked = checkeds[checkeds.length - 1];
                    const checkedObj = this.condtionObjs.find(
                        (i) => i.id === checked
                    );
                    if (!checkedObj) return;
                    // 当前已选类型
                    // console.log("上次勾选了", this.businessManageLastCheckedTypeName);
                    // 当前选中类型
                    // console.log("这次勾选了", checkedObj.typename);
                    // 新勾选的与businessManageLastCheckedTypeName对比可判断是否互斥
                    this.businessManageLastCheckedTypeName =
                        checkedObj.typename;

                    const checkedObjs = this.condtionObjs.filter((i) =>
                        checkeds.includes(i.id)
                    );
                    // checkedObjs的type只有可能是同一种类型
                    const currentCheckObj = checkedObjs.find(
                        (i) => i.id === checkeds.slice(-1)[0] //新选中的总是checked的最后一个
                    );
                    // 开始构造参数
                    const type = currentCheckObj.type;
                    const obj = {
                        [type]: currentCheckObj.value,
                    };

                    if (type === 'mixLayerStatus') {
                        const obj2 =
                            this.handleMixLayerStatusRequestParams(obj);
                        const measureNums = await this.listAllCurrentBuilding(
                            obj2,
                            currentCheckObj
                        );
                        this.hightLightByMeasureNums(
                            measureNums,
                            currentCheckObj
                        );
                    } else {
                        const measureNums = await this.listAllCurrentBuilding(
                            obj,
                            checkedObj
                        );
                        this.hightLightByMeasureNums(
                            measureNums,
                            currentCheckObj
                        );
                    }
                    this.$nextTick((_) => {
                        this.$refs[
                            `li-${currentCheckObj.typename}`
                        ]?.[0].click();
                    });
                }
            },
            baseLayers(layers) {
                layers.forEach((layer) => {
                    const { name: layername, title, type, zIndex } = layer;
                    // 房屋,影像,附属物默认勾选
                    if (
                        layername.includes('_fanwei') ||
                        layername.includes('_fw') ||
                        layername.includes('_yx') ||
                        layername.includes('_fsw')
                    ) {
                        this.baseLayerCheckList.push(layer);
                    }
                });
            },
            baseLayerCheckList(checkeds, olds) {
                if (!map) {
                    console.error(
                        'src/views/map/components/LayerControl.vue baseLayerCheckList 的map不存在'
                    );
                    return;
                }
                //判断新选中或取消选中的,是没有配的(获取不到图层的),提示去配
                let newCheck = {};
                let checkedFlag = false;
                if (checkeds.length > olds.length) {
                    // 选中
                    newCheck = checkeds.find((i) => !olds.includes(i));
                    checkedFlag = true;
                } else {
                    // 取消选中
                    newCheck = olds.find((i) => !checkeds.includes(i));
                    checkedFlag = false;
                }
                if (newCheck) {
                    const newCheckLayer = map.getLayerByProperty(
                        'name',
                        newCheck.name
                    );
                    if (!newCheckLayer && checkedFlag) {
                        this.$message.error('请联系数据管理员导入相关图层数据');
                        return;
                    }
                }

                const unchecked = this.baseLayers.filter(
                    (i) => !checkeds.includes(i)
                );
                checkeds.forEach((i) => {
                    const layer = map.getLayerByProperty('name', i.name);
                    layer && layer.setVisible(true);
                });
                unchecked.forEach((i) => {
                    const layer = map.getLayerByProperty('name', i.name);
                    layer && layer.setVisible(false);
                });
            },
            plotCheckList(layerNames) {
                if (layerNames.length > 1) {
                    this.plotCheckList.shift();
                    return;
                }
                // 改变地块图层的显示
                // 先隐藏所有
                this.grounds
                    .map((i) => i.layerName)
                    .forEach((layerName) => {
                        const layer = map.getLayerByProperty('name', layerName);
                        layer.setVisible(false);
                    });
                // 再显示勾中的
                layerNames.forEach((layerName) => {
                    const layer = map.getLayerByProperty('name', layerName);
                    const ground = this.grounds.find(
                        (i) => i.layerName === layerName
                    );
                    this.$message.success(
                        `关联房屋数量:${ground.measureNums.length}`
                    );
                    layer.setVisible(true);
                    // 设置地块自己的颜色,设置关联建筑物的颜色的在visible回调里
                    layer.setStyle(function (feature) {
                        const style = new Style({
                            stroke: new Stroke({
                                width: 1,
                                color: 'lightblue',
                            }),
                            fill: new Fill({ color: ground.styleColor }),
                            text: new Text({
                                font: 'normal 16px Arial',
                                text: ground.layerName,
                                fill: new Fill({
                                    color: 'white',
                                }),
                            }),
                        });
                        return style;
                    });
                });
            },
            projProgressCheckList(projProgresses, o) {
                let findedFlag = false;
                this.cityLfeas.forEach((cityFea) => {
                    const {
                        projectStageVals,
                        projectStageVal,
                        projectNum,
                        locationName,
                        projectName,
                    } = cityFea.getProperties();
                    let bool = false;
                    if (projectStageVals.length > 1) {
                        bool = projProgresses.some((i) => {
                            return projectStageVals.includes(i);
                        });
                    } else {
                        bool = projProgresses.includes(projectStageVal);
                    }
                    if (bool) {
                        findedFlag = true;
                        cityFea.setStyle(
                            new Style({
                                image: new Icon({
                                    src: './position.png',
                                }),
                                text: new Text({
                                    textAlign: 'left',
                                    offsetX: 15,
                                    font: 'normal 16px Arial',
                                    text:
                                        projectNum > 1
                                            ? projectNum.toString()
                                            : (locationName &&
                                                  locationName.toString()) ||
                                              (projectName &&
                                                  projectName.toString()),
                                    fill: new Fill({
                                        color: 'blue',
                                    }),
                                }),
                            })
                        );
                    } else {
                        // 使用图层的默认样式
                        cityFea.setStyle(undefined);
                    }
                });
                if (!findedFlag && projProgresses.length > o.length) {
                    //是新勾选的
                    this.$message.error('查无数据');
                }
            },
            regionCheckList(regions, o) {
                let findedFlag = false;
                this.cityLfeas.forEach((cityFea) => {
                    const {
                        cityRegionVal,
                        projectStageVal,
                        projectNum,
                        locationName,
                        projectName,
                    } = cityFea.getProperties();
                    if (regions.includes(cityRegionVal)) {
                        findedFlag = true;
                        cityFea.setStyle(
                            new Style({
                                image: new Icon({
                                    src: './position.png',
                                }),
                                text: new Text({
                                    textAlign: 'left',
                                    offsetX: 15,
                                    font: 'normal 16px Arial',
                                    text:
                                        projectNum > 1
                                            ? projectNum.toString()
                                            : (locationName &&
                                                  locationName.toString()) ||
                                              (projectName &&
                                                  projectName.toString()),
                                    fill: new Fill({
                                        color: 'blue',
                                    }),
                                }),
                            })
                        );
                    } else {
                        // 使用图层的默认样式
                        cityFea.setStyle(undefined);
                    }
                });
                if (!findedFlag && regions.length > o.length) {
                    //是新勾选的
                    this.$message.error('查无数据');
                }
            },
        },
        computed: {
            ...mapState(useMapStore, {
                showCompareMap: (state) => state.showCompareMap,
            }),

            cityL() {
                return map.getLayerByProperty('name', 'city');
            },
            cityLfeas() {
                return this.cityL.getSource().getFeatures();
            },
            baseLayersFilterCollapse1() {
                return this.baseLayers.filter((i) => {
                    const layername = i.name;
                    return (
                        layername.includes('_fanwei') ||
                        layername.includes('_fw') ||
                        layername.includes('_yx') ||
                        layername.includes('_fsw')
                    );
                });
            },
            baseLayersFilterCollapse2() {
                return this.baseLayers.filter((i) =>
                    i.title.includes('历史影像')
                );
            },
            baseLayersFilterCollapse3() {
                return this.baseLayers.filter(
                    (i) =>
                        !this.baseLayersFilterCollapse1.includes(i) &&
                        !this.baseLayersFilterCollapse2.includes(i)
                );
            },
        },
        created() {
            if (this.type === 'country') {
                this.getProjectStageOption();
            } else if (this.type === 'city') {
            } else if (this.type === 'project') {
                this.condtionObjsTypeName = [
                    ...new Set(this.condtionObjs.map((i) => i.typename)),
                ];
                // this.getPersonnelNatureOption();
                // this.getListRightTypeOption();
                // this.getHouseStructureTypeOption();
                // this.getClanGroundRightPropertyOption();
                // this.getClanGroundRightTypeOption();
                // this.getOwnershipPropertyOption();
            } else {
                debugger;
            }
        },
        mounted() {},
        beforeDestroy() {
            this.m1s.forEach((i) => i.close());
            this.m1s = [];
        },
        destroyed() {},
        methods: {
            colorChange(v, groundObj) {
                const layer = map.getLayerByProperty(
                    'name',
                    groundObj.layerName || ''
                );
                layer && layer.changed();
            },
            exportSubmit(options) {
                switch (this.filterType) {
                    case '1':
                        this.theFilter = this.buildingFilter;
                        break;
                    case '2':
                        this.theFilter = this.zongdiFlter;
                        break;
                }
                const params = Object.assign(
                    {
                        BuildingHeaderList: options,
                    },
                    this.theFilter
                );
                queryGisBuildingExcel(params).then((res) => {
                    this.dialogExport.visible = false;
                    setTimeout(() => {
                        this.$alert(res.msg, '提示');
                    }, 200);
                });
            },
            handleMixLayerStatusRequestParams(obj) {
                // 混合状态,是取并集
                let r = {};
                switch (obj.mixLayerStatus) {
                    case 1: //1已签约已交楼
                        r = {
                            signStatus: 2,
                            recvhouseStatus: 2,
                        };
                        break;
                    case 2: //2已签约未交楼
                        r = {
                            signStatus: 2,
                            recvhouseStatus: 1,
                        };
                        break;
                    case 3: //3已收房已拆除
                        r = {
                            isRecvHouse: 1,
                            isDismantle: 1,
                        };
                        break;
                    case 4: //4已收房未拆除
                        r = {
                            isRecvHouse: 1,
                            isDismantle: 2,
                        };
                        break;
                    case 5: //5未签约已拆除
                        r = {
                            signStatus: 1,
                            isDismantle: 1,
                        };
                        break;
                    case 6: //6未交楼已拆除
                        r = {
                            recvhouseStatus: 1,
                            isDismantle: 1,
                        };
                        break;
                }
                return r;
            },
            async listAllCurrentBuilding(obj, checkedObj) {
                this.businessManageCheckListLoading = true;
                setTimeout((_) => {
                    // 防止listAllBuilding报错造成loading=false没有运行到
                    this.businessManageCheckListLoading = false;
                }, 30 * 1000);
                const r = await listAllBuilding(obj);
                if (r.data.length >= 0) {
                    const m = this.$message.success({
                        showClose: true,
                        customClass: 'btm-msg',
                        message: `${checkedObj.typename}-${checkedObj.label}: 查询到${r.data.length}条结果`,
                        duration: 0,
                    });
                    this.m1s.push(m);
                }
                this.businessManageCheckListLoading = false;
                //高亮这些要素
                const measureNums = r.data.map((i) => i.measureNum);
                return measureNums;
            },
            hightLightByMeasureNums(measureNums, currentCheckObj) {
                const color = currentCheckObj.color;
                const feas = map?.getAllBuildingFeas() || [];
                const selectedFeas = feas.filter((i) =>
                    measureNums.includes(
                        i.getProperties().fwbh || i.getProperties()['测绘编号']
                    )
                );
                selectedFeas.forEach((fea) => {
                    const props = fea.getProperties();
                    const fwbh = props.fwbh || props['测绘编号'];
                    const style = new Style({
                        fill: new Fill({
                            color: color,
                        }),
                        stroke: new Stroke({
                            color: color,
                            width: 1,
                        }),
                        text: new Text({
                            textAlign: 'left',
                            text: fwbh,
                            fill: new Fill({
                                color: 'white',
                            }),
                        }),
                    });
                    fea.setStyle(style);
                });
                this.highLightedIdFeasObjs[currentCheckObj.id] = selectedFeas;
            },
            // 获取项目阶段下拉
            getProjectStageOption() {
                getProjectStageOption().then((res) => {
                    this.projectStageOption = res.data;
                });
            },
            getOwnershipPropertyOption() {
                getOwnershipPropertyOption().then((res) => {
                    const arr1 = res.data.map((i, index) => {
                        i.label = i.paramValue;
                        i.typename = '权属性质';
                        i.value = i.id;
                        i.id = i.id + 21545; //
                        i.color = [
                            '#3ac569',
                            '#0080ff',
                            '#fbd14b',
                            '#E53A40',
                            '#791E94',
                        ][index];
                        i.type = 'rightBelong';
                        return i;
                    });
                    window.condtionObjs = this.condtionObjs;
                    this.condtionObjs.push(...arr1);
                    this.condtionObjsTypeName.push('权属性质');
                });
            },
            getClanGroundRightTypeOption() {
                getClanGroundRightTypeOption().then((res) => {
                    this.clanGroundRightTypeOption = res.data;
                });
            },
            getClanGroundRightPropertyOption() {
                getClanGroundRightPropertyOption().then((res) => {
                    this.clanGroundRightPropertyOption = res.data;
                });
            },
            // 获取房屋结构下拉
            getHouseStructureTypeOption() {
                getHouseStructureTypeOption().then((res) => {
                    this.houseStructureTypeOption = res.data;
                });
            },
            // 获取权属证件类型下拉
            getListRightTypeOption() {
                getListRightTypeOption().then((res) => {
                    this.listRightTypeOption = res.data;
                });
            },
            // 获取人员性质下拉
            getPersonnelNatureOption() {
                getPersonnelNatureOption().then((res) => {
                    this.personnelNatureOption = res.data;
                });
            },
            handleExportBuildings() {
                this.dialogExport.visible = true;
            },
            async handleConfirmFilter() {
                let filterAPIFunc;
                switch (this.filterType) {
                    case '1':
                        this.theFilter = this.buildingFilter;
                        filterAPIFunc = listAllBuilding;
                        break;
                    case '2':
                        this.theFilter = this.zongdiFlter;
                        filterAPIFunc = listAllClanGround;
                        break;
                }
                console.log(this.theFilter);
                const feas = map.resetAllBuildingStyleAndReturnAllFeas();
                if (!feas) {
                    this.$message.error(
                        '建筑物图层未加载,请联系管理员配置地图'
                    );
                    return;
                }
                // 返回的建筑设置新样式
                this.filterLoading = true;
                setTimeout((_) => {
                    // 防止listAllBuilding报错造成loading=false没有运行到
                    this.filterLoading = false;
                }, 10 * 1000);
                const r = await filterAPIFunc(this.theFilter);
                if (r.data.length > 0) {
                    this.$message.success({
                        showClose: true,
                        // customClass: "btm-msg",
                        message: `查询到${r.data.length}条结果`,
                        // duration: 0,
                    });
                }
                this.filterLoading = false;
                //高亮这些要素
                this.filteredNum = r.data.length;
                const measureNums = r.data.map((i) => i.measureNum);
                const selectedFeas = feas.filter((i) =>
                    measureNums.includes(
                        i.getProperties().fwbh || i.getProperties()['测绘编号']
                    )
                );
                selectedFeas.forEach((fea) =>
                    fea.setStyle(getFWSelectedStyleFunc(fea))
                );
                if (r.data.length < 1) {
                    this.$message.error('未查询到相关建筑');
                }
            },
            handleResetBusinessManage() {
                this.m1s.forEach((i) => i.close());
                this.m1s = [];
                this.businessManageLastCheckedTypeName = '';
                this.businessManageCheckList = [];
                map.resetAllBuildingStyleAndReturnAllFeas();
                // 模拟点击, 让popover消失
                setTimeout((_) => document.body.click());
            },
            handleResetFilter() {
                this.handleResetBusinessManage();
                this.filteredNum = 0;
                Object.assign(
                    this.$data.theFilter,
                    this.$options.data().theFilter
                );
                Object.assign(
                    this.$data.buildingFilter,
                    this.$options.data().buildingFilter
                );
                Object.assign(
                    this.$data.zongdiFlter,
                    this.$options.data().zongdiFlter
                );
            },
        },
    });
</script>

<style lang="scss" scoped>
    .layer-control {
        position: absolute;
        margin: 20px;
        z-index: 1;

        // 修改el-tab适配ui
        ::v-deep {
            .el-dropdown-menu__item {
                text-align: center;
            }
            .el-tabs__header {
                border: none;
                margin-bottom: 5px;

                .el-tabs__nav {
                    display: -ms-grid;
                    display: grid;
                    grid-auto-flow: column;
                    float: inherit;
                    border: none;
                    gap: 5px;
                    // -ms尝试适配ie11,太麻烦了,算了...
                    div:nth-child(1) {
                        -ms-grid-column: 1;
                        grid-column: 1;
                    }
                    div:nth-child(2) {
                        -ms-grid-column: 2;
                        grid-column: 2;
                    }
                    .el-tabs__item {
                        text-align: center;
                        border: none;
                        border-radius: 10px;
                        background: rgba(255, 255, 255, 0.8);
                    }
                }
            }

            .el-tabs__content {
                border-radius: 10px;
                background: rgba(255, 255, 255, 0.8);
                padding: 10px;
                max-width: 40vh;
                min-width: 340px;
            }
        }

        .layer-ctrl {
            max-height: 50vh;
            overflow: auto;

            ::v-deep {
                .el-collapse {
                    border-left: 1px solid #e6ebf5;
                }
                .el-collapse-item__header {
                    padding-left: 10px;
                    background: transparent;
                }
                .el-collapse-item__wrap {
                    background: transparent;
                }
                .el-collapse-item__content {
                    padding: 10px;
                    padding-top: 0;
                }
                .el-checkbox {
                    display: block;
                }
            }
        }
    }
    .layr-ctrl-item {
        display: grid;
        grid-template-columns: 1fr 20px;
        gap: 10px;
        justify-items: start;
        align-items: center;
        margin-left: 20px;
    }
    .custom-filter {
        display: grid;
        grid-template-columns: 92px 1fr;
        font-size: 14px;
        align-items: center;
        gap: 10px;
        margin: 15px 0;
        max-height: 50vh;
        overflow: auto;
        > div {
            text-align: right;
            font-size: 12px;
            line-height: 1.5;
        }
    }
    .buttom-group {
        display: grid;
        grid-auto-flow: column;
        align-items: center;
        margin-top: 16px;
        gap: 10px;
        font-size: 14px;
    }

    .three-col {
        display: grid;
        grid-template-columns: 1fr 10px 1fr;
        place-items: center;
    }
</style>
