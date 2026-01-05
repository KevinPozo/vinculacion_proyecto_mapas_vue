<template>
  <div>
    <MapaNacional
      :geoProvincias="geoProvincias"
      :geoCantones="geoCantones"
      :geoParroquias="geoParroquias"
    />
  </div>
</template>

<script>
import MapaNacional from "@/components/MapaNacional.vue";
import geoProvincias from "@/assets/1996/MapaNacional/provincias.json";
import geoCantones from "@/assets/1996/MapaNacional/cantones.json";
import geoParroquias from "@/assets/1996/MapaNacional/parroquias.json";

export default {
  name: "PaginaResultadoNacional",
  components: {
    MapaNacional,
  },
  data() {
    return {
      geoProvincias, geoCantones, geoParroquias,
    };
  },
};
</script>