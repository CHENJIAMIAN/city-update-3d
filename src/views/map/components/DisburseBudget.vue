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

      <el-button type="primary" icon="el-icon-search" round @click="handleQuery"
        >查询</el-button
      >
      <el-button
        type="primary"
        icon="el-icon-refresh"
        round
        plain
        @click="$refs.form.resetFields()"
        >重置</el-button
      >
    </div>

    <el-divider />

    <div class="form-container" v-loading="isLoading">
      <el-form ref="form" :model="form1" label-width="120px" class="form1">
        <el-form-item label="赔偿方案" prop="planId">
          <el-select
            v-model="form1.planId"
            placeholder="请选择"
            style="width: auto"
          >
            <el-option
              v-for="item in planOption"
              :key="item.id"
              :label="item.planName"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <div></div>
        <el-form-item label="最大可回迁面积" prop="maxArea">
          <el-input v-model="form1.maxArea"></el-input>
        </el-form-item>
        <el-form-item label="权益面积单价" prop="areaMoney">
          <el-input
            :disabled="!form1.maxArea"
            v-model="form1.areaMoney"
            placeholder="请输入单价 元/平方"
          ></el-input>
        </el-form-item>
        <el-form-item label="预算计算方式" prop="formulaMode">
          <el-radio-group v-model="form1.formulaMode">
            <!-- <el-radio :label="1">最大弃产[不计算权益面积]</el-radio> -->
            <el-radio :label="2">最大弃产[计算权益面积]</el-radio>
            <!-- <el-radio :label="3">最大回迁[不计算权益面积]</el-radio> -->
            <el-radio :label="4">最大回迁[计算权益面积]</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>

      <el-form ref="form2" :model="form2" label-width="120px" class="form2">
        <el-form-item label="回迁面积">
          <el-input disabled v-model="form2.standardArea"></el-input>
        </el-form-item>
        <el-form-item label="资金赔付">
          <el-input disabled v-model="form2.compensateMoney"></el-input>
        </el-form-item>
        <el-form-item label="临迁费赔付">
          <el-input disabled v-model="form2.relocationMoney"></el-input>
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
import { Draw, Select, Modify } from "ol/interaction";
import { getArea, getLength } from "ol/sphere";
import { LineString, Polygon } from "ol/geom";
// import { map } from "@/views/map/index.vue";
import { primaryAction } from "ol/events/condition";
import { unByKey } from "ol/Observable";
import { Vector as VectorLayer } from "ol/layer";
import { Vector as VectorSource } from "ol/source";
import * as turf from "@turf/turf";
import GeoJSON from "ol/format/GeoJSON";

import Overlay from "ol/Overlay";
export default {
  data() {
    return {
      isLoading: false,
      isDrawing: false,
      planOption: [],
      form1: {
        planId: "",
        measureNum: [],
        formulaMode: 2,
      },
      form2: {},
    };
  },
  watch: {
    isDrawing(n, o) {
      if (n) {
        this.select = map
          .getInteractions()
          .getArray()
          .find((i) => i.getProperties().name === "highlightSelect");
        this.select.setActive(false);
        this.initDrawLayer();
        this.startDrawLayer();
      } else {
        this.exitDrawing();
      }
    },
  },
  mounted() {
    getAllcompensationPlan({
      confirmStatus: 2,
    }).then((res) => (this.planOption = res.data));
  },
  methods: {
    handleQuery() {
      // 有 maxArea 最大可回迁面积则权益面积单价 areaMoney 必填
      if (
        this.form1.maxArea &&
        (this.form1.areaMoney === "" || this.form1.areaMoney === undefined)
      ) {
        this.$message.error("最大可回迁面积 和 权益面积单价 必须同时提交!");
        return;
      }
      this.isLoading = true;
      compensationDealComputeDeal(this.form1)
        .then((r) => {
          this.isLoading = false;
          this.$message.success("操作成功!");
          this.form2 = r.data;
        })
        .catch((e) => {
          this.isLoading = false;
        });
    },
    exitDrawing() {
      this.form1.measureNum = [];
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
          map.un("pointermove", pointerMoveMeasureTipHandler);
        helpTooltipElement?.parentNode?.removeChild(helpTooltipElement);
      }
    },
    initDrawLayer() {
      const drawS = (this.drawS = new VectorSource({ wrapX: false }));
      const vector = (this.drawL = new VectorLayer({
        name: "自定义绘制图层",
        source: drawS,
      }));
      map.addLayer(vector);

      let sketchFea;
      let helpTooltipElement;
      let helpTooltipOverLay;
      const continuePolygonMsg = "单击以继续绘制多边形,双击结束绘制";
      const formatArea = function (polygon) {
        const area = getArea(polygon);
        let output;
        if (area > 10000) {
          output =
            Math.round((area / 1000000) * 100) / 100 + " " + "km<sup>2</sup>";
        } else {
          output = Math.round(area * 100) / 100 + " " + "m<sup>2</sup>";
        }
        return output;
      };
      // 提示"点击开始绘图"
      function createHelpTooltip() {
        if (helpTooltipElement && helpTooltipElement.parentNode) {
          helpTooltipElement.parentNode.removeChild(helpTooltipElement);
        }
        helpTooltipElement = document.createElement("div");
        map.helpTooltipElement = helpTooltipElement;
        helpTooltipElement.className = "ol-tooltip hidden";
        helpTooltipOverLay = new Overlay({
          element: helpTooltipElement,
          offset: [15, 0],
          positioning: "center-left",
        });
        map.helpTooltipOverLay = helpTooltipOverLay;
        map.addOverlay(helpTooltipOverLay);
      }

      // 添加鼠标移动时的提示
      const pointerMoveMeasureTipHandler = function (evt) {
        if (evt.dragging) {
          return;
        }
        let helpMsg = "点击开始绘图";

        if (sketchFea) {
          const geom = sketchFea.getGeometry();
          if (geom instanceof Polygon) {
            helpMsg = continuePolygonMsg;
          }
        }

        helpTooltipElement.innerHTML = helpMsg;
        helpTooltipOverLay.setPosition(evt.coordinate);

        helpTooltipElement.classList.remove("hidden");
      };
      map.pointerMoveMeasureTipHandler = pointerMoveMeasureTipHandler;
      map.on("pointermove", pointerMoveMeasureTipHandler);

      const func = () => {
        helpTooltipElement.classList.add("hidden");
      };
      map.getViewport().addEventListener("mouseout", func);
      // 销毁事件
      this.$on("hook:beforeDestroy", () => {
        map.getViewport().removeEventListener("mouseout", func);
      });

      // 绘制
      const draw = (this.drawLInteraction = new Draw({
        source: drawS,
        type: 'POLYGON',
      }));

      createHelpTooltip();

      let listener;
      draw.on("drawstart", function (evt) {
        sketchFea = evt.feature;
        let tooltipCoord = evt.coordinate;
        listener = sketchFea.getGeometry().on("change", function (evt) {
          const geom = evt.target;
          let output;
          if (geom instanceof Polygon) {
            output = formatArea(geom);
            tooltipCoord = geom.getInteriorPoint().getCoordinates();
          }
        });
      });
      draw.on("drawend", (evt) => {
        const closerElement = document.createElement("div");
        if (!map.closerElements) map.closerElements = [];
        map.closerElements.push(closerElement);
        closerElement.className = "ol-tooltip hidden";
        closerElement.style.cursor = "pointer";
        const closerOverLay = new Overlay({
          element: closerElement,
          offset: [15, 0],
          positioning: "center-left",
        });
        if (!map.closerOverLays) map.closerOverLays = [];
        map.closerOverLays.push(closerOverLay);
        map.addOverlay(closerOverLay);
        closerElement.innerHTML = "X";
        closerOverLay.setPosition(
          evt.feature.getGeometry().getLastCoordinate()
        );
        closerElement.onclick = (e) => {
          this.drawS.removeFeature(evt.feature);
          map.removeOverlay(closerOverLay);
          this.$nextTick((_) => {
            this.saveDrawLayerGson();
          });
        };
        evt.feature.closerElement = closerElement;

        sketchFea = null;
        // 取消设置工具提示，以便可以创建一个新的
        unByKey(listener);

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
      modify.on("modifyend", (evt) => {
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
    saveDrawLayerGson() {
      const drawLfeas = this.drawL.getSource().getFeatures();
      const gson = new GeoJSON().writeFeatures(drawLfeas, {
        featureProjection: "EPSG:3857", // 3857(单位米),设置后返回的是经纬度
      });
      // 获取相交的建筑物的 测绘编号和档案编号 protocolNums: [], form1.measureNum: [],
      const buidingLs = map.getLayersByProperty("flag", "building");
      if (buidingLs.length < 1) {
        this.$message.error("未找到建筑物图层,无法获得自建地块下的建筑物信息");
        return;
      }
      const buidingLfeas = [];
      buidingLs.forEach((buidingL) =>
        buidingLfeas.push(...buidingL.getSource().getFeatures())
      );
      const format = new GeoJSON();
      drawLfeas.forEach((drawLfea) => {
        const drawLfeaTurfPolygon = format.writeFeatureObject(drawLfea); // convert to a turf.js feature
        buidingLfeas.forEach((buidingLfea) => {
          let buidingLfeaTurfPolygon;
          if (buidingLfea.getGeometry().getType() === "MultiPolygon") {
            buidingLfeaTurfPolygon = format.writeGeometryObject(
              buidingLfea.getGeometry().getPolygon(0)
            );
          } else {
            buidingLfeaTurfPolygon = format.writeFeatureObject(buidingLfea); // convert to a turf.js feature
          }
          const bool = turf.booleanContains(
            //True if the second geometry is completely contained by the first geometry.
            drawLfeaTurfPolygon,
            buidingLfeaTurfPolygon
          );
          if (bool) {
            const { fwbh, 测绘编号, protocolNum } = buidingLfea.getProperties();
            const measureNum = fwbh || 测绘编号;
            !this.form1.measureNum.includes(measureNum) &&
              this.form1.measureNum.push(measureNum);
          }
        });
      });
      console.log(this.form1.measureNum);
    },
  },
};
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