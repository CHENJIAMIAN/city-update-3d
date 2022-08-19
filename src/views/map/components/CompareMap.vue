<template>
  <div id="olmapCompare">
    <compare-map-layer-control :baseLayers="baseLayers" />

    <!-- 右上角按钮 -->
    <div class="top-right-btn">
      <el-select v-model="version" placeholder="请选择阶段">
        <el-option
          v-for="v in versionOpts"
          :key="v.id"
          :label="v.stage"
          :value="v.id"
        />
      </el-select>
      <el-button @click="handleExitClick">退出对比</el-button>
    </div>
  </div>
</template>

<script lang="ts">
import CompareMapLayerControl from "@/views/map/components/CompareMapLayerControl.vue";
import Map from "ol/Map";
import { XYZ, Vector as VectorSource, ImageWMS, WMTS } from "ol/source";
import {
  Image as ImageLayer,
  Tile as TileLayer,
  Vector as VectorLayer,
  VectorImage,
} from "ol/layer";
import {
  defaults as defaultControls, // 比例尺
} from "ol/control";
import {
  tdtVec,
  tdtVecNotation,
  tdtSatelite,
  tdtSateliteNotation,
  getFWStyleFunc,
} from "@/views/map/olmap-common";
import { cloneDeep } from "lodash";
import GeoJSON from "ol/format/GeoJSON";
import WMTSCapabilities from "ol/format/WMTSCapabilities";
import { fromLonLat } from "ol/proj";
import { optionsFromCapabilities } from "ol/source/WMTS";
import { defaultBaseLayers } from "@/views/map/olmap-config";
import {map as firstMap} from '@/views/map/index.vue'

export let map = null;
export default {
  components: {
    CompareMapLayerControl,
  },
  data() {
    return {
      bottomLayers: [],
      version: "",
      baseLayers: [],
      versionOpts: [
        // {
        //   versionId: 1,
        //   versionName: "版本1"
        // },
        // {
        //   versionId: 2,
        //   versionName: "版本2"
        // }
      ],
    };
  },
  watch: {
    async version(version) {
      const map = this.map;
      // 只留底图
      map.getLayers().clear();
      map.getLayers().push(...this.bottomLayers);

      const r = await queryLayersByStageId({
        id: version,
      });
      if (r.data.length < 1) {
        this.$message.error("该阶段无数据");
        return;
      }
      const { geoserver, namespace, layers } = r.data[0];

      this.baseLayers = layers.concat(defaultBaseLayers);

      layers.forEach((layer) => {
        const { name: layername, type, zindex } = layer;
        const gsonUrl = `${geoserver}/${namespace}/ows?service=WFS&version=1.0.0&request=GetFeature&srsname=EPSG:3857&typeName=${namespace}:${layername}&outputFormat=application/json`;
        if (type === "vec") {
          if (layername.includes("_fw") || layername.includes("_fsw")) {
            const buildingL = this.loadBuildingGSONToVecLayer({
              gsonUrl,
              layername,
              zindex,
            });
            map.addLayer(buildingL);
          } else {
            const vecL = this.loadGSONToVecLayer({
              gsonUrl,
              layername,
              zindex,
              visible: false,
            });
            map.addLayer(vecL);
            const listener = (evt) => {
              const source = evt.target;
              if (source.getState() === "ready") {
                vecL.getSource().un("change", listener);
              }
            };
            vecL.getSource().on("change", listener);
          }
        } else if (type === "img") {
          let imgL;
          if (layername.includes("_yx")) {
            // WMTS的方式加载
            var parser = new WMTSCapabilities();
            fetch("/geoserver/gwc/service/wmts?REQUEST=GetCapabilities")
              .then((response) => response.text())
              .then((text) => {
                var result = parser.read(text);
                // 找到切片影像的范围,设置未view的范围
                const extent = result.Contents.Layer.find((i) =>
                  i.Identifier.includes(layername)
                ).WGS84BoundingBox;
                const extent2 = [
                  ...fromLonLat(extent.slice(0, 2)),
                  ...fromLonLat(extent.slice(2, 4)),
                ];
                var options = optionsFromCapabilities(result, {
                  layer: `${namespace}:${layername}`,
                  matrixSet: "EPSG:900913",
                });
                if (!options) {
                  alert("geoserver配置错误！");
                  return;
                }
                // 不修改options.urls[0];的话,会造成地址生成的是, 缺少端口,造成访问不到对的位置
                // ("http://local-dev1.jrnet888.com/geoserver/gwc/service/wmts?");
                options.urls[0] = "/geoserver/gwc/service/wmts?";
                let imgL = new TileLayer({
                  name: layername,
                  extent: extent2,
                  source: new WMTS(options),
                });
                this.$on("hook:destroyed", (_) => {
                  imgL = null;
                });
                map.addLayer(imgL);
              });
          } else {
            // WMS的方式太慢了
            const url = `${geoserver}/${namespace}/wms`; //nginx代理子目录
            const LAYERS = `${namespace}:${layername}`;
            imgL = new ImageLayer({
              name: layername,
              zIndex: zindex,
              source: new ImageWMS({
                ratio: 1,
                url: url,
                params: {
                  FORMAT: "image/png",
                  VERSION: "1.3.0",
                  tiled: true,
                  LAYERS: LAYERS,
                  exceptions: "application/vnd.ogc.se_inimage",
                },
              }),
            });
          }
          this.$on("hook:destroyed", (_) => {
            imgL = null;
          });
          imgL && map.addLayer(imgL);
        }
      });
    },
  },
  computed: {
  },
  created() {
    queryStageByProjectId({}).then((r) => (this.versionOpts = r.data));
  },
  mounted() {
    function getTileLayerUrl(tileLayerName) {
      const tk = `d93d0f40401619335e98468b99411aa1`;
      return `https://t{0-7}.tianditu.gov.cn/DataServer?T=${tileLayerName}&x={x}&y={y}&l={z}&tk=${tk}`;
    }

    // 两个map实例不能引用同一个layer实例,不然会只显示一个
    // var tdtVec2 = cloneDeep(tdtVec);//cloneDeep也不行，还是会操作到同一份图层

    // 天地图矢量图层
    const tdtVec = new TileLayer({
      title: "天地图矢量图层",
      name: "矢量图层",
      source: new XYZ({
        url: getTileLayerUrl("vec_w"),
      }),
    });
    // 天地图矢量图层注记
    const tdtVecNotation = new TileLayer({
      title: "天地图矢量图层注记",
      name: "矢量图层",
      source: new XYZ({
        url: getTileLayerUrl("cva_w"),
      }),
    });

    // 天地图影像图层
    const tdtSatelite = new TileLayer({
      title: "谷歌图层",
      name: "影像图层",
      source: new XYZ({
        url: getTileLayerUrl("img_w"),
        maxZoom: 18
      }),
    });
    // 天地图影像图层注记
    const tdtSateliteNotation = new TileLayer({
      title: "天地图影像图层注记",
      name: "影像图层",
      source: new XYZ({
        url: getTileLayerUrl("cia_w"),
      }),
    });

    tdtVec.setVisible(false);
    tdtVecNotation.setVisible(false);
    const mapElement = document.querySelector("#olmapCompare");
    this.bottomLayers = [
      tdtSatelite,
      tdtVec,
      tdtVecNotation,
      tdtSateliteNotation,
    ];
    map = window.olmap2 = this.map = new Map({
      controls: defaultControls({
        attribution: false,
        zoom: false,
      }),
      layers: this.bottomLayers,
      view: firstMap?.getView(),
      target: mapElement,
    });

    // 为什么缩放或单击地图时不正确/不正确？ https://openlayers.org/en/latest/doc/faq.html
    const sizeObserver = new ResizeObserver(() => {
      map.updateSize();
    });
    sizeObserver.observe(mapElement);
  },
  methods: {
    loadGSONToVecLayer({ gsonUrl, layername, zindex, visible }) {
      var vectorSource = new VectorSource({
        url: gsonUrl,
        format: new GeoJSON(),
      });
      this.$on("hook:destroyed", (_) => {
        vectorSource = null;
      });
      return new VectorImage({
        imageRatio: 2,
        name: layername,
        visible: visible,
        zIndex: zindex,
        source: vectorSource,
      });
      // });
    },
    loadBuildingGSONToVecLayer({ gsonUrl, layername, zindex }) {
      var vectorSource = new VectorSource({
        url: gsonUrl,
        format: new GeoJSON(),
      });
      this.$on("hook:destroyed", (_) => {
        vectorSource = null;
      });
      const layer = new VectorImage({
        style: getFWStyleFunc,
        imageRatio: 2,
        flag: "building",
        name: layername,
        zIndex: zindex,
        source: vectorSource,
      });
      return layer;
    },
    handleExitClick() {
      this.$store.commit("map/CHANGE_MAP_STATE", {
        key: "showCompareMap",
        value: false,
      });
    },
  },
};
</script>
<style lang="scss" scoped>
#olmapCompare {
  height: 100%;
  width: 100%;
}
.top-right-btn {
  position: absolute;
  z-index: 1;
  margin: 10px;
  display: grid;
  grid-auto-flow: column;
  right: 0;
  gap: 10px;
}
</style>
