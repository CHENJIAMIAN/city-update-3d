import {
    tdtVec,
    tdtVecNotation,
    tdtSatelite,
    tdtSateliteNotation,
} from '@/views/map/olmap-common';
import {
    defaults as defaultControls, // 比例尺
} from 'ol/control';
import { Map, View } from 'ol';
import { boundingExtent } from 'ol/extent';
import { Group, Vector as VectorLayer } from 'ol/layer';
import type { Vector as VectorSource } from 'ol/source';
import type { Feature } from 'ol';
import type { Extent } from 'ol/extent';
import type { SimpleGeometry } from 'ol/geom';
import type { StyleFunction, StyleLike } from 'ol/style/Style';
import type { Style } from 'ol/style';
import type BaseLayer from 'ol/layer/Base';
import { fromLonLat } from 'ol/proj';

declare module 'ol/' {
    interface Map {
        // getLayerByProperty: any;
        // getLayersByProperty: any;
        // moveViewById: any;
        // fitExtentByFeatures: any;
        // getAllBuildingFeas: any;
        // resetAllBuildingStyleAndReturnAllFeas: any;
        closerElements: any;
        closerOverLays: any;
        helpTooltipElement: any;
        helpTooltipOverLay: any;
        pointerMoveMeasureTipHandler: any;
    }
}

export default class EnhanceOlMap extends Map {
    // 给地图添加一些工具方法
    getLayerByProperty(
        propname: string,
        propval: string
    ): BaseLayer | undefined {
        let destlayer;
        this.getLayers()
            .getArray()
            .forEach((layer) => {
                if (layer instanceof Group) {
                    layer
                        .getLayers()
                        .getArray()
                        .forEach((layer2) => {
                            if (layer2.getProperties()[propname] === propval) {
                                destlayer = layer2;
                            }
                        });
                } else if (layer.getProperties()[propname] === propval) {
                    destlayer = layer;
                }
            });
        return destlayer;
    }
    getLayersByProperty(propname: string, propval: string) {
        const destlayer: VectorLayer<VectorSource>[] = [];
        this.getLayers()
            .getArray()
            .forEach((layer) => {
                if (layer instanceof Group) {
                    layer
                        .getLayers()
                        .getArray()
                        .forEach((layer2) => {
                            if (layer2.getProperties()[propname] === propval) {
                                destlayer.push(
                                    layer2 as VectorLayer<VectorSource>
                                );
                            }
                        });
                } else if (layer.getProperties()[propname] === propval) {
                    destlayer.push(layer as VectorLayer<VectorSource>);
                }
            });
        return destlayer;
    }
    // 根据id定位到地图的方法
    moveViewById(vecSource: VectorSource, id: string, zoom: number) {
        const feature = vecSource.getFeatureById(id);
        if (!feature) {
            return;
        }
        let view = this.getView();
        const geom = feature.getGeometry();
        geom && view.fit(geom as SimpleGeometry);
        zoom && view.setZoom(zoom);
    }

    fitExtentByFeatures(feas: Feature[]) {
        let extent: Extent = [];
        if (feas.length > 1) {
            const extents = feas.map((i) =>
                (i?.getGeometry() as SimpleGeometry)?.getFlatCoordinates()
            );
            extent = boundingExtent(extents);
        } else {
            const geom = feas[0]?.getGeometry();
            if (geom) extent = geom?.getExtent();
        }
        extent && this.getView().fit(extent);
    }

    getAllBuildingFeas() {
        const layers = this.getLayersByProperty('flag', 'building');
        if (layers.length < 1) return;
        const feas: Feature[] = [];
        layers.forEach((layer) => {
            const allFeas = layer?.getSource()?.getFeatures();
            allFeas && feas.push(...allFeas);
        });
        return feas;
    }

    resetAllBuildingStyleAndReturnAllFeas() {
        const layers = this.getLayersByProperty('flag', 'building');
        if (layers.length < 1) return;
        const feas: Feature[] = [];
        layers.forEach((layer) => {
            const styleFunc = layer.getStyleFunction(); //获取默认样式
            const allFeas = layer?.getSource()?.getFeatures();
            allFeas?.forEach((fea) => {
                const stylelike = styleFunc && styleFunc(fea, 0);
                stylelike && fea.setStyle(stylelike as any); //奇怪报错
            });
            allFeas && feas.push(...allFeas);
        });
        return feas;
    }
}

export const createMap = (options?: Record<string, any>) => {
    const chinaView = new View({
        center: fromLonLat([
            104.11137264774226, 34.584094621462896,
        ]) /* 中国中心*/,
        zoom: 5,
    });

    const mapElementId = 'olmap';
    const mapElement = document.querySelector('#' + mapElementId);
    tdtVec.setVisible(false);
    tdtVecNotation.setVisible(false);
    // 多个组件引用同一个vue组件，这个组件又引用同一个tdtSatelite，始终会造成状态不一致问题
    tdtSatelite.setVisible(true);
    tdtSateliteNotation.setVisible(true);

    const map: EnhanceOlMap = new EnhanceOlMap({
        controls: defaultControls({
            attribution: false,
            // zoom: !options?.asKanban,
        }),
        layers: [
            tdtSatelite,
            tdtVec,
            tdtVecNotation,
            tdtSateliteNotation /* googleMapLayer */,
        ],
        view: chinaView,
        target: mapElementId,
    });
    // 为什么缩放或单击地图时不正确/不正确？ https://openlayers.org/en/latest/doc/faq.html
    const sizeObserver = new ResizeObserver(() => {
        console.log('ResizeObserver updateSize');
        map && map.updateSize();
    });
    mapElement && sizeObserver.observe(mapElement);

    return map;
};

