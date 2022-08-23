import { Map } from 'ol';
import { boundingExtent } from 'ol/extent';
import { Group, Vector as VectorLayer } from 'ol/layer';
import type { Vector as VectorSource } from 'ol/source';
import type { Feature } from 'ol';
import type { Extent } from 'ol/extent';
import type { SimpleGeometry } from 'ol/geom';
import type { StyleFunction, StyleLike } from 'ol/style/Style';
import type { Style } from 'ol/style';
import type BaseLayer from 'ol/layer/Base';

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
        var view = this.getView();
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
