<script>

import AppHeader from "@/components/AppHeader.vue";

export default {

    components: {
        AppHeader
    }

};

</script>

<template>

    <div id="app">

        <AppHeader />

        <main class="container mt-4">

            <router-view />

        </main>

    </div>

</template>