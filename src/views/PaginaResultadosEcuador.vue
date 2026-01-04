<template>
  <v-app>
    <v-app-bar color="white" elevation="1" height="70" style="z-index: 100">
      <div class="d-flex align-center ml-4">
        <h1 style="font-family: 'Oswald', sans-serif; color: #1565c0; font-size: 2.5rem; letter-spacing: -2px;">
          sevee
        </h1>
      </div>
      <v-spacer></v-spacer>
      <div class="d-none d-md-flex mr-4">
        <v-btn text class="btn-nav">Inicio</v-btn>
        <v-btn text class="btn-nav active-nav">Votantes Nacionales</v-btn>
        <v-btn text class="btn-nav">Votantes Extranjero</v-btn>
        <v-btn text class="btn-nav">Acerca De</v-btn>
      </div>
    </v-app-bar>

    <v-btn
      v-if="!isDrawerOpen"
      color="#12a2c2"
      dark
      absolute
      elevation="2"
      style="top: 90px; left: 20px; z-index: 50; width: 48px; height: 48px; min-width: 0; padding: 0; border-radius: 4px;"
      @click.stop="isDrawerOpen = true"
    >
      <svg style="width: 28px; height: 28px" viewBox="0 0 24 24">
        <path fill="currentColor" d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L20.71,20L20,20.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z" />
      </svg>
    </v-btn>

    <v-navigation-drawer
      v-model="isDrawerOpen"
      fixed
      temporary
      width="320"
      color="#12a2c2"
      dark
      style="top: 0; height: 100vh; z-index: 999"
    >
      <v-container class="contenedor-filtros pa-6">
        
        <h3 class="mb-6 text-uppercase white--text font-weight-bold" style="font-family: 'Oswald', sans-serif; letter-spacing: 1px;">
          CONFIGURACIÓN
        </h3>

        <div class="texto-filtro">ETAPA ELECTORAL</div>
        <v-select
          v-model="selectedRound"
          :items="['Primera Vuelta', 'Segunda Vuelta']"
          variant="outlined"
          density="compact"
          bg-color="rgba(255,255,255,0.1)"
          hide-details
          class="mb-5 text-white"
          @update:model-value="handleRoundChange"
        ></v-select>

        <div class="texto-filtro">PARTIDO / MOVIMIENTO</div>
        <v-select
          v-model="selectedParty"
          :items="partyList"
          item-title="nombre"
          item-value="id"
          variant="outlined"
          density="compact"
          bg-color="rgba(255,255,255,0.1)"
          hide-details
          class="mb-5 text-white"
          placeholder="Ver todos (Ganadores)"
          clearable
        >
          <template v-slot:item="{ props, item }">
            <v-list-item v-bind="props" title="">
              <template v-slot:prepend>
                <div :style="`width: 15px; height: 15px; background: ${item.raw.color}; margin-right: 10px; border: 1px solid white;`"></div>
              </template>
              <v-list-item-title>{{ item.raw.nombre }}</v-list-item-title>
            </v-list-item>
          </template>
        </v-select>

        <v-divider class="my-4 border-opacity-50"></v-divider>

        <div class="texto-filtro">PROVINCIA</div>
        <v-select
          v-model="selectedProvince"
          :items="provinceList"
          item-title="nombre"
          item-value="codigo"
          variant="outlined"
          density="compact"
          bg-color="rgba(255,255,255,0.1)"
          hide-details
          class="mb-3 text-white"
          placeholder="Seleccione..."
          @update:model-value="handleProvinceChange"
        ></v-select>

        <div class="texto-filtro">CANTÓN</div>
        <v-select
          v-model="selectedCanton"
          :items="filteredCantonList"
          item-title="nombre"
          item-value="codigo"
          variant="outlined"
          density="compact"
          bg-color="rgba(255,255,255,0.1)"
          hide-details
          class="mb-6 text-white"
          placeholder="Seleccione..."
          :disabled="!selectedProvince"
        ></v-select>

        <v-btn block height="45" color="white" class="mb-3 font-weight-bold" style="color: #12a2c2; letter-spacing: 0.5px;" @click="handleSearch">
          APLICAR FILTROS
        </v-btn>
        
        <v-btn block height="45" outlined color="white" class="font-weight-bold" style="letter-spacing: 0.5px;" @click="handleClearFilters">
          LIMPIAR FILTROS
        </v-btn>

      </v-container>
    </v-navigation-drawer>

    <v-main class="fondo-general">
       <v-container fluid class="fill-height align-start pt-8">
        <v-row justify="center">
          <v-col cols="12" class="text-center mb-0">
            <div class="d-inline-block">
              <v-card color="#12a2c2" elevation="4" class="px-10 py-2 mb-2 rounded-0 d-flex justify-center align-center" style="min-width: 400px">
                <span class="text-h5 white--text font-weight-bold text-uppercase" style="font-family: 'Oswald', sans-serif !important">
                  RESULTADOS NACIONALES
                </span>
              </v-card>

              <div class="d-flex justify-center">
                <v-btn tile class="btn-vuelta mr-1 elevation-2" :color="selectedRound === 'Primera Vuelta' ? '#F88C0F' : 'white'" :style="{ color: selectedRound === 'Primera Vuelta' ? 'white' : '#555' }" @click="handleSwitchRound('Primera Vuelta')">PRIMERA VUELTA</v-btn>
                <v-btn tile class="btn-vuelta ml-1 elevation-2" :color="selectedRound === 'Segunda Vuelta' ? '#F88C0F' : 'white'" :style="{ color: selectedRound === 'Segunda Vuelta' ? 'white' : '#555' }" @click="handleSwitchRound('Segunda Vuelta')">SEGUNDA VUELTA</v-btn>
              </div>
            </div>
          </v-col>

          <v-col cols="12" md="11" lg="10">
            <v-row>
              <v-col cols="12" md="9">
                <v-card color="transparent" elevation="0" class="overflow-visible" style="min-height: 600px">
                  <MapaEcuador
                    ref="mapComponentRef"
                    v-if="isDataLoaded"
                    :geoJsonProvincias="geoProvinces"
                    :geoJsonCantones="geoCantons"
                    :geoJsonParroquias="geoParishes"
                    :datos="mapData"
                    :configuracion="mapConfig"
                  />
                  <div v-else class="d-flex justify-center align-center" style="height: 500px">
                    <v-progress-circular indeterminate color="#12a2c2" size="64"></v-progress-circular>
                  </div>
                </v-card>
              </v-col>

              <v-col cols="12" md="3">
                <v-card elevation="4" rounded="0" class="mt-4">
                  <div class="pa-3 white--text" style="background-color: #00838f; font-family: sans-serif">
                    <div class="text-caption mb-0 opacity-80">Partido Político</div>
                    <div class="text-subtitle-1 font-weight-medium">Resultados Generales ▼</div>
                  </div>

                  <v-card-text class="pa-0" style="max-height: 500px; overflow-y: auto">
                    <div v-if="selectedRound === 'Segunda Vuelta'">
                      <div v-for="(candidato, i) in generalDataRound2" :key="i">
                        <div class="d-flex flex-column align-center py-4 px-2 border-b">
                          <v-avatar size="80" class="mb-2" :style="`border: 3px solid ${candidato.color}`">
                            <v-img :src="candidato.foto" alt="Candidato" cover></v-img>
                          </v-avatar>
                          <div class="text-subtitle-1 font-weight-bold text-uppercase text-center" style="font-family: 'Oswald', sans-serif !important; line-height: 1.1;">
                            {{ candidato.nombre }}
                          </div>
                          <div class="caption grey--text text--darken-1 text-center font-weight-bold mb-1">
                            {{ candidato.partido }}
                          </div>
                          <v-chip :color="candidato.color" size="small" label class="font-weight-bold mt-1 text-white">{{ candidato.porcentaje }}%</v-chip>
                          <div class="caption mt-1">{{ candidato.votos }} VOTOS</div>
                        </div>
                      </div>
                    </div>

                    <div v-else>
                      <v-list density="compact" class="pa-0">
                        <v-list-item v-for="(partido, i) in generalDataRound1" :key="i" class="py-3 border-b">
                          <template v-slot:prepend>
                            <div :style="`width: 20px; height: 20px; background-color: ${partido.color}; margin-right: 15px; border-radius: 2px;`"></div>
                          </template>
                          <v-list-item-title class="text-caption font-weight-bold text-wrap mb-1" style="line-height: 1.2">
                            {{ partido.nombre }}
                          </v-list-item-title>
                          <v-list-item-subtitle class="text-caption grey--text">
                            {{ partido.porcentaje }}%
                          </v-list-item-subtitle>
                        </v-list-item>
                      </v-list>
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
/**
 * @file ResultadosNacionalesView.vue
 * @description Vista principal que contiene el mapa electoral y los filtros de búsqueda.
 * Integra el componente MapaEcuador y gestiona la lógica de visualización de candidatos.
 * @component ResultadosNacionalesView
 */

// 1. IMPORTS DE VUE
import { ref, computed, onMounted } from 'vue'

// 2. IMPORTS DE COMPONENTES
import MapaEcuador from "@/components/MapaEcuador.vue"

// 3. IMPORTS DE ASSETS/DATOS
import provinciasData from "@/assets/GeoJSON/provincias.json"
import cantonesData from "@/assets/GeoJSON/cantones.json"
import parroquiasData from "@/assets/GeoJSON/parroquias.json"

// 4. CONSTANTES Y CONFIGURACIONES
/**
 * Datos estáticos de candidatos para la segunda vuelta
 * @constant {Array<Object>}
 */
const INFO_CANDIDATOS_2DA = [
  { id: 1, nombre: "GUILLERMO LASSO", partido: "CREO - PSC", color: "#08519c", porcentaje: 52.36, votos: "4,656,426", foto: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Guillermo_Lasso_%282021%29.jpg/220px-Guillermo_Lasso_%282021%29.jpg" },
  { id: 2, nombre: "ANDRÉS ARAUZ", partido: "UNES", color: "#e67e22", porcentaje: 47.64, votos: "4,236,515", foto: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Andr%C3%A9s_Arauz_Galarza.jpg/220px-Andr%C3%A9s_Arauz_Galarza.jpg" },
]

/**
 * Datos estáticos de partidos para la primera vuelta
 * @constant {Array<Object>}
 */
const INFO_PARTIDOS_1RA = [
  { id: 1, nombre: "Alianza Creo 21 Psc 6", color: "#08519c", porcentaje: 19.74 },
  { id: 2, nombre: "1-5 Unión Por La Esperanza", color: "#e67e22", porcentaje: 32.72 },
  { id: 3, nombre: "Movimiento Pachakutik", color: "#4a148c", porcentaje: 19.39 },
  { id: 4, nombre: "Izquierda Democrática", color: "#f1c40f", porcentaje: 15.68 },
  { id: 6, nombre: "Partido Político Avanza", color: "#e91e63", porcentaje: 2.03 },
  { id: 7, nombre: "Sociedad Patriótica", color: "#c0392b", porcentaje: 1.05 },
]

/**
 * Datos simulados para el mapa de segunda vuelta
 * @constant {Array<Object>}
 */
const MAPA_2DA = [
  { id: "01", id_partido: 1, ganador: "Lasso" },
  { id: "17", id_partido: 1, ganador: "Lasso" },
  { id: "09", id_partido: 2, ganador: "Arauz" },
  { id: "13", id_partido: 2, ganador: "Arauz" },
  { id: "11", id_partido: 1, ganador: "Lasso" },
]

// 5. VARIABLES REACTIVAS
/**
 * Referencia al componente MapaEcuador
 * @type {import('vue').Ref<HTMLElement|null>}
 */
const mapComponentRef = ref(null)

/**
 * Estado de apertura del drawer de filtros
 * @type {import('vue').Ref<boolean>}
 * @default false
 */
const isDrawerOpen = ref(false)

/**
 * Indica si los datos GeoJSON han sido cargados
 * @type {import('vue').Ref<boolean>}
 * @default false
 */
const isDataLoaded = ref(false)

/**
 * Vuelta electoral seleccionada
 * @type {import('vue').Ref<string>}
 * @default "Primera Vuelta"
 */
const selectedRound = ref("Primera Vuelta")

/**
 * Partido seleccionado en el filtro
 * @type {import('vue').Ref<number|null>}
 * @default null
 */
const selectedParty = ref(null)

/**
 * Provincia seleccionada en el filtro
 * @type {import('vue').Ref<string|null>}
 * @default null
 */
const selectedProvince = ref(null)

/**
 * Cantón seleccionado en el filtro
 * @type {import('vue').Ref<string|null>}
 * @default null
 */
const selectedCanton = ref(null)

// Datos GeoJSON almacenados
const geoProvinces = ref(null)
const geoCantons = ref(null)
const geoParishes = ref(null)

/**
 * Configuración del mapa pasada como prop
 * @type {import('vue').Ref<Object>}
 */
const mapConfig = ref({ 
  colorDefecto: "#ECEFF1", 
  colorBorde: "#FFFFFF", 
  exportar: true 
})

// 6. COMPUTED PROPERTIES
/**
 * Lista de partidos/candidatos según la vuelta seleccionada
 * @type {import('vue').ComputedRef<Array>}
 */
const partyList = computed(() => {
  return selectedRound.value === "Segunda Vuelta" ? INFO_CANDIDATOS_2DA : INFO_PARTIDOS_1RA
})

/**
 * Datos generales para lista lateral (Segunda Vuelta)
 * @type {import('vue').ComputedRef<Array>}
 */
const generalDataRound2 = computed(() => INFO_CANDIDATOS_2DA)

/**
 * Datos generales para lista lateral (Primera Vuelta)
 * @type {import('vue').ComputedRef<Array>}
 */
const generalDataRound1 = computed(() => INFO_PARTIDOS_1RA)

/**
 * Lista de provincias formateada para el select
 * @type {import('vue').ComputedRef<Array>}
 */
const provinceList = computed(() => {
  if (!geoProvinces.value) return []
  return geoProvinces.value.features
    .map((f) => ({ nombre: f.properties.PROVINCIA, codigo: f.properties.CODPRO }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre))
})

/**
 * Lista de cantones filtrados por la provincia seleccionada
 * @type {import('vue').ComputedRef<Array>}
 */
const filteredCantonList = computed(() => {
  if (!geoCantons.value || !selectedProvince.value) return []
  return geoCantons.value.features
    .filter((f) => f.properties.CODPRO === selectedProvince.value)
    .map((f) => ({ nombre: f.properties.CANTON, codigo: f.properties.CODCAN }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre))
})

/**
 * Genera los datos visuales para pintar el mapa
 * @type {import('vue').ComputedRef<Array>}
 */
const mapData = computed(() => {
  if (selectedRound.value === "Segunda Vuelta") {
    return MAPA_2DA.map((item) => {
      const info = INFO_CANDIDATOS_2DA.find((c) => c.id === item.id_partido)
      return {
        id: item.id,
        colorHover: info ? info.color : "#999",
        ganador: info ? info.nombre : "N/A",
        votos: "---",
        tooltipPersonalizado: `Ganador: ${info ? info.nombre : ""}`,
      }
    })
  }

  // Lógica para Primera Vuelta
  if (selectedParty.value) {
    const partidoInfo = partyList.value.find((p) => p.id === selectedParty.value)
    if (!partidoInfo) return []
    return provinceList.value.map((prov) => ({
      id: prov.codigo,
      colorHover: partidoInfo.color,
      ganador: partidoInfo.nombre,
      tooltipPersonalizado: `Votos: ${Math.floor(Math.random() * 50000)}`,
    }))
  }

  // Datos aleatorios/simulados si no hay filtro específico
  return provinceList.value.map((prov, index) => {
    const partidoRandom = INFO_PARTIDOS_1RA[index % INFO_PARTIDOS_1RA.length]
    return {
      id: prov.codigo,
      colorHover: partidoRandom.color,
      ganador: partidoRandom.nombre,
      tooltipPersonalizado: `Ganador: ${partidoRandom.nombre}`,
    }
  })
})

// 7. FUNCIONES Y MÉTODOS
/**
 * Resetea el cantón al cambiar de provincia
 * @function handleProvinceChange
 */
const handleProvinceChange = () => { 
  selectedCanton.value = null 
}

/**
 * Resetea el partido al cambiar de vuelta (via select)
 * @function handleRoundChange
 */
const handleRoundChange = () => { 
  selectedParty.value = null 
}

/**
 * Cambia la vuelta electoral desde los botones superiores
 * @function handleSwitchRound
 * @param {string} round - Nombre de la vuelta
 */
const handleSwitchRound = (round) => {
  selectedRound.value = round
  selectedParty.value = null
}

/**
 * Limpia todos los filtros y resetea el mapa
 * @function handleClearFilters
 */
const handleClearFilters = () => {
  selectedParty.value = null
  selectedProvince.value = null
  selectedCanton.value = null
  selectedRound.value = "Primera Vuelta"
  
  if (mapComponentRef.value) {
    // Nota: El componente hijo debe exponer 'resetMap' (o handleResetMap según refactor)
    // Asumimos que el hijo expone handleResetMap o similar via defineExpose
    if(mapComponentRef.value.handleResetMap) {
        mapComponentRef.value.handleResetMap()
    } else if (mapComponentRef.value.resetMap) {
        mapComponentRef.value.resetMap()
    }
  }
}

/**
 * Ejecuta la búsqueda y navegación en el mapa según los filtros
 * @function handleSearch
 */
const handleSearch = () => {
  isDrawerOpen.value = false
  if (mapComponentRef.value) {
    if (selectedCanton.value && selectedProvince.value) {
      const cantonObj = filteredCantonList.value.find((c) => c.codigo === selectedCanton.value)
      if (cantonObj) {
        // Se llama a navigateExternally del componente hijo
        mapComponentRef.value.navigateExternally(
            "cantones", 
            selectedCanton.value, 
            cantonObj.nombre, 
            selectedProvince.value
        )
      }
    } else if (selectedProvince.value) {
      const provObj = provinceList.value.find((p) => p.codigo === selectedProvince.value)
      if (provObj) {
        mapComponentRef.value.navigateExternally(
            "provincias", 
            selectedProvince.value, 
            provObj.nombre
        )
      }
    }
  }
}

// 8. LIFECYCLE HOOKS
onMounted(() => {
  // Simulación de carga de datos asíncrona
  setTimeout(() => {
    geoProvinces.value = provinciasData
    geoCantons.value = cantonesData
    geoParishes.value = parroquiasData
    isDataLoaded.value = true
  }, 500)
})
</script>

<style scoped>
.fondo-general {
  background-image: url("@/assets/img/Fondos/fondo2.png");
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
}
.texto-filtro { font-family: "Oswald", sans-serif; font-size: 13px; font-weight: 500; margin-bottom: 5px; color: white; letter-spacing: 0.5px; }
.btn-nav { color: #757575; font-weight: 600; text-transform: none; font-size: 1rem; }
.active-nav { color: #f39c12 !important; }
.btn-vuelta { font-family: "Oswald", sans-serif !important; font-weight: bold; letter-spacing: 1px; min-width: 160px; height: 40px !important; }
</style>