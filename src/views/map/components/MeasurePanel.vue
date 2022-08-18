<template>
  <!-- 测量面板 -->
  <el-card class="box-card">
    <div slot="header">
      <i class="el-icon-close close" @click="handleMeasurePanelClose"></i>
    </div>
    <el-radio v-model="radio" :label="1">长度</el-radio>
    <el-radio v-model="radio" :label="2">面积</el-radio>
  </el-card>
</template>

<script lang="ts">
import { Vector as VectorSource } from "ol/source";
import { Vector as VectorLayer } from "ol/layer";
import { LineString, Polygon } from "ol/geom";
import { Circle as CircleStyle, Fill, Stroke, Style } from "ol/style";
import GeoJSON from "ol/format/GeoJSON";
import { Draw, Snap } from "ol/interaction";
import Overlay from "ol/Overlay";
import { primaryAction } from "ol/events/condition";
import { unByKey } from "ol/Observable";
import { getArea, getLength } from "ol/sphere";
import * as turf from "@turf/turf";
import { map } from "@/views/map/index.vue";

export default {
  name: "MeasurePanel",
  data() {
    return {
      radio: 1,
    };
  },
  watch: {
    radio(n, v) {
      this.stopMeasure();
      switch (n) {
        case 1:
          this.startMeasure("length");
          break;
        case 2:
          this.startMeasure("area");
          break;
      }
    },
  },
  mounted() {
    this.startMeasure("length");
  },
  destroyed() {
    this.stopMeasure();
  },
  methods: {
    handleMeasurePanelClose() {
      this.$store.dispatch("map/toggleMeasure", false);
    },
    // 测量
    startMeasure(LenthOrArea) {
      // LenthOrArea :length/area
      this.measureNums = [];

      // 添加测量图层
      const measureS = (this.drawS = new VectorSource());
      const measureV = (this.drawL = new VectorLayer({
        source: measureS,
        style: new Style({
          fill: new Fill({
            color: "rgba(255, 255, 255, 0.2)",
          }),
          stroke: new Stroke({
            color: "rgba(255, 255, 0, 1)",
            width: 2,
          }),
          image: new CircleStyle({
            radius: 7,
            fill: new Fill({
              color: "rgba(255, 255, 0, 1)",
            }),
          }),
        }),
      }));
      map.measureV = measureV;
      map.addLayer(measureV);

      let sketchFea;
      let helpTooltipElement;
      let helpTooltipOverLay;
      const continuePolygonMsg = "单击以继续绘制多边形,双击结束绘制";
      const continueLineMsg = "点击继续画线,双击结束绘制";
      //计算段的长度并将叠加层放置在其中点。
      const calDistance = (overlay, overlayPosition, distance) => {
        if (parseInt(distance) == 0) {
          overlay.setPosition([0, 0]);
        } else {
          overlay.setPosition(overlayPosition);
          if (distance >= 1000) {
            overlay.element.innerHTML = (distance / 1000).toFixed(2) + " km";
          } else {
            overlay.element.innerHTML = distance.toFixed(2) + " m";
          }
        }
      };

      //计算多边形的面积并将叠加层放置在多边形的中心
      const calArea = (overlay, overlayPosition, area) => {
        if (parseInt(area) == 0) {
          overlay.setPosition([0, 0]);
        } else {
          overlay.setPosition(overlayPosition);
          if (area >= 10000) {
            overlay.element.innerHTML =
              Math.round((area / 1000000) * 100) / 100 + " km<sup>2<sup>";
          } else {
            overlay.element.innerHTML =
              Math.round(area * 100) / 100 + " m<sup>2<sup>";
          }
        }
      };
      const formatLength = function (line) {
        const length = getLength(line);
        let output;
        if (length > 100) {
          output = Math.round((length / 1000) * 100) / 100 + " " + "km";
        } else {
          output = Math.round(length * 100) / 100 + " " + "m";
        }
        return output;
      };
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
        helpTooltipElement?.parentNode?.removeChild(helpTooltipElement);
        helpTooltipElement = document.createElement("div");
        map.helpTooltipElement = helpTooltipElement;
        helpTooltipElement.className = "ol-tooltip hidden";
        helpTooltipOverLay = new Overlay({
          name: "helpTooltipOverLay",
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
          } else if (geom instanceof LineString) {
            helpMsg = continueLineMsg;
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

      map.getViewport().oncontextmenu = (e) => {
        if (!sketchFea) return;
        if (this.type == "Polygon") {
          const ponintNum = sketchFea
            .getGeometry()
            .getCoordinates()[0]
            .slice(0, -2).length;
          // 面积
          // 右键, 2个点, 退出
          if (ponintNum <= 2) {
            if (measureS.getFeatures().length < 1) {
              this.handleMeasurePanelClose();
            } else {
              measureDraw.finishDrawing();
              const fea = measureS.getFeatures().slice(-1)[0];
              fea.closerElement.click();
            }
          }
          // 多于2个点, 完成绘制
          else {
            measureDraw.finishDrawing();
          }
        } else if (this.type == "LineString") {
          const ponintNum = sketchFea
            .getGeometry()
            .getCoordinates()
            .slice(0, -1).length;
          // 右键, 一个点, 退出
          if (ponintNum == 1) {
            if (measureS.getFeatures().length < 1) {
              this.handleMeasurePanelClose();
            } else {
              measureDraw.finishDrawing();
              const fea = measureS.getFeatures().slice(-1)[0];
              fea.closerElement.click();
            }
          }
          // 多个点, 完成绘制
          else {
            measureDraw.finishDrawing();
          }
        }
      };

      this.type = LenthOrArea == "area" ? "Polygon" : "LineString";
      const measureDraw = new Draw({
        condition: primaryAction,
        source: measureS,
        type: this.type,
        style: new Style({
          fill: new Fill({
            color: "rgba(255, 255, 255, 0.2)",
          }),
          stroke: new Stroke({
            color: "rgba(255, 255, 0, 1)",
            lineDash: [10, 10],
            width: 2,
          }),
          image: new CircleStyle({
            radius: 5,
            stroke: new Stroke({
              color: "rgba(255, 255, 0, 1)",
            }),
            fill: new Fill({
              color: "rgba(255, 255, 255, 0.2)",
            }),
          }),
        }),
      });
      map.measureDraw = measureDraw;
      map.addInteraction(measureDraw);
      const measureSnap = new Snap({
        source: measureS,
      });
      map.measureSnap = measureSnap;
      map.addInteraction(measureSnap);

      map.measureInteractions = [];
      const buidingLs = map.getLayersByProperty("flag", "building");
      if (buidingLs.length < 1) {
        this.$message.error("未找到建筑物图层");
        return;
      }
      buidingLs.forEach((buidingL) => {
        const measureSnap = new Snap({
          source: buidingL.getSource(),
        });
        map.addInteraction(measureSnap);
        map.measureInteractions.push(measureSnap);
      });

      this.select = map
        .getInteractions()
        .getArray()
        .find((i) => i.getProperties().name === "highlightSelect");
      this.select.setActive(false);

      createHelpTooltip();

      let sketchFeaChangeListener;
      measureDraw.on("drawstart", function (evt) {
        sketchFea = evt.feature;

        const startPointOverlay = new Overlay({
          name: "startPointOverlay",
          id: sketchFea.ol_uid,
          flag: "measureTooltipOverLay",
          element: document.getElementById("measureOverlayContainer"),
          offset: [0, -15],
          positioning: "bottom-center",
          className: "ol-tooltip-measure ol-tooltip .ol-tooltip-static",
          position: [0, 0],
        });
        startPointOverlay.element.style.display = "block";
        map.addOverlay(startPointOverlay);
        startPointOverlay.setPosition(
          sketchFea.getGeometry().getLastCoordinate()
        );
        startPointOverlay.element.innerHTML = "起点";

        //它将存储几何的坐标长度
        let coordinates_length = 0;
        //partDistanceOverlay用于在“线”和“多边形”几何体的每个线段上显示距离测量的标签
        let partDistanceOverlay = null;
        //totalAreaDistanceOverlay用于在geomtery为LineString时显示总距离，或者在geomtry为Polygon时显示面积
        const totalAreaDistanceOverlay = new Overlay({
          name: "totalAreaDistanceOverlay",
          id: sketchFea.ol_uid,
          flag: "measureTooltipOverLay",
          element: document.getElementById("measureOverlayContainer"),
          offset: [0, -15],
          positioning: "bottom-center",
          className: "ol-tooltip-measure ol-tooltip .ol-tooltip-static",
          position: [0, 0],
        });
        totalAreaDistanceOverlay.element.style.display = "block";

        map.addOverlay(totalAreaDistanceOverlay);
        //lastPartLineOverlay用于显示Polygon的最后一段的距离测量，这是它的最后两个坐标
        const lastPartLineOverlay = new Overlay({
          name: "lastPartLineOverlay",
          id: sketchFea.ol_uid,
          flag: "measureTooltipOverLay",
          element: document.getElementById("measureOverlayContainer"),
          offset: [0, -15],
          positioning: "bottom-center",
          className: "ol-tooltip-measure ol-tooltip .ol-tooltip-static",
          position: [0, 0],
        });
        lastPartLineOverlay.element.style.display = "block";
        map.addOverlay(lastPartLineOverlay);

        // 图形变化时
        sketchFeaChangeListener = sketchFea
          .getGeometry()
          .on("change", function (e) {
            let geomType = e.target.getType();
            let coordinates = e.target.getCoordinates();
            if (geomType == "Polygon") {
              coordinates = e.target.getCoordinates()[0];
            }
            //此逻辑将检查是否将新坐标添加到几何中。如果是，那么它将为新细分创建一个覆盖图
            if (coordinates.length > coordinates_length) {
              partDistanceOverlay = new Overlay({
                name: "partDistanceOverlay",
                id: sketchFea.ol_uid,
                flag: "measureTooltipOverLay",
                element: document.getElementById("measureOverlayContainer"),
                offset: [0, -15],
                positioning: "bottom-center",
                className: "ol-tooltip-measure ol-tooltip .ol-tooltip-static",
                position: [0, 0],
              });
              partDistanceOverlay.element.style.display = "block";
              map.addOverlay(partDistanceOverlay);
              coordinates_length = coordinates.length;
            } else {
              coordinates_length = coordinates.length;
            }

            let partLine = null;
            if (coordinates_length >= 2)
              partLine = new LineString([
                coordinates[coordinates_length - 2],
                coordinates[coordinates_length - 1],
              ]);

            if (geomType == "Polygon" && coordinates_length >= 3) {
              partLine = new LineString([
                coordinates[coordinates_length - 3],
                coordinates[coordinates_length - 2],
              ]);
            }

            //计算分段的长度并将叠加层放置在分段的中点
            partLine &&
              calDistance(
                partDistanceOverlay,
                partLine.getFlatMidpoint(),
                partLine.getLength()
              );

            //如果几何图形为LineString且坐标长度大于2，则计算线的总长度，并设置最后一个坐标处的叠加层位置
            if (
              geomType == "LineString" &&
              coordinates_length > 2 &&
              e.target.getLength() >
                new LineString([coordinates[0], coordinates[1]]).getLength()
            ) {
              calDistance(
                totalAreaDistanceOverlay,
                coordinates[coordinates_length - 1],
                e.target.getLength()
              );
            }

            //如果几何体是多边形，则它将创建用于面积测量的覆盖层，并为其最后一个部分（即它的第一个和最后一个坐标）创建覆盖物。
            if (geomType == "Polygon" && coordinates_length > 3) {
              calArea(
                totalAreaDistanceOverlay,
                e.target.getFlatInteriorPoint(),
                e.target.getArea()
              );
              partLine = new LineString([
                coordinates[coordinates_length - 2],
                coordinates[coordinates_length - 1],
              ]);
              calDistance(
                lastPartLineOverlay,
                partLine.getFlatMidpoint(),
                partLine.getLength()
              );
            }
          });
      });

      measureDraw.on("drawend", (evt) => {
        // 测量线 , 结束时只有两个点的话, 移除掉总距离, 因为线的距离就是总距离
        this.type === "LineString" &&
          evt.feature.getGeometry().getCoordinates().length === 2 &&
          olmap
            .getOverlays()
            .getArray()
            .filter((i) => i.options.name == "totalAreaDistanceOverlay")
            .forEach((i) => olmap.removeOverlay(i));

        // 绘制完成时, 显示删除的图标
        const closerElement = document.createElement("div");
        if (!map.closerElements) map.closerElements = [];
        map.closerElements.push(closerElement);
        closerElement.className = "ol-tooltip hidden";
        closerElement.style.cursor = "pointer";
        const closerOverLay = new Overlay({
          name: "closerOverLay",
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
          map
            .getOverlays()
            .getArray()
            .filter((i) => i.id === evt.feature.ol_uid)
            .forEach((i) => map.removeOverlay(i));
        };
        evt.feature.closerElement = closerElement;

        // 统计结果
        if (LenthOrArea === "area") {
          // 在异步的微任务里可以获取到图形
          this.$nextTick((_) => {
            // 先获取包含在内的建筑id
            const measureNums = this.getBuildingMeasureNumsContainInDrawL();
            // 根据measureNums获取对应建筑们的建筑面积和占地面积总和
            // console.log(measureNums);
            getTwoAreaByMeasureNums({ measureNums: measureNums }).then((r) => {
              const { buildingArea, battleGroundArea } = r.data;
              this.$notify({
                title: "绘制范围内：",
                message: `建筑物的建筑面积:${
                  buildingArea ? buildingArea + "㎡" : "查无数据"
                },
                建筑物的占地面积:${
                  battleGroundArea ? battleGroundArea + "㎡" : "查无数据"
                },
                建筑物栋数:${measureNums.length}`,
                offset: 200,
              });
            });
          });
        }

        sketchFea = null;
        // 取消设置工具提示，以便可以创建一个新的
        unByKey(sketchFeaChangeListener);
      });
    },
    getBuildingMeasureNumsContainInDrawL() {
      const drawLfeas = this.drawL.getSource().getFeatures();
      const gson = new GeoJSON().writeFeatures(drawLfeas, {
        featureProjection: "EPSG:3857", // 3857(单位米),设置后返回的是经纬度
      });
      const buidingLs = map.getLayersByProperty("flag", "building");
      if (buidingLs.length < 1) {
        this.$message.error("未找到建筑物图层");
        return;
      }
      const buidingLfeas = [];
      buidingLs.forEach((buidingL) =>
        buidingLfeas.push(...buidingL.getSource().getFeatures())
      );
      const format = new GeoJSON();
      const measureNums = this.measureNums;
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
            drawLfeaTurfPolygon,
            buidingLfeaTurfPolygon
          );
          if (bool) {
            const { fwbh, 测绘编号, protocolNum } = buidingLfea.getProperties();
            const measureNum = fwbh || 测绘编号;
            !measureNums.includes(measureNum) && measureNums.push(measureNum);
          }
        });
      });
      return measureNums;
    },
    stopMeasure() {
      const {
        measureV,
        measureDraw,
        measureSnap,
        measureInteractions,
        helpTooltipOverLay,
        pointerMoveMeasureTipHandler,
        helpTooltipElement,
      } = map;
      if (measureV) {
        measureV.getSource().clear();
        map.removeLayer(measureV);
      }
      this.select.setActive(true);

      measureDraw && map.removeInteraction(measureDraw);
      measureSnap && map.removeInteraction(measureSnap);
      measureInteractions.forEach((i) => map.removeInteraction(i));
      helpTooltipOverLay && map.removeOverlay(helpTooltipOverLay);

      map?.closerElements?.forEach((i) => {
        i.parentNode && i.parentNode.removeChild(i);
      });
      map.closerElements = [];
      map?.closerOverLays?.forEach((i) => {
        map.removeOverlay(i);
      });
      map.closerOverLays = [];

      map
        .getOverlays()
        .getArray()
        .filter((i) => i.options.flag === "measureTooltipOverLay")
        .forEach((i) => map.removeOverlay(i));
      pointerMoveMeasureTipHandler &&
        map.un("pointermove", pointerMoveMeasureTipHandler);
      helpTooltipElement?.parentNode?.removeChild(helpTooltipElement);
    },
  },
};
</script>

<style lang="scss" scoped>
.close {
  position: absolute;
  right: 10px;
  top: 8px;
  line-height: 1;
  font-size: 20px;
  &:hover {
    color: #006C69;
  }
}
</style>
