// https://vuejs.org/guide/typescript/options-api.html#augmenting-global-properties
// 为了利用，您需要确保扩充放置在TypeScript 模块中。
// 一个顶级import或export让这个文件编译成代码, 模块扩充
// 否则, 它将覆盖原始类型而不是扩充它们！
// export {};

import type axios from 'axios';
import { Router } from 'vue-router';

declare module 'vue' {
    interface ComponentCustomProperties {
        beforeRouteEnter?(to: Route, from: Route, next: () => void): void;
        $http: typeof axios;
        $translate: (key: string) => string;
        map: any;
        zoomThatCanSelect: any;
        chinaView: any;
        $route: any;
        baseLayers: any;
        $router: Router;
    }
}

// import { Vector as VectorSource } from 'ol/source';
// import type { Options, VectorImageLayer } from 'ol/layer/VectorImage';
// import { Geometry } from 'ol/geom/Geometry';
// declare module 'ol/layer' {
//     export type Options<
//         VectorSourceType extends import('ol/source/Vector.js').default<
//             import('ol/geom/Geometry.js').default
//         >
//     > = { name: string };
// }
