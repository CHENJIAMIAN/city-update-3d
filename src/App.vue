<template>
    <div id="App.vue" style="height: 100vh; width: 100vw">
        <router-view />
    </div>
</template>

<script lang="ts">
    import { defineComponent } from 'vue';
    export default defineComponent({
        name: 'App',
        created() {
            // window.appVue = this;
        },
    });
</script>
