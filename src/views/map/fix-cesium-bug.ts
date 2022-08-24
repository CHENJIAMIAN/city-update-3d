import * as Cesium from 'cesium';
import { Model } from 'cesium';
/*-解决"RuntimeError", message: "Unknown crs name: urn:ogc:def:crs:EPSG::3857"--------------------------------------------------------------------------------------*/
import { default as proj4 } from 'proj4';
Cesium.GeoJsonDataSource.crsNames['urn:ogc:def:crs:EPSG::3857'] =
    Cesium.GeoJsonDataSource.crsNames['EPSG:3857'] = function (
        coordinates: any
    ) {
        const firstProjection =
            'PROJCS["WGS 84 / Pseudo-Mercator",GEOGCS["WGS 84",DATUM["WGS_1984",SPHEROID["WGS 84",6378137,298.257223563,AUTHORITY["EPSG","7030"]],AUTHORITY["EPSG","6326"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.0174532925199433,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4326"]],PROJECTION["Mercator_1SP"],PARAMETER["central_meridian",0],PARAMETER["scale_factor",1],PARAMETER["false_easting",0],PARAMETER["false_northing",0],UNIT["metre",1,AUTHORITY["EPSG","9001"]],AXIS["X",EAST],AXIS["Y",NORTH],EXTENSION["PROJ4","+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext  +no_defs"],AUTHORITY["EPSG","3857"]]';
        const secondProjection =
            'GEOGCS["WGS 84",DATUM["WGS_1984",SPHEROID["WGS 84",6378137,298.257223563,AUTHORITY["EPSG","7030"]],AUTHORITY["EPSG","6326"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.0174532925199433,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4326"]]';

        const xa = coordinates[0];
        const ya = coordinates[1];

        const newCoordinates = proj4(firstProjection, secondProjection, [
            xa,
            ya,
        ]);
        return Cesium.Cartesian3.fromDegrees(
            newCoordinates[0],
            newCoordinates[1],
            0
        );
    };
/*-解决Cesium1.50对gltf2.0 3dtiles数据读取的问题--------------------------------------------------------------------------------------*/
// 说明文章在这里：icon cesium-notes/icon 解决Cesium1.50对gltf2.0 3dtiles数据读取的问题/
// https://zhuanlan.zhihu.com/p/46189487
// https://www.jianshu.com/p/e0e0a62c5726

let fixGltf = function (gltf: any) {
    if (!gltf.extensionsUsed) {
        return;
    }

    let v = gltf.extensionsUsed.indexOf('KHR_technique_webgl');
    let t = gltf.extensionsRequired.indexOf('KHR_technique_webgl');
    // 中招了。。
    if (v !== -1) {
        gltf.extensionsRequired.splice(t, 1, 'KHR_techniques_webgl');
        gltf.extensionsUsed.splice(v, 1, 'KHR_techniques_webgl');
        gltf.extensions = gltf.extensions || {};
        gltf.extensions['KHR_techniques_webgl'] = {};
        gltf.extensions['KHR_techniques_webgl'].programs = gltf.programs;
        gltf.extensions['KHR_techniques_webgl'].shaders = gltf.shaders;
        gltf.extensions['KHR_techniques_webgl'].techniques = gltf.techniques;
        let techniques = gltf.extensions['KHR_techniques_webgl'].techniques;

        gltf.materials.forEach(function (material: any, index: number) {
            gltf.materials[index].extensions ||
                (gltf.materials[index].extensions = {
                    KHR_technique_webgl: {},
                }); // vtxf 181025
            gltf.materials[index].extensions['KHR_technique_webgl'].values =
                gltf.materials[index].values;
            gltf.materials[index].extensions['KHR_techniques_webgl'] =
                gltf.materials[index].extensions['KHR_technique_webgl'];

            let vtxfMaterialExtension =
                gltf.materials[index].extensions['KHR_techniques_webgl'];
            vtxfMaterialExtension.technique ||
                (vtxfMaterialExtension.technique =
                    gltf.materials[index].technique); // vtxf 181025

            for (let value in vtxfMaterialExtension.values) {
                let us = techniques[vtxfMaterialExtension.technique].uniforms;
                for (let key in us) {
                    if (us[key] === value) {
                        vtxfMaterialExtension.values[key] =
                            vtxfMaterialExtension.values[value];
                        delete vtxfMaterialExtension.values[value];
                        break;
                    }
                }
            }
        });

        techniques.forEach(function (t: any) {
            for (let attribute in t.attributes) {
                let name = t.attributes[attribute];
                t.attributes[attribute] = t.parameters[name];
            }

            for (let uniform in t.uniforms) {
                let name = t.uniforms[uniform];
                t.uniforms[uniform] = t.parameters[name];
            }
        });
    }
};

Object.defineProperties(Model.prototype, {
    _cachedGltf: {
        set: function (value) {
            this._vtxf_cachedGltf = value;
            if (this._vtxf_cachedGltf && this._vtxf_cachedGltf._gltf) {
                fixGltf(this._vtxf_cachedGltf._gltf);
            }
        },
        get: function () {
            return this._vtxf_cachedGltf;
        },
    },
});
/*---------------------------------------------------------------------------------------*/
