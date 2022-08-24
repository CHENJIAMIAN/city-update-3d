import Vue from 'vue';
import Router from 'vue-router';

Vue.use(Router);

export const constantRoutes = [
    {
        path: '/',
        redirect: {
            name: 'mappage',
        },
    },
    {
        path: '/kanban',
        name: 'kanban',
        component: () => import('@/views/chart/kanban.vue'),
        meta: { title: '数据大屏' },
    },
    {
        path: '/mappage',
        name: 'mappage',
        component: () => import('@/views/map/index.vue'),
        // component: () => import
        // ('@/views/map/components/CesiumMap.vue'),
        meta: { title: '地图页面' },
    },
];

const createRouter = () =>
    new Router({
        routes: constantRoutes,
    });

const router = createRouter();

export default router;
