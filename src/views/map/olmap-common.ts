import { Fill, Stroke, Style, Text } from 'ol/style';
import { Tile as TileLayer } from 'ol/layer';
import { XYZ, BingMaps } from 'ol/source';

/*底图图层---------------------------------------------------------------------------------------*/
function getTileLayerUrl(tileLayerName) {
    const tk = `d93d0f40401619335e98468b99411aa1`;
    // 随机从7个节点获取,负载均衡
    return `http://t{0-7}.tianditu.com/DataServer?T=${tileLayerName}&x={x}&y={y}&l={z}&tk=${tk}`;
}
// 天地图矢量图层
const tdtVec = new TileLayer({
    title: '天地图矢量图层',
    name: '矢量图层',
    source: new XYZ({
        url: getTileLayerUrl('vec_w'),
    }),
});
// 天地图矢量图层注记
const tdtVecNotation = new TileLayer({
    title: '天地图矢量图层注记',
    name: '矢量图层',
    source: new XYZ({
        url: getTileLayerUrl('cva_w'),
    }),
});

// x=106839&y=57181&z=17
// 可用
export const arcgisStateliteUrl = `http://services.arcgisonline.com/ArcGIS/services/World_Imagery/MapServer?mapname=Layers&layer=_alllayers&level={z}&row={y}&column={x}&format=PNG`;
const url1 = `https://mt1.google.cn/maps/vt/lyrs=s@804&hl=zh-CN&gl=cn&x={x}&y={y}&z={z}&s=Galile`; //s=    //s=Gal  //2021年1月11日不可用
const url2 = `https://mt1.google.cn/vt/imgtp=png32&lyrs=s@365000000&hl=x-local&gl=cn&x={x}&y={y}&z={z}&s=G`; //2021年1月11日不可用
const url3 = `http://www.google.cn/maps/vt?lyrs=s&gl=cn&x={x}&y={y}&z={z}`;
// 本来用bing的图挺好的，但是岭南哪里它没有很清晰卧槽，苹果的跟谷歌一样能放到21级别(需要申请accessKey，现在是用别人的，被限制了)
// const appleUrl = `https://sat-cdn3.apple-mapkit.com/tile?style=7&size=1&scale=1&x={x}&y={y}&z={z}&v=9022&accessKey=1611371240_4440703420837689562_%2F_zPCc8aRoHa3ySGo4JvGpwSAmjInm6JIhe0t6f%2FZHvnk%3D`

export const googleStateliteUrl = `https://mts{0-7}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}`;
// 天地图影像图层
const tdtSatelite = new TileLayer({
    title: '天地图影像图层',
    name: '影像图层',
    source: new XYZ({
        // url: `https://mt{0-7}.google.cn/maps/vt?lyrs=s&x={x}&y={y}&z={z}`//在2021年1月11日失效了，没有翻墙用不了
        // url: appleUrl
        url: getTileLayerUrl('img_w'),
        maxZoom: 18,
    }),
});
// new TileLayer({
//     title: "天地图影像图层",
//     name: "影像图层",
//     preload: Infinity,
//     source: new BingMaps({
//         key: "Ao1Fg8MB0216CLM-94b8FtfhwjBIs3LpzBKmzSWHtks9zA3H-eHlKl49pNf6JEYt",
//         imagerySet: "Aerial",
//         //使用maxZoom 19来查看拉伸的图块，而不是BingMaps//怎么没有早发现，这样就不会显示一大堆无图像了，而是模糊化而已“在此缩放级别没有照片”磁贴
//         maxZoom: 18
//     })
// });
// 天地图影像图层注记
const tdtSateliteNotation = new TileLayer({
    title: '天地图影像图层注记',
    name: '影像图层',
    source: new XYZ({
        url: getTileLayerUrl('cia_w'),
    }),
});
const googleMapLayer = new TileLayer({
    name: '谷歌图层',
    source: new XYZ({
        // url: 'http://www.google.cn/maps/vt/pb=!1m4!1m3!1i{z}!2i{x}!3i{y}!2m3!1e0!2sm!3i380072576!3m8!2szh-CN!3scn!5e1105!12m4!1e68!2m2!1sset!2sRoadmap!4e0!5m1!1e0'//矢量有偏移
        // url: 'http://www.google.cn/maps/vt?lyrs=t&x={x}&y={y}&z={z}'//全黑了
        // url: 'http://www.google.cn/maps/vt?lyrs=m&x={x}&y={y}&z={z}'//矢量有偏移
        // url: 'http://www.google.cn/maps/vt?lyrs=h&x={x}&y={y}&z={z}'//影像的注记
        url: 'http://www.google.cn/maps/vt?lyrs=s&x={x}&y={y}&z={z}', //不翻墙用不了影像无偏移,牛逼!
        /* 【国际版】卫星：正确 地图：偏移 */
        /* 【中国版】卫星：偏移 地图：偏移 */
    }),
});
/*---------------------------------------------------------------------------------------*/

/*样式---------------------------------------------------------------------------------------*/
export const fill = new Fill({
    color: '#d5e3001f',
});
export const stroke = new Stroke({
    color: 'transparent',
    width: 0,
});
// 黄色片
export const defaultPolygonStyle = new Style({
    fill: fill,
    stroke: stroke,
});

var blue = [0, 153, 255, 1]; //ol自带的外框高亮蓝
var width = 3;
// 外圈高亮蓝,中间透明
export const defaultSelectedPolygonStyle = [
    new Style({
        fill: new Fill({
            color: [0, 0, 255, 0.5],
        }),
        stroke: new Stroke({
            color: [0, 0, 255, 0.5],
            width: 1,
        }),
    }),
];

export const getFWSelectedStyleFunc = (fea) => {
    const props = fea.getProperties();
    const fwbh = props.fwbh || props['测绘编号'];
    return new Style({
        fill: new Fill({
            color: [0, 0, 255, 0.5],
        }),
        stroke: new Stroke({
            color: [0, 0, 255, 0.5],
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
};

export const getFWStyleFunc = (fea) => {
    const props = fea.getProperties();
    const fwbh = props.fwbh || props['测绘编号'];
    return new Style({
        fill,
        stroke,
        text: new Text({
            textAlign: 'left',
            text: fwbh,
            fill: new Fill({
                color: 'white',
            }),
        }),
    });
};

export const getNoneTextFWStyleFunc = (fea) => {
    const props = fea.getProperties();
    return new Style({
        fill,
        stroke,
    });
};

// 外面红,中间透明
export const redSelectedPolygonStyle = [
    new Style({
        fill: new Fill({
            color: [255, 255, 255, 0],
        }),
        stroke: new Stroke({
            color: 'red',
            width: 1,
        }),
    }),
];

export const cssColorNames = ['RoyalBlue', 'Green', 'Yellow'];
/*---------------------------------------------------------------------------------------*/

export {
    tdtVec,
    tdtVecNotation,
    tdtSatelite,
    tdtSateliteNotation,
    googleMapLayer,
};
