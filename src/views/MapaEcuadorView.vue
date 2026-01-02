<template>
  <v-card-text class="pa-0">
    <v-row no-gutters>
      <!-- Panel Lateral de Instrucciones -->
      <v-col cols="12" md="3" class="pa-4 border-right">
        <div class="text-h6 mb-2">Instrucciones</div>
        <p class="body-2 text--secondary">
          1. Haga clic en una <strong>Provincia</strong> para ver sus cantones.<br />
          2. Haga clic en un <strong>Cantón</strong> para ver sus parroquias.<br />
          3. Use el botón "Regresar" para subir de nivel.
        </p>

        <v-divider class="my-4"></v-divider>

        <v-alert
          v-if="!datosCargados"
          border="left"
          colored-border
          color="#12a2c2"
          elevation="2"
          dense
        >
          Cargando cartografía...
        </v-alert>

        <v-alert v-else type="success" dense text>
          Cartografía cargada correctamente
        </v-alert>
      </v-col>

      <!-- Contenedor del Mapa -->
      <v-col cols="12" md="9">
        <div v-if="datosCargados" class="mapa-container">
          <MapaElectoral
            :geoJsonProvincias="jsonProvincias"
            :geoJsonCantones="jsonCantones"
            :geoJsonParroquias="jsonParroquias"
            :configuracion="configMapa"
            :debug="true"
          />
        </div>

        <div
          v-else
          class="d-flex justify-center align-center"
          style="height: 600px"
        >
          <v-progress-circular
            indeterminate
            color="#12a2c2"
            size="64"
          ></v-progress-circular>
        </div>
      </v-col>
    </v-row>
  </v-card-text>
</template>

<script setup>
/**
 * @file MapaEcuadorView.vue
 * @description Vista contenedora para el mapa electoral de Ecuador. 
 * Carga los archivos GeoJSON y configura el componente de mapa.
 */

import { ref, onMounted } from 'vue'
import MapaElectoral from '@/components/MapaEcuador.vue'

import provinciasData from '@/assets/1996/mapa/Provincias.json'
import cantonesData from '@/assets/1996/mapa/Cantones.json'
import parroquiasData from '@/assets/1996/mapa/Parroquias.json'

// --- VARIABLES REACTIVAS ---
const datosCargados = ref(false)
const jsonProvincias = ref(null)
const jsonCantones = ref(null)
const jsonParroquias = ref(null)

const configMapa = ref({
  colorBase: "#ECEFF1",
  colorHover: "#E91E63", 
  colorBorde: "#607D8B",
})

// --- MÉTODOS ---

/**
 * Simula la carga asíncrona de datos cartográficos.
 * @function cargarDatos
 */
const cargarDatos = () => {
  datosCargados.value = false
  
  // Simulamos delay de carga para UX
  setTimeout(() => {
    jsonProvincias.value = provinciasData
    jsonCantones.value = cantonesData
    jsonParroquias.value = parroquiasData
    datosCargados.value = true
  }, 500)
}

// --- LIFECYCLE ---

onMounted(() => {
  cargarDatos()
})
</script>

<style scoped>
.mapa-container {
  width: 100%;
  min-height: 600px;
}
</style>