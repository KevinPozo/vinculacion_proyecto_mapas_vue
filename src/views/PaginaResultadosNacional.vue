<template>
    <div>
        <MapaNacional 
            :geoProvincias="geoProvincias" 
            :geoCantones="geoCantones" 
            :geoParroquias="geoParroquias"
            :resultadosProvincias="resultadosProvincias" 
            :resultadosCantones="resultadosCantones" 
            :resultadosParroquias="resultadosParroquias"
            :datosExportacion="datosExportacion"
            :colores="coloresMap"
            tituloInicial="Resultados Nacionales 1996"
        />
    </div>
</template>

<script>
import MapaNacional from "@/components/MapaNacional.vue";
import geoProvincias from "@/assets/1996/MapaNacional/provincias.json";

import resultadosProvincias from "@/assets/1996/datos/presidentes/PrimeraVuelta/Datos2025Provincias.json";
import resultadosCantones from "@/assets/1996/datos/presidentes/PrimeraVuelta/Datos2025Cantones.json";
import resultadosParroquias from "@/assets/1996/datos/presidentes/PrimeraVuelta/Datos2025Parroquias.json";

import { COLORES_PARTIDOS } from "@/assets/Informacion/ColoresPartidos";

export default {
    name: "PaginaResultadoNacional",
    components: {
        MapaNacional,
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

        let geoCantones = {};
        let geoParroquias = {};
        
        try {
            const mapContext = require.context("@/assets/1996/MapaNacional/", false, /\.json$/);
            
            if (mapContext.keys().includes("./cantones.json")) {
                geoCantones = mapContext("./cantones.json");
            }
            
            if (mapContext.keys().includes("./parroquias.json")) {
                geoParroquias = mapContext("./parroquias.json");
            }
        } catch (e) {
            console.warn("Could not load optional map files dynamically:", e);
        }

        return {
            geoProvincias, 
            geoCantones, 
            geoParroquias,
            resultadosProvincias,
            resultadosCantones,
            resultadosParroquias,
            coloresMap
        };
    },
    computed: {
        datosExportacion() {
            return [
                ...this.resultadosProvincias,
                ...this.resultadosCantones,
                ...this.resultadosParroquias
            ];
        }
    }
};
</script>