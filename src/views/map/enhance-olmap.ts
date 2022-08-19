import { Map } from 'ol';
import { boundingExtent } from 'ol/extent';
import { Group } from 'ol/layer';

declare module 'ol/' {
    interface Map {
        getLayerByProperty: any;
        getLayersByProperty: any;
        moveViewById: any;
        fitExtentByFeatures: any;
        getAllBuildingFeas: any;
        resetAllBuildingStyleAndReturnAllFeas: any;
    }
}

// 给地图添加一些工具方法
Map.prototype.getLayerByProperty = function (propname, propval) {
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
};
Map.prototype.getLayersByProperty = function (propname, propval) {
    const destlayer = [];
    this.getLayers()
        .getArray()
        .forEach((layer) => {
            if (layer instanceof Group) {
                layer
                    .getLayers()
                    .getArray()
                    .forEach((layer2) => {
                        if (layer2.getProperties()[propname] === propval) {
                            destlayer.push(layer2);
                        }
                    });
            } else if (layer.getProperties()[propname] === propval) {
                destlayer.push(layer);
            }
        });
    return destlayer;
};
// 根据id定位到地图的方法
Map.prototype.moveViewById = function (vecSource, id, zoom) {
    const feature = vecSource.getFeatureById(id);
    if (!feature) {
        return;
    }
    var view = this.getView();
    view.fit(feature.getGeometry());
    zoom && view.setZoom(zoom);
};

Map.prototype.fitExtentByFeatures = function (feas) {
    let extent = [];
    if (feas.length > 1) {
        const extents = feas.map((i) => i.getGeometry().getFlatCoordinates());
        extent = boundingExtent(extents);
    } else {
        extent = feas[0].getGeometry().getExtent();
    }
    this.getView().fit(extent);
};

Map.prototype.getAllBuildingFeas = function () {
    const layers = this.getLayersByProperty('flag', 'building');
    if (layers.length < 1) return;
    const feas = [];
    layers.forEach((layer) => {
        const allFeas = layer.getSource().getFeatures();
        feas.push(...allFeas);
    });
    return feas;
};

Map.prototype.resetAllBuildingStyleAndReturnAllFeas = function () {
    // 全部恢复默认样式
    const layers = this.getLayersByProperty('flag', 'building');
    if (layers.length < 1) return;
    const feas = [];
    layers.forEach((layer) => {
        const styleFunc = layer.getStyleFunction(); //获取默认样式
        const allFeas = layer.getSource().getFeatures();
        allFeas.forEach((fea) => fea.setStyle(styleFunc(fea)));
        feas.push(...allFeas);
    });
    return feas;
};
