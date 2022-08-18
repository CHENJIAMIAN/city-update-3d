import { defineStore } from 'pinia';

export const useCounterStore = defineStore({
    id: 'counter',
    state: () => ({
        counter: 0,
    }),
    getters: {
        doubleCount: (state) => state.counter * 2,
    },
    actions: {
        increment() {
            this.counter++;
        },
    },
});

export const useMapStore = defineStore({
    id: 'counter',
    state: () => ({
        showToolBox: true,
        showCompareMap: false,
        drawingPolygon: false,
        showFlyPathPanel: false,
        isWallDisplay: true,
        measuring: false,
        cesiumViewer: null,
        isDrawingRegion: false,
        isShow3DMeasure: false,
        isZhongShanQuanyan: false,
        wallDisplayTypeIsLine: false,
    }),
    getters: {
        doubleCount: (state) => state.counter * 2,
    },
    actions: {
        toggleMeasure({ commit }, measuring) {
            commit('TOGGLE_MEASURE', measuring);
        },

        TOGGLE_MEASURE: (state, measuring) => {
            state.measuring = measuring;
        },
        CHANGE_MAP_STATE: (state, { key, value }) => {
            if (state.hasOwnProperty(key)) {
                state[key] = value;
            }
        },
    },
});
