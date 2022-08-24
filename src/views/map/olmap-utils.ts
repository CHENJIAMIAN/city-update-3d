import View from 'ol/View';
import { Fill, Stroke, Style, Text } from 'ol/style';
import { Vector as VectorSource } from 'ol/source';
import type { Options } from 'ol/layer/VectorImage';
import type { Geometry } from 'ol/geom';
import { GeoJSON } from 'ol/format';
import { VectorImage } from 'ol/layer';
import { getFWStyleFunc } from '@/views/map/olmap-common';
import type Feature from 'ol/Feature';

import type { Vector as VectorLayer } from 'ol/layer';
import type { Extent } from 'ol/extent';
import type OlMap from '@/views/map/enhance-olmap';

// Map([[key1,value1],[key2,value2]])
const layerColorMap = new Map([]);

function getLayerColor(
    layerColorMap: Map<string, string[]>,
    layername: string
) {
    for (let [k, v] of layerColorMap) {
        if (v.includes(layername)) {
            return k;
        }
    }
}

function getStyleFunc(layername: string) {
    let styleFunction = undefined;
    const color = getLayerColor(layerColorMap, layername);
    if (color)
        return function (fea: Feature) {
            return new Style({
                stroke: new Stroke({
                    color: color,
                    width: 1,
                }),
            });
        };
    // 后续项目改成根据要素的Layer属性字段去适配,如此,一个标注图层,一个线图层即可模拟cad效果
    const getCADLineStyleFunc = (fea: Feature) => {
        const { layer, color: colorIndex } = fea.getProperties();
        const color = getLayerColor(layerColorMap, layer);
        return color
            ? new Style({
                  stroke: new Stroke({
                      color: color,
                      width: 1,
                  }),
              })
            : undefined;
    };
    const getCADPointLableStyleFunc = (fea: Feature) => {
        const { layer, color: colorIndex, text, txtjust } = fea.getProperties();
        const color = getLayerColor(layerColorMap, layer);
        return new Style({
            text: new Text({
                textAlign: (txtjust && txtjust.toLowerCase()) || 'left',
                text: text,
                fill: new Fill({
                    color: color ? color : 'white',
                }),
            }),
        });
    };

    if (layername.includes('_Annotation')) {
        styleFunction = function (fea: Feature) {
            return getCADPointLableStyleFunc(fea);
        };
    } else if (layername.includes('_Polyline')) {
        styleFunction = function (fea: Feature) {
            return getCADLineStyleFunc(fea);
        };
    } else if (layername.includes('_fanwei')) {
        styleFunction = function (fea: Feature) {
            return new Style({
                stroke: new Stroke({
                    color: 'red',
                    width: 1,
                }),
            });
        };
    } else if (layername == 'project') {
        styleFunction = function (feature: Feature) {
            return new Style({
                stroke: new Stroke({ width: 2, color: 'lightblue' }),
                fill: new Fill({ color: '#0074c759' }),
                text: new Text({
                    textAlign: 'left',
                    offsetX: 20,
                    font: 'normal 16px Arial',
                    text:
                        '' + feature.get('project') + feature.get('progress') ||
                        '',
                    fill: new Fill({
                        color: '#006C69',
                    }),
                }),
            });
        };
    } else if (layername.includes('_fw') || layername.includes('_fsw')) {
        styleFunction = function (fea: Feature) {
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
    minZoom,
}: {
    flag?: boolean;
    gsonUrl: string;
    layername: string;
    zIndex: number;
    visible: boolean;
    minZoom: number | undefined;
}) {
    let vectorSource = new VectorSource({
        url: gsonUrl,
        format: new GeoJSON(),
    });
    return new VectorImage({
        name: layername,
        source: vectorSource,
        style: getStyleFunc(layername) as any,
        imageRatio: 2,
        minZoom,
        visible,
        zIndex,
        flag,
    } as Options<VectorSource<Geometry>>);
}

export function loadGSONToVecLayer2({
    flag,
    geojsonObject,
    layername,
    zIndex,
    visible,
    minZoom,
}: {
    flag: string;
    geojsonObject: any;
    layername: string;
    zIndex: number;
    visible?: boolean;
    minZoom?: number;
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
        flag,
    } as Options<VectorSource<Geometry>>);
}

export function getBuildingFeaByMeasureNum(measureNum: string, map: OlMap) {
    const layers = map.getLayersByProperty('flag', 'building');
    const feas: Feature[] = [];
    layers.forEach((layer: VectorLayer<VectorSource<Geometry>>) => {
        const source = layer.getSource();
        if (source) feas.push(...source.getFeatures());
    });
    const fea = feas.find((i) => {
        const fwbh = i.getProperties().fwbh || i.getProperties()['测绘编号'];
        return fwbh === measureNum;
    });
    return fea;
}

export function lockViewByExtent(extent: Extent, map: OlMap) {
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
        maxZoom: 21,
    });
    map.setView(projectConstrainView);
}
