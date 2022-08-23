<template>
    <el-tabs v-model="activeTabName" type="card" class="layer-control">
        <el-tab-pane label="图层控制" name="图层控制">
            <el-collapse
                v-model="activeCollapseNames"
                class="layer-ctrl"
                accordion
            >
                <template>
                    <el-collapse-item
                        title="底图控制"
                        style="text-align: center"
                    >
                        <el-checkbox-group v-model="baseLayerCheckList">
                            <div
                                :key="layer.name"
                                v-for="layer in baseLayers"
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
                </template>
            </el-collapse>
        </el-tab-pane>
    </el-tabs>
</template>

<script lang="ts">
    import { mapState } from 'pinia';
    import { useMapStore } from '@/stores';
    import { map } from '@/views/map/components/CompareMap.vue';

    import { defineComponent } from 'vue';
    export default defineComponent({
        name: 'LayerControl',
        props: {
            baseLayers: {
                type: Array,
                required: true,
            },
        },
        data() {
            return {
                baseLayerCheckList: [],
                activeTabName: '图层控制',
                activeCollapseNames: [],
            };
        },
        watch: {
            baseLayers(layers) {
                layers.forEach((layer) => {
                    const { name: layername, title, type, zIndex } = layer;
                    // 房屋,影像,附属物默认勾选
                    if (
                        layername.includes('_fw') ||
                        layername.includes('_yx') ||
                        layername.includes('_fsw')
                    ) {
                        this.baseLayerCheckList.push(layer);
                    }
                });
            },
            baseLayerCheckList(checkeds, olds) {
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
        },
        computed: {
            ...mapState(useMapStore, {
                showCompareMap: (state) => state.showCompareMap,
            }),
        },
        created() {},
        mounted() {},
        beforeDestroy() {},
        destroyed() {},
        methods: {},
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
