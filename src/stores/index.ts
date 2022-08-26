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
    id: 'map',
    state: () => ({
        counter: 0,
        showToolBox: true,
        showCompareMap: false,
        drawingPolygon: false,
        showFlyPathPanel: false,
        isWallDisplay: true,
        measuring: false,
        cesiumViewer: null,
        isDrawingRegion: false,
        isShow3DMeasure: false,
        wallDisplayTypeIsLine: false,
    }),
    getters: {
        doubleCount(state) {
            return this.counter * 2;
        },
    },
    actions: {
        CHANGE_MAP_STATE({ key, value }: Record<string, any>) {
            if (this.hasOwnProperty(key)) {
                this[key] = value;
            }
        },
    },
});
