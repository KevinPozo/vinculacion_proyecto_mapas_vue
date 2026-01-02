<!-- src/views/PaginaResultadosExtranjero.vue -->
<template>
  <div>
    <MapaExtranjero />
    <MapaEcuador />
  </div>
</template>

<script>
import MapaExtranjero from "@/components/MapaExtranjero.vue";
import MapaEcuador from "@/views/MapaEcuadorView.vue";

export default {
  name: "PaginaResultadosExtranjero",
  components: {
    MapaExtranjero,
    MapaEcuador,
  },
};
</script>
