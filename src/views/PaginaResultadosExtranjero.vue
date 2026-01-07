<template>
  <div>
    <MapaExtranjero 
      :resultadosCantones="resultadosCantones" 
      :cantonesData="cantonesData"
      :parroquiasData="parroquiasData"
      :colores="coloresMap" 
      tituloMap="Resultados Internacionales 1996"
    />
  </div>
</template>

<script>
import MapaExtranjero from "@/components/MapaExtranjero.vue";
import resultadosCantones from "@/assets/1996/datos/presidentes/PrimeraVuelta/Datos2025Cantones.json";
import cantonesData from "@/assets/1996/datos/presidentes/PrimeraVuelta/Datos2025Cantones.json";
import parroquiasData from "@/assets/1996/datos/presidentes/PrimeraVuelta/Datos2025Parroquias.json";
import { COLORES_PARTIDOS } from "@/assets/Informacion/ColoresPartidos";

export default {
  name: "PaginaResultadosExtranjero",
  components: {
    MapaExtranjero,
  },
  data() {
    const coloresMap = {
      "ADN": COLORES_PARTIDOS["ADN"],
      "RC": COLORES_PARTIDOS["RC/RETO"],
      "RC/RETO": COLORES_PARTIDOS["RC/RETO"],
      "PSC": COLORES_PARTIDOS["PSC"],
      "SUMA": COLORES_PARTIDOS["SUMA"],
      "MUPP": COLORES_PARTIDOS["PK-UP"],
      "ID": COLORES_PARTIDOS["ID"],
      "CONSTRUYE": COLORES_PARTIDOS[11],
      "PSP": COLORES_PARTIDOS["PSP"],
      "AMIGO": COLORES_PARTIDOS["M. AMIGO"],
      "AVANZA": COLORES_PARTIDOS["AVANZA"],
      "PAIS": COLORES_PARTIDOS["PAIS"],
    };

    return {
      resultadosCantones,
      cantonesData,
      parroquiasData,
      coloresMap,
    };
  },
};
</script>