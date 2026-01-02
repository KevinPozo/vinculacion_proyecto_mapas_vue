<template>
  <div class="wrapper-mapa">
    <transition name="fade">
      <div
        v-if="nivelActual !== 'provincias'"
        class="boton-regresar"
        @click="handleGoBack"
      >
        <!-- Se asume uso de MDI icons o texto simple si no hay vuetify disponible en este scope -->
        <span class="icono-atras">←</span>
        Regresar a {{ nombreNivelSuperior }}
      </div>
    </transition>

    <div class="titulo-area">{{ tituloActual }}</div>

    <!-- Panel de Debug (Opcional según prop) -->
    <!-- <div v-if="debug" class="panel-debug">
      <div class="debug-item"><strong>Nivel:</strong> {{ nivelActual }}</div>
      <div class="debug-item"><strong>Features:</strong> {{ cantidadFeatures }}</div>
    </div> -->

    <div class="contenedor-mapa" ref="chartDiv"></div>
  </div>
</template>

<script setup>
/**
 * @file MapaElectoral.vue
 * @description Componente principal de visualización de mapas con funcionalidad drill-down (Provincias -> Cantones -> Parroquias).
 * Implementado con AmCharts 4.
 */

import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import * as am4core from "@amcharts/amcharts4/core"
import * as am4maps from "@amcharts/amcharts4/maps"
import am4themes_animated from "@amcharts/amcharts4/themes/animated"

am4core.useTheme(am4themes_animated)

// --- 1. PROPS ---

const props = defineProps({
  /** Objeto GeoJSON de Provincias */
  geoJsonProvincias: {
    type: Object,
    required: true
  },
  /** Objeto GeoJSON de Cantones */
  geoJsonCantones: {
    type: Object,
    required: true
  },
  /** Objeto GeoJSON de Parroquias */
  geoJsonParroquias: {
    type: Object,
    required: true
  },
  /** Configuración de colores y estilos */
  configuracion: {
    type: Object,
    default: () => ({
      colorBase: "#ECEFF1",
      colorHover: "#E91E63",
      colorBorde: "#607D8B",
    })
  },
  /** Activar modo debug */
  debug: {
    type: Boolean,
    default: false
  }
})

// --- 2. EMITS ---

/**
 * Eventos emitidos por el componente
 * @event region-selected - Se emite al seleccionar una región
 * @event level-change - Se emite al cambiar de nivel (drill-down/up)
 */
const emit = defineEmits(['region-selected', 'level-change'])

// --- 3. VARIABLES REACTIVAS ---

const chartDiv = ref(null)
const nivelActual = ref("provincias")
const tituloActual = ref("Ecuador")
const cantidadFeatures = ref(0)
const historialNavegacion = ref([])

// Variables internas de AmCharts (no reactivas para performance)
let chart = null
let polygonSeries = null

// --- 4. COMPUTED PROPERTIES ---

const nombreNivelSuperior = computed(() => {
  return nivelActual.value === "parroquias" ? "Cantón" : "Ecuador"
})

// --- 5. FUNCIONES ESTÁNDAR (SEVEE) ---

/**
 * Recupera datos electorales asociados a una geometría.
 * @function getElectionData
 * @param {Object} properties - Propiedades del feature GeoJSON.
 * @returns {Object|null} Datos electorales o null.
 */
const getElectionData = (properties) => {
  // TODO: Implementar lógica de cruce con JSON de datos electorales
  // Por ahora retorna properties para visualización básica
  return properties
}

/**
 * Define el estilo de la región (usado en adaptadores de AmCharts).
 * @function getRegionStyle
 * @param {Object} dataContext - Datos del polígono.
 * @returns {String} Color hexadecimal.
 */
const getRegionStyle = (dataContext) => {
  // Lógica estándar: Si no hay ganador definido, usar color base
  if (!dataContext.ganador) {
    return props.configuracion.colorBase
  }
  // TODO: Retornar color del partido ganador
  return props.configuracion.colorBase
}

/**
 * Configura el tooltip de la región.
 * @function bindRegionTooltip
 * @param {Object} template - Template del polígono de AmCharts.
 */
const bindRegionTooltip = (template) => {
  // Estándar: Nombre zona + Info básica
  // AmCharts usa sintaxis de corchetes para templates de datos
  template.tooltipText = `[bold]{PROVINCIA}[/]
{CANTON}
{PARROQUIA}
[font-size: 12px]Click para detalles[/]`
}

/**
 * Ajusta la cámara del mapa.
 * @function handleMapReady
 */
const handleMapReady = () => {
  if (chart) {
    chart.goHome()
    console.log("✓ Mapa renderizado y ajustado")
  }
}

/**
 * Gestiona la navegación descendente (Drill-down).
 * @function handleRegionClick
 * @param {Object} feature - Objeto GeoJSON/Data del polígono.
 */
const handleRegionClick = (event) => {
  // AmCharts pasa un objeto de evento; el dataContext suele estar en
  // event.target.dataItem.dataContext. Protegemos accesos y añadimos
  // comprobaciones para evitar errores cuando no exista dataContext.
  const target = event?.target || event?.mapPolygon || event
  const data = target?.dataItem?.dataContext || target?.dataContext || event?.dataItem?.dataContext

  if (!data) {
    console.warn('handleRegionClick: dataContext no disponible en el evento', event)
    return
  }

  console.log(`Click en: ${data.PROVINCIA || data.CANTON || data.name}`, data)
  emit('region-selected', data)

  if (nivelActual.value === "provincias") {
    const codProvincia = data.CODPRO || data.properties?.CODPRO
    const nombre = data.PROVINCIA || data.properties?.PROVINCIA || data.name
    if (codProvincia) {
      entrarEnProvincia(codProvincia, nombre)
    }
  } else if (nivelActual.value === "cantones") {
    const codCanton = data.CODCAN || data.properties?.CODCAN
    const nombre = data.CANTON || data.properties?.CANTON || data.name
    if (codCanton) {
      entrarEnCanton(codCanton, nombre)
    }
  }
}

/**
 * Gestiona la navegación ascendente (Drill-up).
 * @function handleGoBack
 */
const handleGoBack = () => {
  if (historialNavegacion.value.length > 0) {
    const estadoAnterior = historialNavegacion.value.pop()
    
    // Restaurar datos en el gráfico
    chart.geodata = estadoAnterior.geodata
    
    // Restaurar estado reactivo
    nivelActual.value = estadoAnterior.nivel
    tituloActual.value = estadoAnterior.titulo
    cantidadFeatures.value = estadoAnterior.geodata.features.length

    emit('level-change', { nivel: nivelActual.value })
    
    // Re-zoom
    setTimeout(() => {
      chart.goHome()
    }, 100)
  }
}

// --- 6. MÉTODOS AUXILIARES ---

/**
 * Filtra y carga cantones de una provincia.
 * @param {String} idProvincia Código de provincia.
 * @param {String} nombreProvincia Nombre para el título.
 */
const entrarEnProvincia = (idProvincia, nombreProvincia) => {
  const features = props.geoJsonCantones.features.filter(f => f.properties.CODPRO === idProvincia)
  
  if (features.length > 0) {
    actualizarMapa(features, "cantones", `Provincia de ${nombreProvincia}`)
  } else {
    console.warn(`No hay cantones para la provincia ${idProvincia}`)
  }
}

/**
 * Filtra y carga parroquias de un cantón.
 * @param {String} idCanton Código de cantón.
 * @param {String} nombreCanton Nombre para el título.
 */
const entrarEnCanton = (idCanton, nombreCanton) => {
  const features = props.geoJsonParroquias.features.filter(f => f.properties.CODCAN === idCanton)
  
  if (features.length > 0) {
    actualizarMapa(features, "parroquias", `Cantón ${nombreCanton}`)
  } else {
    console.warn(`No hay parroquias para el cantón ${idCanton}`)
  }
}

/**
 * Actualiza la data del mapa y guarda historial.
 * @param {Array} nuevosFeatures Lista de features a renderizar.
 * @param {String} nuevoNivel Nombre del nuevo nivel.
 * @param {String} nuevoTitulo Título a mostrar.
 */
const actualizarMapa = (nuevosFeatures, nuevoNivel, nuevoTitulo) => {
  // Guardar estado actual
  historialNavegacion.value.push({
    nivel: nivelActual.value,
    geodata: chart.geodata,
    titulo: tituloActual.value
  })

  // Preparar nuevo GeoJSON
  const nuevoGeoJSON = {
    type: "FeatureCollection",
    features: nuevosFeatures
  }
  
  // Corregir winding order (necesario para AmCharts)
  const geoJsonCorregido = corregirGeoJSON(nuevoGeoJSON)

  // Aplicar cambios
  chart.geodata = geoJsonCorregido
  nivelActual.value = nuevoNivel
  tituloActual.value = nuevoTitulo
  cantidadFeatures.value = nuevosFeatures.length

  emit('level-change', { nivel: nuevoNivel })

  setTimeout(() => {
    chart.goHome()
  }, 100)
}

/**
 * Corrige el winding order de los polígonos (AmCharts requiere Counter-Clockwise para anillos exteriores).
 * @param {Object} geojsonOriginal 
 */
const corregirGeoJSON = (geojsonOriginal) => {
  const geojson = JSON.parse(JSON.stringify(geojsonOriginal))
  if (!geojson.features) return geojson

  geojson.features.forEach(feature => {
    const geometry = feature.geometry
    if (!geometry) return
    if (geometry.type === "Polygon") {
      geometry.coordinates.forEach(ring => ring.reverse())
    } else if (geometry.type === "MultiPolygon") {
      geometry.coordinates.forEach(poly => poly.forEach(ring => ring.reverse()))
    }
  })
  return geojson
}

/**
 * Inicializa el mapa de AmCharts.
 */
const crearMapa = () => {
  chart = am4core.create(chartDiv.value, am4maps.MapChart)
  chart.projection = new am4maps.projections.Miller()
  chart.chartContainer.wheelable = false

  polygonSeries = chart.series.push(new am4maps.MapPolygonSeries())
  polygonSeries.useGeodata = true
  polygonSeries.exclude = []

  // Cargar datos iniciales
  if (props.geoJsonProvincias && props.geoJsonProvincias.features) {
    const datosCorregidos = corregirGeoJSON(props.geoJsonProvincias)
    chart.geodata = datosCorregidos
    cantidadFeatures.value = datosCorregidos.features.length
  }

  // Configurar Template
  const polygonTemplate = polygonSeries.mapPolygons.template
  bindRegionTooltip(polygonTemplate)
  
  // Estilos base
  polygonTemplate.fill = am4core.color(props.configuracion.colorBase)
  polygonTemplate.stroke = am4core.color(props.configuracion.colorBorde)
  polygonTemplate.strokeWidth = 1
  polygonTemplate.nonScalingStroke = false

  // Estados
  const hs = polygonTemplate.states.create("hover")
  hs.properties.fill = am4core.color(props.configuracion.colorHover)

  const as = polygonTemplate.states.create("active")
  as.properties.fill = am4core.color(props.configuracion.colorHover).brighten(-0.3)

  // Eventos
  polygonTemplate.events.on("hit", handleRegionClick)
  chart.events.on("ready", handleMapReady)

  // Controles
  const zoomControl = new am4maps.ZoomControl()
  zoomControl.align = "right"
  zoomControl.valign = "bottom"
  chart.zoomControl = zoomControl
}

// --- 7. LIFECYCLE HOOKS ---

onMounted(() => {
  crearMapa()
})

onUnmounted(() => {
  if (chart) {
    chart.dispose()
  }
})
</script>

<style scoped>
.wrapper-mapa {
  position: relative;
  width: 100%;
  height: 600px;
  background: #f5f5f5;
}

.contenedor-mapa {
  width: 100%;
  height: 100%;
}

.boton-regresar {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 10;
  background: white;
  padding: 8px 16px;
  border-radius: 20px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
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
  background: rgba(255,255,255,0.9);
  padding: 5px 15px;
  border-radius: 4px;
  pointer-events: none;
}

.panel-debug {
  position: absolute;
  bottom: 10px;
  left: 10px;
  background: rgba(0,0,0,0.8);
  color: #0f0;
  padding: 10px;
  font-family: monospace;
  font-size: 12px;
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
</style>