import * as Cesium from 'cesium';
import type {
    Cartographic,
    Viewer,
    Entity,
    Cartesian3,
    ScreenSpaceEventHandler,
} from 'cesium';

// 弧度转经纬度
const cartographicToLnglat = (cartographic: Cartographic, viewer: Viewer) => {
    if (!cartographic) return;
    let lat = Cesium.Math.toDegrees(cartographic.latitude);
    let lng = Cesium.Math.toDegrees(cartographic.longitude);
    let hei = cartographic.height;
    return [lng, lat, hei];
};

export class MeasureTools {
    entityCollection: Entity[] = [];
    viewer: Viewer;

    constructor(viewer: Viewer) {
        this.viewer = viewer;
    }

    getCollection() {
        return this.entityCollection;
    }

    /**
     * 清除
     */
    destroy() {
        let { entityCollection, viewer } = this;
        for (let i = 0; i < entityCollection.length; i++) {
            viewer.entities.remove(entityCollection[i]);
        }
        entityCollection = [];
        viewer.scene.requestRender();
    }

    /**
     * 测距
     */
    measurePolyLine() {
        let {
            entityCollection,
            viewer,
            addPoint,
            getLengthText,
            addLabel,
            addLine,
        } = this;
        let positions: Cartesian3[] = [];
        let labelEntity: Entity; // 标签实体
        let deleteLabel = null; // 标签实体
        const collectionId = Math.random().toString();

        // 注册鼠标左击事件
        viewer.screenSpaceEventHandler.setInputAction(
            (clickEvent: ScreenSpaceEventHandler.PositionedEvent) => {
                let cartesian = viewer.scene.pickPosition(clickEvent.position); // 坐标
                if (!cartesian) {
                    return;
                }
                // 存储第一个点
                if (positions.length == 0) {
                    positions.push(cartesian.clone());

                    addPoint(cartesian, collectionId);

                    // 注册鼠标移动事件
                    viewer.screenSpaceEventHandler.setInputAction(
                        (moveEvent: ScreenSpaceEventHandler.MotionEvent) => {
                            let movePosition = viewer.scene.pickPosition(
                                moveEvent.endPosition
                            ); // 鼠标移动的点
                            if (!movePosition) {
                                return;
                            }
                            if (positions.length == 2) {
                                positions.pop();
                                positions.push(movePosition);

                                // 绘制label
                                if (labelEntity) {
                                    viewer.entities.remove(labelEntity);
                                    entityCollection.splice(
                                        entityCollection.indexOf(labelEntity),
                                        1
                                    );
                                }

                                // 计算中点
                                let centerPoint = Cesium.Cartesian3.midpoint(
                                    positions[0],
                                    positions[1],
                                    new Cesium.Cartesian3()
                                );
                                // 计算距离
                                let lengthText =
                                    '距离：' +
                                    getLengthText(positions[0], positions[1]);

                                labelEntity = addLabel(
                                    centerPoint,
                                    lengthText,
                                    collectionId
                                );
                                entityCollection.push(labelEntity);
                            } else {
                                positions.push(movePosition);
                                // 绘制线
                                addLine(positions, collectionId);
                            }
                            viewer.scene.requestRender();
                        },
                        Cesium.ScreenSpaceEventType.MOUSE_MOVE
                    );
                } else {
                    // 存储第二个点
                    positions.pop();
                    positions.push(cartesian);
                    addPoint(cartesian, collectionId);
                    viewer.screenSpaceEventHandler.removeInputAction(
                        Cesium.ScreenSpaceEventType.LEFT_CLICK
                    );
                    viewer.screenSpaceEventHandler.removeInputAction(
                        Cesium.ScreenSpaceEventType.MOUSE_MOVE
                    );
                    // 点击了删除
                    deleteLabel = addLabel(
                        cartesian,
                        '删除',
                        collectionId,
                        'deleteLabel'
                    );
                    entityCollection.push(deleteLabel);
                    new Cesium.ScreenSpaceEventHandler(
                        viewer.scene.canvas
                    ).setInputAction(
                        (click: ScreenSpaceEventHandler.PositionedEvent) => {
                            const pick = viewer.scene.pick(click.position);
                            if (pick && pick.id) {
                                if (
                                    pick.id._name === 'deleteLabel' &&
                                    collectionId === pick.id.collectionId
                                ) {
                                    viewer.entities.values
                                        .filter(
                                            (i) =>
                                                (i as any).collectionId ===
                                                collectionId
                                        )
                                        .forEach((i) =>
                                            viewer.entities.remove(i)
                                        );
                                    viewer.scene.requestRender();
                                }
                            }
                        },
                        Cesium.ScreenSpaceEventType.LEFT_CLICK
                    );
                }
            },
            Cesium.ScreenSpaceEventType.LEFT_CLICK
        );
    }

    /**
     * 测面积
     */
    measurePolygon() {
        let {
            entityCollection,
            viewer,
            addPoint,
            getLengthText,
            addLabel,
            addLine,
            getArea,
            getCenterOfGravityPoint,
            addPolyGon,
        } = this;
        let positions: Cartesian3[] = [];
        let clickStatus = false;
        let labelEntity: Entity; // 标签实体
        let deleteLabel = null; // 标签实体
        const collectionId = Math.random().toString();

        viewer.screenSpaceEventHandler.setInputAction(
            (clickEvent: ScreenSpaceEventHandler.PositionedEvent) => {
                clickStatus = true;
                let cartesian = viewer.scene.pickPosition(clickEvent.position);
                // let cartesian = viewer.scene.globe.pick(viewer.camera.getPickRay(clickEvent.position), viewer.scene);
                if (!cartesian) {
                    return;
                }
                switch (positions.length) {
                    case 0:
                        positions.push(cartesian.clone()); //鼠标左击 添加第1个点
                        addPoint(cartesian, collectionId);

                        // 注册鼠标移动事件
                        viewer.screenSpaceEventHandler.setInputAction(
                            (
                                moveEvent: ScreenSpaceEventHandler.MotionEvent
                            ) => {
                                let movePosition = viewer.scene.pickPosition(
                                    moveEvent.endPosition
                                );
                                // let movePosition = viewer.scene.globe.pick(viewer.camera.getPickRay(moveEvent.endPosition), viewer.scene);
                                if (!movePosition) {
                                    return;
                                }

                                switch (positions.length) {
                                    case 1:
                                        positions.push(movePosition);
                                        addLine(positions, collectionId);
                                        break;

                                    default:
                                        if (clickStatus) {
                                            positions.push(movePosition);
                                        } else {
                                            positions.pop();
                                            positions.push(movePosition);
                                        }
                                        if (positions.length >= 3) {
                                            // 绘制label
                                            if (labelEntity) {
                                                viewer.entities.remove(
                                                    labelEntity
                                                );
                                                entityCollection.splice(
                                                    entityCollection.indexOf(
                                                        labelEntity
                                                    ),
                                                    1
                                                );
                                            }
                                            let text =
                                                '面积：' + getArea(positions);
                                            let centerPoint =
                                                getCenterOfGravityPoint(
                                                    positions
                                                );
                                            // 标注放高一点
                                            // let lnglat = cartographicToLnglat(
                                            //     Cesium.Cartographic.fromCartesian(centerPoint), viewer
                                            // );
                                            // let cartesian2 = Cesium.Cartesian3.fromDegrees(lnglat[0], lnglat[1], lnglat[2] + 20)
                                            labelEntity = addLabel(
                                                centerPoint,
                                                text,
                                                collectionId
                                            );
                                            entityCollection.push(labelEntity);
                                        }
                                        break;
                                }
                                clickStatus = false;
                                viewer.scene.requestRender();
                            },
                            Cesium.ScreenSpaceEventType.MOUSE_MOVE
                        );

                        break;
                    case 2:
                        positions.pop();
                        positions.push(cartesian.clone()); // 鼠标左击 添加第3个点
                        addPoint(cartesian, collectionId);
                        addPolyGon(positions, collectionId);
                        // 右击结束
                        viewer.screenSpaceEventHandler.setInputAction(
                            (
                                clickEvent: ScreenSpaceEventHandler.PositionedEvent
                            ) => {
                                let clickPosition = viewer.scene.pickPosition(
                                    clickEvent.position
                                );
                                // let clickPosition = viewer.scene.globe.pick(viewer.camera.getPickRay(clickEvent.position), viewer.scene);

                                positions.pop();
                                positions.push(clickPosition);
                                positions.push(positions[0]); // 闭合
                                addPoint(clickPosition, collectionId);

                                viewer.screenSpaceEventHandler.removeInputAction(
                                    Cesium.ScreenSpaceEventType.LEFT_CLICK
                                );
                                viewer.screenSpaceEventHandler.removeInputAction(
                                    Cesium.ScreenSpaceEventType.MOUSE_MOVE
                                );
                                viewer.screenSpaceEventHandler.removeInputAction(
                                    Cesium.ScreenSpaceEventType
                                        .LEFT_DOUBLE_CLICK
                                );
                                // 点击了删除
                                deleteLabel = addLabel(
                                    clickPosition,
                                    '删除',
                                    collectionId,
                                    'deleteLabel'
                                );
                                entityCollection.push(deleteLabel);
                                new Cesium.ScreenSpaceEventHandler(
                                    viewer.scene.canvas
                                ).setInputAction(
                                    (
                                        click: ScreenSpaceEventHandler.PositionedEvent
                                    ) => {
                                        const pick = viewer.scene.pick(
                                            click.position
                                        );
                                        if (pick && pick.id) {
                                            if (
                                                pick.id._name ===
                                                    'deleteLabel' &&
                                                collectionId ===
                                                    pick.id.collectionId
                                            ) {
                                                viewer.entities.values
                                                    .filter(
                                                        (i) =>
                                                            (i as any)
                                                                .collectionId ===
                                                            collectionId
                                                    )
                                                    .forEach((i) =>
                                                        viewer.entities.remove(
                                                            i
                                                        )
                                                    );
                                                viewer.scene.requestRender();
                                            }
                                        }
                                    },
                                    Cesium.ScreenSpaceEventType.LEFT_CLICK
                                );
                            },
                            Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK
                        );
                        break;
                    default: // 鼠标左击 添加第2个点
                        positions.pop();
                        positions.push(cartesian.clone());
                        addPoint(cartesian, collectionId);
                        break;
                }
            },
            Cesium.ScreenSpaceEventType.LEFT_CLICK
        );
    }

    /**
     * 测高
     */
    measureHeight() {
        let {
            entityCollection,
            viewer,
            addPoint,
            getLengthText,
            addLabel,
            addLine,
            getArea,
            getCenterOfGravityPoint,
            addPolyGon,
        } = this;
        let positions: Cartesian3[] = [];
        let labelEntity_1: Entity; // 标签实体
        let labelEntity_2: Entity; // 标签实体
        let labelEntity_3: Entity; // 标签实体
        let deleteLabel = null;
        const collectionId = Math.random().toString();

        // 注册鼠标左击事件
        viewer.screenSpaceEventHandler.setInputAction(
            (clickEvent: ScreenSpaceEventHandler.PositionedEvent) => {
                let cartesian = viewer.scene.pickPosition(clickEvent.position); // 坐标
                if (!cartesian) {
                    return;
                }
                // 存储第一个点
                if (positions.length == 0) {
                    positions.push(cartesian.clone());
                    addPoint(cartesian, collectionId);

                    // 注册鼠标移动事件
                    viewer.screenSpaceEventHandler.setInputAction(
                        (moveEvent: ScreenSpaceEventHandler.MotionEvent) => {
                            let movePosition = viewer.scene.pickPosition(
                                moveEvent.endPosition
                            ); // 鼠标移动的点
                            if (!movePosition) {
                                return;
                            }
                            if (positions.length >= 2) {
                                positions.pop();
                                positions.pop();
                                positions.pop();

                                let cartographic =
                                    Cesium.Cartographic.fromCartesian(
                                        movePosition
                                    );
                                let height = Cesium.Cartographic.fromCartesian(
                                    positions[0]
                                ).height;

                                let verticalPoint =
                                    Cesium.Cartesian3.fromDegrees(
                                        Cesium.Math.toDegrees(
                                            cartographic.longitude
                                        ),
                                        Cesium.Math.toDegrees(
                                            cartographic.latitude
                                        ),
                                        height
                                    );
                                positions.push(verticalPoint);
                                positions.push(movePosition);
                                positions.push(positions[0]);

                                // 绘制label
                                if (labelEntity_1) {
                                    viewer.entities.remove(labelEntity_1);
                                    entityCollection.splice(
                                        entityCollection.indexOf(labelEntity_1),
                                        1
                                    );
                                    viewer.entities.remove(labelEntity_2);
                                    entityCollection.splice(
                                        entityCollection.indexOf(labelEntity_2),
                                        1
                                    );
                                    viewer.entities.remove(labelEntity_3);
                                    entityCollection.splice(
                                        entityCollection.indexOf(labelEntity_3),
                                        1
                                    );
                                }
                                // midpoint方法捕获到了错误

                                // 计算中点
                                let centerPoint_1 = Cesium.Cartesian3.midpoint(
                                    positions[0],
                                    positions[1],
                                    new Cesium.Cartesian3()
                                );
                                // 计算距离
                                let lengthText_1 =
                                    '水平距离：' +
                                    getLengthText(positions[0], positions[1]);

                                labelEntity_1 = addLabel(
                                    centerPoint_1,
                                    lengthText_1,
                                    collectionId
                                );
                                entityCollection.push(labelEntity_1);

                                // 计算中点
                                let centerPoint_2 = Cesium.Cartesian3.midpoint(
                                    positions[1],
                                    positions[2],
                                    new Cesium.Cartesian3()
                                );
                                // 计算距离
                                let lengthText_2 =
                                    '垂直距离：' +
                                    getLengthText(positions[1], positions[2]);

                                labelEntity_2 = addLabel(
                                    centerPoint_2,
                                    lengthText_2,
                                    collectionId
                                );
                                entityCollection.push(labelEntity_2);

                                // 计算中点
                                let centerPoint_3 = Cesium.Cartesian3.midpoint(
                                    positions[2],
                                    positions[3],
                                    new Cesium.Cartesian3()
                                );
                                // 计算距离
                                let lengthText_3 =
                                    '直线距离：' +
                                    getLengthText(positions[2], positions[3]);

                                labelEntity_3 = addLabel(
                                    centerPoint_3,
                                    lengthText_3,
                                    collectionId
                                );
                                entityCollection.push(labelEntity_3);
                            } else {
                                let verticalPoint = new Cesium.Cartesian3(
                                    movePosition.x,
                                    movePosition.y,
                                    positions[0].z
                                );
                                positions.push(verticalPoint);
                                positions.push(movePosition);
                                positions.push(positions[0]);
                                // 绘制线
                                addLine(positions, collectionId);
                            }
                            viewer.scene.requestRender();
                        },
                        Cesium.ScreenSpaceEventType.MOUSE_MOVE
                    );
                } else {
                    // 存储第二个点
                    positions.pop();
                    positions.pop();
                    positions.pop();
                    let cartographic =
                        Cesium.Cartographic.fromCartesian(cartesian);
                    let height = Cesium.Cartographic.fromCartesian(
                        positions[0]
                    ).height;

                    let verticalPoint = Cesium.Cartesian3.fromDegrees(
                        Cesium.Math.toDegrees(cartographic.longitude),
                        Cesium.Math.toDegrees(cartographic.latitude),
                        height
                    );
                    positions.push(verticalPoint);
                    positions.push(cartesian);
                    positions.push(positions[0]);
                    addPoint(cartesian, collectionId);
                    viewer.screenSpaceEventHandler.removeInputAction(
                        Cesium.ScreenSpaceEventType.LEFT_CLICK
                    );
                    viewer.screenSpaceEventHandler.removeInputAction(
                        Cesium.ScreenSpaceEventType.MOUSE_MOVE
                    );
                    // 点击了删除
                    deleteLabel = addLabel(
                        cartesian,
                        '删除',
                        collectionId,
                        'deleteLabel'
                    );
                    entityCollection.push(deleteLabel);
                    new Cesium.ScreenSpaceEventHandler(
                        viewer.scene.canvas
                    ).setInputAction(
                        (click: ScreenSpaceEventHandler.PositionedEvent) => {
                            const pick = viewer.scene.pick(click.position);
                            if (pick && pick.id) {
                                if (
                                    pick.id._name === 'deleteLabel' &&
                                    collectionId === pick.id.collectionId
                                ) {
                                    viewer.entities.values
                                        .filter(
                                            (i) =>
                                                (i as any).collectionId ===
                                                collectionId
                                        )
                                        .forEach((i) =>
                                            viewer.entities.remove(i)
                                        );
                                    viewer.scene.requestRender();
                                }
                            }
                        },
                        Cesium.ScreenSpaceEventType.LEFT_CLICK
                    );
                }
            },
            Cesium.ScreenSpaceEventType.LEFT_CLICK
        );
    }

    /**
     * 添加点
     * @param position
     */
    addPoint(position: Cartesian3, collectionId: string) {
        let { entityCollection, viewer } = this;
        console.log('addPoint', position);
        entityCollection.push(
            viewer.entities.add(
                new Cesium.Entity({
                    collectionId,
                    position: position,
                    point: {
                        color: Cesium.Color.GREEN,
                        pixelSize: 10,
                        scaleByDistance: new Cesium.NearFarScalar(
                            500,
                            1.0,
                            2000,
                            0.0
                        ),
                        translucencyByDistance: new Cesium.NearFarScalar(
                            500,
                            1.0,
                            2000,
                            0.0
                        ),
                    },
                } as Entity.ConstructorOptions)
            )
        );
        viewer.scene.requestRender();
    }

    /**
     * 添加线
     * @param positions
     */
    addLine(positions: Cartesian3[], collectionId: string) {
        let { entityCollection, viewer } = this;
        console.log('addLine', positions);
        let dynamicPositions = new Cesium.CallbackProperty(
            () => positions,
            false
        );
        entityCollection.push(
            viewer.entities.add(
                new Cesium.Entity({
                    collectionId,
                    polyline: {
                        positions: dynamicPositions,
                        width: 4,
                        material: Cesium.Color.RED,
                    },
                } as Entity.ConstructorOptions)
            )
        );
        viewer.scene.requestRender();
    }

    /**
     * 添加面
     * @param positions
     */
    addPolyGon(positions: Cartesian3[], collectionId: string) {
        let { entityCollection, viewer } = this;
        console.log('addPolyGon', positions);
        // https://github.com/CesiumGS/cesium/issues/8135
        // CallbackProperty no longer working for Polygon Entities #8135
        // 会报错 return positions;
        let dynamicPositions = new Cesium.CallbackProperty(
            () => new Cesium.PolygonHierarchy(positions),
            false
        );
        entityCollection.push(
            viewer.entities.add(
                new Cesium.Entity({
                    collectionId,
                    name: '多边形',
                    polygon: {
                        hierarchy: dynamicPositions,
                        /*  {
                    positions: dynamicPositions.getValue()
                }, */
                        material: Cesium.Color.RED.withAlpha(0.6),
                        classificationType: Cesium.ClassificationType.BOTH, // 贴地表和贴模型,如果设置了，这不能使用挤出高度
                    },
                } as Entity.ConstructorOptions)
            )
        );
        viewer.scene.requestRender();
    }

    /**
     * 添加标签
     * @param position
     * @param text
     */
    addLabel(
        centerPoint: Cartesian3,
        text: string,
        collectionId: string,
        name = ''
    ) {
        let { viewer } = this;
        let label = viewer.entities.add(
            new Cesium.Entity({
                collectionId,
                name: name,
                position: centerPoint,
                label: {
                    text: text,
                    font: '12pt sans-serif',
                    style: Cesium.LabelStyle.FILL_AND_OUTLINE, //FILL  FILL_AND_OUTLINE OUTLINE
                    fillColor: Cesium.Color.YELLOW,
                    showBackground: true, //指定标签后面背景的可见性
                    backgroundColor: new Cesium.Color(0.165, 0.165, 0.165, 0.8), // 背景颜色
                    backgroundPadding: new Cesium.Cartesian2(6, 6), //指定以像素为单位的水平和垂直背景填充padding
                    pixelOffset: new Cesium.Cartesian2(0, -25),
                    disableDepthTestDistance: Number.POSITIVE_INFINITY,
                },
            } as Entity.ConstructorOptions)
        );
        viewer.scene.requestRender();
        return label;
    }

    /**
     * 计算两点距离
     * @param firstPoint
     * @param secondPoint
     */
    getLengthText(firstPoint: Cartesian3, secondPoint: Cartesian3) {
        let length = Cesium.Cartesian3.distance(firstPoint, secondPoint);
        let str: string;
        if (length > 1000) {
            str = (length / 1000).toFixed(2) + ' 公里';
        } else {
            str = length.toFixed(2) + ' 米';
        }
        return str;
    }

    //计算多边形面积
    getArea(points: Cartesian3[]) {
        let radiansPerDegree = Math.PI / 180.0; //角度转化为弧度(rad)
        let degreesPerRadian = 180.0 / Math.PI; //弧度转化为角度

        /*角度*/
        const Angle = (p1: Cartesian3, p2: Cartesian3, p3: Cartesian3) => {
            let bearing21 = Bearing(p2, p1);
            let bearing23 = Bearing(p2, p3);
            let angle = bearing21 - bearing23;
            if (angle < 0) {
                angle += 360;
            }
            return angle;
        };

        /*方向*/
        const Bearing = (from: Cartesian3, to: Cartesian3) => {
            const from_Cartographic = Cesium.Cartographic.fromCartesian(from);
            const to_Cartographic = Cesium.Cartographic.fromCartesian(to);

            let lat1 = from_Cartographic.latitude;
            let lon1 = from_Cartographic.longitude;
            let lat2 = to_Cartographic.latitude;
            let lon2 = to_Cartographic.longitude;
            let angle = -Math.atan2(
                Math.sin(lon1 - lon2) * Math.cos(lat2),
                Math.cos(lat1) * Math.sin(lat2) -
                    Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon1 - lon2)
            );
            if (angle < 0) {
                angle += Math.PI * 2.0;
            }
            angle = angle * degreesPerRadian; //角度
            return angle;
        };

        const distance = (point1: Cartesian3, point2: Cartesian3) => {
            let point1cartographic = Cesium.Cartographic.fromCartesian(point1);
            let point2cartographic = Cesium.Cartographic.fromCartesian(point2);
            /**根据经纬度计算出距离**/
            let geodesic = new Cesium.EllipsoidGeodesic();
            geodesic.setEndPoints(point1cartographic, point2cartographic);
            let s = geodesic.surfaceDistance;
            //console.log(Math.sqrt(Math.pow(distance, 2) + Math.pow(endheight, 2)));
            //返回两点之间的距离
            s = Math.sqrt(
                Math.pow(s, 2) +
                    Math.pow(
                        point2cartographic.height - point1cartographic.height,
                        2
                    )
            );
            return s;
        };

        let res = 0;
        //拆分三角曲面

        for (let i = 0; i < points.length - 2; i++) {
            let j = (i + 1) % points.length;
            let k = (i + 2) % points.length;
            let totalAngle = Angle(points[i], points[j], points[k]);

            let dis_temp1 = distance(points[j], points[0]);
            let dis_temp2 = distance(points[k], points[0]);
            res += (dis_temp1 * dis_temp2 * Math.sin(totalAngle)) / 2;
            // console.log(res);
        }
        let resStr: string;
        if (res < 1000000) {
            resStr = Math.abs(res).toFixed(4) + ' 平方米';
        } else {
            resStr = Math.abs(res / 1000000.0).toFixed(4) + ' 平方公里';
        }

        return resStr;
    }

    /**
     * 计算多边形的中心（简单的处理）
     * @param mPoints
     * @returns {*[]}
     */
    getCenterOfGravityPoint(mPoints: Cartesian3[]) {
        let centerPoint = mPoints[0];
        for (let i = 1; i < mPoints.length; i++) {
            centerPoint = Cesium.Cartesian3.midpoint(
                centerPoint,
                mPoints[i],
                new Cesium.Cartesian3()
            );
        }
        return centerPoint;
    }
}
