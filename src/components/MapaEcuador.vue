<template>
  <v-sheet class="position-relative overflow-hidden">
    <v-navigation-drawer v-model="drawer" absolute temporary width="300" color="#12a2c2" dark>
      <v-container class="contenedor-filtros">
        <h3 class="mb-4 text-uppercase" style="font-family: 'Oswald', sans-serif">
          Filtros Ecuador
        </h3>

        <!-- Filtros -->
        <div class="texto-filtro">VUELTA*</div>
        <v-select v-model="filtroVuelta" :items="itemsVuelta" outlined dense background-color="rgba(255,255,255,0.1)"
          hide-details dark class="mb-4"></v-select>

        <div class="texto-filtro">PARTIDO POLITICO*</div>
        <v-select v-model="filtroPartido" :items="itemsPartido" outlined dense background-color="rgba(255,255,255,0.1)"
          hide-details dark class="mb-4"></v-select>

        <div class="texto-filtro">Provincia</div>
        <v-select v-model="filtroProvincia" :items="itemsProvincia" outlined dense
          background-color="rgba(255,255,255,0.1)" hide-details dark class="mb-6"
          placeholder="Ej: Pichincha"></v-select>

        <p class="caption white--text">*Campo Obligatorio</p>

        <div class="texto-filtro">Cantón</div>
        <v-select v-model="filtroCanton" :items="itemsCanton" outlined dense background-color="rgba(255,255,255,0.1)"
          hide-details dark class="mb-6" placeholder="Ej: Quito"></v-select>

        <p class="caption white--text">*Campo Obligatorio</p>

        <div class="texto-filtro">Parroquia</div>
        <v-select v-model="filtroParroquia" :items="itemsParroquia" outlined dense
          background-color="rgba(255,255,255,0.1)" hide-details dark class="mb-6"
          placeholder="Ej: San Bartolo"></v-select>

        <p class="caption white--text">*Campo Obligatorio</p>

        <v-btn block color="white" light class="font-weight-bold" style="font-family: 'Oswald', sans-serif"
          @click="aplicarFiltros">
          BUSCAR
        </v-btn>
      </v-container>
    </v-navigation-drawer>

    <v-btn color="#12a2c2" dark fab small absolute top left style="top: 20px; left: 20px; z-index: 5"
      @click="drawer = !drawer">
      <svg style="width: 24px; height: 24px" viewBox="0 0 24 24">
        <path fill="currentColor"
          d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z" />
      </svg>
    </v-btn>

    <v-container fluid class="fondo-general">
      <v-row no-gutters>
        <v-card outlined color="transparent" width="100%">
          <v-row no-gutters>
            <v-col cols="12" md="3"></v-col>
            <v-col cols="12" md="6">
              <div class="flex-column-center">
                <div class="contenedor-titulo">
                  <v-card elevation="24" color="#2c3e50">
                    <div class="tarjeta-titulo-mapa">
                      Resultados Nacionales 1996
                    </div>
                  </v-card>
                </div>

                <div class="contenedor-botones-vuelta">
                  <v-btn tile class="btn-vuelta" :class="esPrimeraVuelta
                    ? 'btn-vuelta-activo'
                    : 'btn-vuelta-inactivo'
                    " @click="setVuelta(1)">
                    PRIMERA VUELTA
                  </v-btn>

                  <v-btn tile class="btn-vuelta" :class="!esPrimeraVuelta
                    ? 'btn-vuelta-activo'
                    : 'btn-vuelta-inactivo'
                    " @click="setVuelta(2)">
                    SEGUNDA VUELTA
                  </v-btn>
                </div>
              </div>
            </v-col>
          </v-row>


          <v-row>
            <v-col cols="12" md="9">
              <div class="wrapper-mapa">
                <transition name="fade">
                  <div v-if="puedeRegresar" class="boton-regresar" @click="handleGoBack">
                    <span class="icono-atras">←</span>
                    Regresar a {{ nombreNivelSuperior }}
                  </div>
                </transition>

                <div class="titulo-area">{{ tituloActual }}</div>

                <MapaElectoral ref="mapaRef" @region-selected="onRegionSelected" @level-change="onLevelChange" />
              </div>
            </v-col>
            <v-col cols="12" md="3">
              <v-card class="pa-4 text-center">
                <h3>Tarjetas Pendientes</h3>
              </v-card>
            </v-col>
          </v-row>
        </v-card>
      </v-row>
    </v-container>
  </v-sheet>
</template>

<script setup>
/**
 * @file MapaEcuador.vue
 * @description VISTA PRINCIPAL (Contenedor). 
 * Muestra filtros, barra lateral y carga el componente MapaElectoral.
 */

import { ref, computed } from "vue";
import MapaElectoral from "./MapaElectoral.vue";

// --- STATE UI ---
const drawer = ref(false);
const esPrimeraVuelta = ref(true);

// --- FILTROS ---
const filtroVuelta = ref(null);
const filtroPartido = ref(null);
const filtroProvincia = ref(null);
const filtroCanton = ref(null);
const filtroParroquia = ref(null);

const itemsVuelta = ["Primera Vuelta", "Segunda Vuelta"];
const itemsPartido = ["Partido A", "Partido B"]; // TODO: Cargar real
const itemsProvincia = [];
const itemsCanton = [];
const itemsParroquia = [];

// --- MAPA STATE ---
const mapaRef = ref(null);
const nivelActual = ref("provincias");
const tituloActual = ref("Ecuador");
const puedeRegresar = ref(false);

const nombreNivelSuperior = computed(() => {
  return nivelActual.value === "parroquias" ? "Cantón" : "Ecuador";
});


// --- HANDLERS ---
const setVuelta = (vuelta) => {
  esPrimeraVuelta.value = vuelta === 1;
};

const aplicarFiltros = () => {
  console.log("Aplicando filtros...");
  drawer.value = false;
};

const onRegionSelected = (data) => {
  console.log("Region seleccionada en vista:", data);
  // Aquí podríamos actualizar tarjetas de info o cargar datos especificos
};

const onLevelChange = (estado) => {
  nivelActual.value = estado.nivel;
  tituloActual.value = estado.titulo;
  puedeRegresar.value = estado.puedeRegresar;
};

const handleGoBack = () => {
  if (mapaRef.value) {
    mapaRef.value.regresarNivel();
  }
};

</script>

<style scoped>
.wrapper-mapa {
  width: 100%;
  height: 500px;
  background: transparent;
  position: relative;
}

.boton-regresar {
  position: absolute;
  top: -38px;
  right: 20px;
  z-index: 10;
  background: white;
  padding: 8px 16px;
  border-radius: 20px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  font-family: var(--fuente-principal, sans-serif);
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: transform 0.2s;
}

.boton-regresar:hover {
  transform: translateY(-2px);
}

.titulo-area {
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 10;
  font-family: var(--fuente-titulos, sans-serif);
  font-size: 1.5rem;
  font-weight: 700;
  color: #333;
  background: rgba(255, 255, 255, 0.9);
  padding: 5px 15px;
  border-radius: 4px;
  pointer-events: none;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Estilos copiados para consistencia visual */
.contenedor-filtros {
  padding: 20px;
}

.texto-filtro {
  font-weight: bold;
  margin-bottom: 5px;
  color: white;
}

.fondo-general {
  background-color: #f4f7f6;
  min-height: 100vh;
}

.contenedor-titulo {
  margin-bottom: 20px;
  margin-top: 20px;
}

.tarjeta-titulo-mapa {
  padding: 10px;
  color: white;
  text-align: center;
  font-size: 1.2rem;
  font-weight: bold;
}

.contenedor-botones-vuelta {
  display: flex;
  justify-content: center;
  margin-bottom: 10px;
}

.btn-vuelta {
  width: 150px;
  font-weight: bold;
  color: white;
}

.btn-vuelta-activo {
  background-color: #e67e22 !important;
}

.btn-vuelta-inactivo {
  background-color: #95a5a6 !important;
}

.flex-column-center {
  display: flex;
  flex-direction: column;
  align-items: center;
}
</style>
