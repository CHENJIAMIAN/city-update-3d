import View from "ol/View";
import { Fill, Stroke, Style, Text } from "ol/style";
import { Vector as VectorSource } from "ol/source";
import { GeoJSON } from "ol/format";
import { VectorImage } from "ol/layer";
import { getFWStyleFunc } from "@/views/map/olmap-common";

// Map([[key1,value1],[key2,value2]])
const layerColorMap = new Map([
  [
    "white",
    [
      "图廓层",
      "幢1Anno",
      "三乡测绘_实测总图_GCD",
      "三乡测绘_实测总图_0",
      "三乡测绘_实测总图_211",
      "三乡测绘_实测总图_221",
      "三乡测绘_实测总图_841",
      "三乡测绘_实测总图_911",
      "三乡测绘_实测总图_ASSIST",
      "系统编号代码",
      "0",
      "1",
      "3",
      "备注",
      "ASSIST",
      "assist",
      "ZJ",
      "TK",
      "范围线",
      "和睦村房屋现状_xian80_外框",
      "MPH",
      "居民地注记",
      "幢OK6Anno",
      "影像",
      "֓蹸",
      "基底",
      "LAA",
      "LAP1",
      "LAP2",
      "MJ",
      "MJZJ",
      "lastr",
      "公共用地线",
      "天井",
      "空地",
      "lacharact",
      "mp"
    ]
  ],
  [
    "red",
    [
      "房屋1Anno",
      "三乡测绘_实测总图_GCD",
      "三乡测绘_实测总图_KZD",
      "三乡测绘_实测总图_调查线",
      "三乡测绘_实测总图_项目范围线",
      "三乡测绘_实测总图_雅居乐园中园红线",
      "项目范围线",
      "CQFWX",
      "KZD",
      "GCD",
      "现状幢okAnno",
      "4",
      "交通线",
      "房屋ok2",
      "房屋ok2Anno",
      "高步分栋注记国家2000",
      "卫图2015",
      "编号",
      "面状",
      "边界",
      "发证线",
      "编号",
      "户主姓名",
      "第一层",
      "旧编号",
      "楼梯",
      "新栋号",
      "用地线",
      "LAW",
      "M_SPATIALJOIN"
    ]
  ],
  [
    "yellow",
    [
      "三乡测绘_实测总图_GXYZ",
      "雅居乐园中园红线",
      "DGX",
      "GXYZ",
      "庚乐组",
      "构筑物",
      "集体物业用地线",
      "门牌",
      "飘楼",
      "LAY",
      "LAY2"
    ]
  ],
  [
    "green",
    [
      "三乡测绘_实测总图_DMTZ",
      "三乡测绘_实测总图_ZBTZ",
      "JZD",
      "JZP",
      "DMTZ",
      "ZBTZ",
      "楼顶棚简",
      "房屋编号新",
      "阳台",
      "LAJ",
      "ZDH",
      "t111"
    ]
  ],
  [
    "blue",
    [
      "三乡测绘_实测总图_SXSS",
      "水域",
      "SXSS",
      "63",
      "交通注记",
      "居民地注记",
      "OID_",
      "CQFWX",
      "DEFAULT",
      "地貌线",
      "房屋面",
      "房屋线",
      "高程点",
      "工矿点",
      "工矿面",
      "管线点",
      "管线线",
      "农调房屋ok1",
      "农调房屋ok1Anno",
      "拆除范围",
      "居民地点",
      "居民地辅助线",
      "居民地线",
      "控制点",
      "水系面",
      "水系线",
      "垣栅",
      "植被点",
      "植被面",
      "植被线",
      "棚",
      "棚房"
    ]
  ],
  // 青色
  [
    "rgb(0,255,255)",
    [
      "三乡测绘_实测总图_DLSS",
      "DLSS",
      "地址信息",
      "权利人",
      "宗地代码",
      "道路",
      "简单房屋",
      "简易房",
      "COMPONENT",
      "LAF"
    ]
  ],
  // 洋红
  [
    "rgb(255,0,255)",
    [
      "三乡测绘_实测总图_JMD",
      "JMD",
      "二调房屋ok1",
      "二调房屋ok1Anno1",
      "结构注记",
      "房屋结构",
      "廊房",
      "建筑物",
      "地形层",
      "破房",
      "序号",
      "LAP",
      "LAPP"
    ]
  ],
  // 暗青色
  ["rgb(34 208 191)", ["和睦分栋注记国家2000"]],
  // 暗绿色
  ["rgb(48 178 91)", ["和睦房屋注记XA80"]],
  // 紫色
  ["rgb(171 71 179)", ["二调房屋okAnno"]],
  // 有点发绿的白色 rgb(231 247 208)
  ["rgb(231 247 208)", ["二调房屋ok"]],
  //粉红
  ["rgb(255 127 127)", ["三乡测绘_实测总图_DLDW", "DLDW"]],
  //橙色
  ["rgb(255,127,0)", ["地貌线"]]
]);

function getLayerColor(layerColorMap, layername) {
  for (let [k, v] of layerColorMap) {
    if (v.includes(layername)) {
      return k;
    }
  }
}

function getStyleFunc(layername) {
  let styleFunction = undefined;
  const color = getLayerColor(layerColorMap, layername);
  if (color)
    return function(fea) {
      return new Style({
        stroke: new Stroke({
          color: color,
          width: 1
        })
      });
    };
  // 后续项目改成根据要素的Layer属性字段去适配,如此,一个标注图层,一个线图层即可模拟cad效果
  const getCADLineStyleFunc = fea => {
    const { layer, color: colorIndex } = fea.getProperties();
    const color = getLayerColor(layerColorMap, layer);
    return color
      ? new Style({
          stroke: new Stroke({
            color: color,
            width: 1
          })
        })
      : undefined;
  };
  const getCADPointLableStyleFunc = fea => {
    const { layer, color: colorIndex, text, txtjust } = fea.getProperties();
    const color = getLayerColor(layerColorMap, layer);
    return new Style({
      text: new Text({
        textAlign: (txtjust && txtjust.toLowerCase()) || "left",
        text: text,
        fill: new Fill({
          color: color ? color : "white"
        })
      })
    });
  };

  if (layername.includes("_Annotation")) {
    styleFunction = function(fea) {
      return getCADPointLableStyleFunc(fea);
    };
  } else if (layername.includes("_Polyline")) {
    styleFunction = function(fea) {
      return getCADLineStyleFunc(fea);
    };
  } else if (layername.includes("_fanwei")) {
    styleFunction = function(fea) {
      return new Style({
        stroke: new Stroke({
          color: "red",
          width: 1
        })
      });
    };
  } else if (layername == "project") {
    styleFunction = function(feature) {
      return new Style({
        stroke: new Stroke({ width: 2, color: "lightblue" }),
        fill: new Fill({ color: "#0074c759" }),
        text: new Text({
          textAlign: "left",
          offsetX: 20,
          font: "normal 16px Arial",
          text: "" + feature.get("project") + feature.get("progress") || "",
          fill: new Fill({
            color: "#006C69"
          })
        })
      });
    };
  } else if (layername.includes("_fw") || layername.includes("_fsw")) {
    styleFunction = function(fea) {
      return getFWStyleFunc(fea);
    };
  }
  return styleFunction;
}

export function loadGSONToVecLayer({
  flag,
  gsonUrl,
  layername,
  zIndex,
  visible,
  minZoom
}) {
  var vectorSource = new VectorSource({
    url: gsonUrl,
    format: new GeoJSON()
  });
  return new VectorImage({
    name: layername,
    source: vectorSource,
    style: getStyleFunc(layername),
    imageRatio: 2,
    minZoom,
    visible,
    zIndex,
    flag
  });
}

export function loadGSONToVecLayer2({
  flag,
  geojsonObject,
  layername,
  zIndex,
  visible,
  minZoom
}) {
  const vectorSource = new VectorSource({
    features: new GeoJSON().readFeatures(geojsonObject),
  });
  return new VectorImage({
    name: layername,
    source: vectorSource,
    style: getStyleFunc(layername),
    imageRatio: 2,
    minZoom,
    visible,
    zIndex,
    flag
  });
}

export function getBuildingFeaByMeasureNum(measureNum, map) {
  const layers = map.getLayersByProperty("flag", "building");
  const feas = [];
  layers.forEach(layer => feas.push(...layer.getSource().getFeatures()));
  const fea = feas.find(i => {
    const fwbh = i.getProperties().fwbh || i.getProperties()["测绘编号"];
    return fwbh === measureNum;
  });
  return fea;
}

export function lockViewByExtent(extent, map) {
  // 原范围再缩小一点,看起来比较好的
  // 缩小多少, 定为视图上下差值的一半, eg上下距离1000米,则视图为原范围扩张500米
  // const subVal = Math.floor(Math.abs(extent[0] - extent[2])) / 2;
  const subVal = Math.floor(Math.abs(extent[0] - extent[2]));
  const biggerExtent = extent.map(
    (item, index) =>
      index === 0 || index === 1 ? item - subVal / 2 : item + subVal //上下：左右
  );
  // 约束范围
  const projectConstrainView = new View({
    center: [0, 0], // 一定要有
    zoom: 15, // 太小的话并不会被采纳,ol会自动计算
    extent: biggerExtent,
    maxZoom: 21
  });
  map.setView(projectConstrainView);
}
