import * as Cesium from 'cesium';
import type {
    Cartographic,
    Viewer,
    Entity,
    Cartesian3,
    ScreenSpaceEventHandler,
} from 'cesium';
window.Cesium = Cesium;

declare module 'cesium' {
    interface Viewer {
        measureNumAnnotations: any;
    }
}

export const createCesium = () => {
    // 没有这个会401 地球加载不出来
    Cesium.Ion.defaultAccessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIzZmI0YTI3YS01NzY2LTQ3NmEtOGVmZi0zN2I4MTQ2OWE2YjEiLCJpZCI6MjAxMzIsImlhdCI6MTY2MTUwNTE0Mn0.SPS_UL1EaG0c-s2r1ETbcTj7PPMgz3GQ-eAFBUIlYrk"
    // 默认视图是中国m
    Cesium.Camera.DEFAULT_VIEW_RECTANGLE = Cesium.Rectangle.fromDegrees(
        90,
        -20,
        110,
        90
    );
    const viewer = (window.viewer = new Cesium.Viewer('cesium-container', {
        geocoder: false, // 地理位置查询定位控件
        navigationHelpButton: false, // 默认的相机控制提示控件
        fullscreenButton: false, // 全屏控件
        baseLayerPicker: !true, // 底图切换控件
        imageryProvider: undefined, //不要默认的bingmap底图
        homeButton: true, // 默认相机位置控件
        animation: true, // 控制场景动画的播放速度控件
        timeline: true, // 时间滚动条控件
        scene3DOnly: true, // 每个几何实例仅以3D渲染以节省GPU内存
        targetFrameRate: 48, //调低帧率，可以提高性能
        // terrainProvider: Cesium.createWorldTerrain() // 注释时相当于使用默认地形，解开注释相当于使用全球地形
    }));
    (viewer.homeButton as any)._container.style.top = '3.9rem';
    (viewer.homeButton as any)._container.style.right = '1.8rem';
    // 加载天地图影像作为底图.21级别会没有影像,不好
    viewer.imageryLayers.addImageryProvider(
        new Cesium.BingMapsImageryProvider({
            url: 'https://dev.virtualearth.net',
            key: 'Ao1Fg8MB0216CLM-94b8FtfhwjBIs3LpzBKmzSWHtks9zA3H-eHlKl49pNf6JEYt',
            mapStyle: Cesium.BingMapsStyle.AERIAL,
        })
        // new Cesium.UrlTemplateImageryProvider({
        //   url: `https://t{s}.tianditu.gov.cn/DataServer?T=img_w&x={x}&y={y}&l={z}&tk=${"d93d0f40401619335e98468b99411aa1"}`,
        //   enablePickFeatures: false,
        //   maximumLevel: 20,
        //   subdomains: ["0", "1", "2", "3", "4", "5", "6", "7"],
        // })
    );
    viewer.imageryLayers.addImageryProvider(
        new Cesium.UrlTemplateImageryProvider({
            url: 'https://t{s}.tianditu.gov.cn/DataServer?T=cia_w&x={x}&y={y}&l={z}&tk=9654e6de15fb2eb4aeb02a4191d9a712',
            subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'],
        })
    );

    // Object.freeze(viewer) //会造成无法修改属性的错误
    // viewer放store里会造成它是响应式的,从而造成内存溢出
    (viewer.cesiumWidget.creditContainer as HTMLElement).style.display = 'none'; // 隐藏版权
    (viewer.animation.container as HTMLElement).hidden = true;
    (viewer.timeline.container as HTMLElement).hidden = true;
    // viewer.resolutionScale = 0.9; //降低画布分辨率
    // viewer.scene.debugShowFramesPerSecond = true;
    viewer.scene.requestRenderMode = true; //启用requestRenderMode可减少Cesium渲染新帧的总时间并减少Cesium在应用程序中的总体CPU使用率。
    viewer.scene.maximumRenderTimeChange = Infinity; //没用到时间相关的动画的话,就这样设置
    viewer.scene.globe.depthTestAgainstTerrain = true;
    viewer.scene.globe.baseColor = Cesium.Color.BLACK;
    viewer.scene.skyAtmosphere.show = false;
    viewer.scene.skyBox.show = false;

    // 去掉cesium自带的entity的点击弹出对象属性pop的事件
    viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(
        Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK
    );
    viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(
        Cesium.ScreenSpaceEventType.LEFT_CLICK
    );

    // 防止入地,设置后当相机高度达到设置的最大和最小高度时将不再放大和缩小
    viewer.scene.screenSpaceCameraController.minimumZoomDistance = 20; //相机的高度的最小值
    viewer.scene.screenSpaceCameraController.maximumZoomDistance = 20000000; //相机高度的最大值

    return viewer;
};
