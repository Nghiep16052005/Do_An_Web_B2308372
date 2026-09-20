<script>
import ClientHeader from "./ClientHeader.vue";
import ClientFooter from "./ClientFooter.vue";

export default {
    name: "ClientLayout",

    components: {
        ClientHeader,
        ClientFooter
    }
};
</script>

<template>
    <div class="client-layout">
        <ClientHeader />
        <main class="client-content container">
            <router-view />
        </main>
        <ClientFooter />
    </div>
</template>
