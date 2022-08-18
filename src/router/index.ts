import Vue from 'vue';
import Router from 'vue-router';

Vue.use(Router);

export const constantRoutes = [
    {
        path: '/businessManage',
        redirect: {
            name: 'projectOverview',
        },
        component: () => import('@/App.vue'),
        name: 'businessManage',
        alwaysShow: true,
        meta: {
            title: '业务管理',
            icon: 'user',
            auth: [10031, 10035, 10038, 10041, 10044, 10047],
        },
        children: [
            {
                path: 'projectOverview/index',
                name: 'projectOverview',
                // component: () => import('@/views/businessManage/index.vue'),
                component: () => import('@/views/map/index.vue'),
                meta: {
                    title: '项目总览',
                    keepAlive: true,
                },
            },
            // {
            //     path: 'serveyMap/index',
            //     name: 'serveyMap',
            //     component: () => import('@/views/businessManage/index.vue'),
            //     meta: {
            //         title: '测绘查丈',
            //         keepAlive: true,
            //         auth: [10038],
            //     },
            // },
        ],
    },
    {
        path: '/',
        redirect: '/kanban',
    },
    {
        path: '/kanban',
        name: 'kanban',
        component: () => import('@/views/chart/kanban.vue'),
        meta: { title: '数据大屏', icon: 'chart' },
    },
];

const createRouter = () =>
    new Router({
        routes: constantRoutes,
    });

const router = createRouter();

export default router;
