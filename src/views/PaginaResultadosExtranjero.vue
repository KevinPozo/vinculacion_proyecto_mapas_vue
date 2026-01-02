<!-- src/views/PaginaResultadosExtranjero.vue -->
<template>
  <div>
    <!--MapaExtranjero /-->
    <MapaNacional />
    
    
  </div>
</template>

<script>
import MapaExtranjero from "@/components/MapaExtranjero.vue";
import MapaNacional from "@/components/MapaNacional.vue";

export default {
  name: "PaginaResultadosExtranjero",
  components: {
    MapaExtranjero,
    MapaNacional,
  },
};
</script>
