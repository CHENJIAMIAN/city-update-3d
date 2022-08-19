<template>
    <div id="App.vue" style="height: 100vh; width: 100vw">
        <router-view />
    </div>
</template>

<script lang="ts">
    export default {
        name: 'App',
        created() {
            // window.appVue = this;
        },
    };
</script>
