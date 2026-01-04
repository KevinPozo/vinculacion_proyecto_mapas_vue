<template>
  <div class="wrapper-mapa">
    <transition name="fade">
      <div 
        v-if="currentLevel !== 'provincias'" 
        class="boton-regresar" 
        @click="handleGoBack"
        title="Regresar"
      >
        <svg style="width: 24px; height: 24px" viewBox="0 0 24 24">
          <path fill="#555" d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z" />
        </svg>
      </div>
    </transition>

    <div class="contenedor-mapa" ref="chartDivRef"></div>
  </div>
</template>

<script setup>
/**
 * @file MapaEcuador.vue
 * @description Componente de visualización de mapas coropléticos de Ecuador con navegación drill-down.
 * Corrección aplicada: Prioridad de nombres visuales (Parroquia -> Cantón -> Provincia).
 */

import { ref, onMounted, onUnmounted, watch, shallowRef } from 'vue'
import * as am4core from "@amcharts/amcharts4/core"
import * as am4maps from "@amcharts/amcharts4/maps"
import am4themes_animated from "@amcharts/amcharts4/themes/animated"

am4core.useTheme(am4themes_animated)

// --- PROPS ---
const props = defineProps({
  geoJsonProvincias: { type: Object, required: true },
  geoJsonCantones: { type: Object, required: true },
  geoJsonParroquias: { type: Object, required: true },
  datos: { type: Array, default: () => [] },
  configuracion: {
    type: Object,
    default: () => ({ colorDefecto: "#D9D9D9", colorBorde: "#FFFFFF", exportar: true }),
  },
})

// --- VARIABLES ---
const chartDivRef = ref(null)
const chartInstance = shallowRef(null)
const polygonSeries = shallowRef(null)
const currentLevel = ref("provincias")
const navigationHistory = ref([])

// --- WATCHERS ---
watch(() => props.datos, () => {
  if (chartInstance.value && currentLevel.value === "provincias") {
    initializeMap()
  }
}, { deep: true })

// --- MÉTODOS ---

/**
 * Inicializa el mapa
 */
const initializeMap = () => {
  if (chartInstance.value) chartInstance.value.dispose()

  let chart = am4core.create(chartDivRef.value, am4maps.MapChart)
  chart.background.fillOpacity = 0
  chart.projection = new am4maps.projections.Mercator()
  chart.panBehavior = "move"
  chart.chartContainer.wheelable = true

  // Zoom Control
  chart.zoomControl = new am4maps.ZoomControl()
  chart.zoomControl.align = "right"
  chart.zoomControl.valign = "bottom"
  chart.zoomControl.marginBottom = 20
  chart.zoomControl.marginRight = 15

  // Botón Home
  let homeButton = new am4core.Button()
  homeButton.events.on("hit", () => { handleResetMap() })
  homeButton.icon = new am4core.Sprite()
  homeButton.padding(7, 5, 7, 5)
  homeButton.width = 30
  homeButton.icon.path = "M10,20V14H14V20H19V12H22L12,3L2,12H5V20H10Z"
  homeButton.marginBottom = 5
  homeButton.parent = chart.zoomControl
  homeButton.insertBefore(chart.zoomControl.plusButton)

  // Menú Exportar
  if (props.configuracion.exportar !== false) {
    chart.exporting.menu = new am4core.ExportMenu()
    chart.exporting.menu.align = "right"
    chart.exporting.menu.verticalAlign = "top"
    chart.exporting.menu.items = [{
      label: "...",
      icon: "data:image/svg+xml;charset=utf-8,%3Csvg viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z' fill='%23666'/%3E%3C/svg%3E",
      menu: [
        { label: "Imagen", menu: [{ type: "png", label: "PNG" }, { type: "jpg", label: "JPG" }, { type: "svg", label: "SVG" }, { type: "pdf", label: "PDF" }] },
        { type: "print", label: "Imprimir" }
      ]
    }]
  }

  let series = chart.series.push(new am4maps.MapPolygonSeries())
  series.useGeodata = true
  series.calculateVisualCenter = true

  // Procesar datos iniciales
  const featuresProcesados = processCompleteData(props.geoJsonProvincias, "CODPRO")
  series.data = featuresProcesados
  chart.geodata = { type: "FeatureCollection", features: featuresProcesados }

  // Estilos del polígono
  let polygonTemplate = series.mapPolygons.template
  polygonTemplate.fill = am4core.color(props.configuracion.colorDefecto)
  polygonTemplate.stroke = am4core.color(props.configuracion.colorBorde)
  polygonTemplate.strokeWidth = 1
  polygonTemplate.propertyFields.fill = "colorHover"

  // Tooltips
  series.tooltip.getFillFromObject = false
  series.tooltip.background.fill = am4core.color("#8E44AD")
  series.tooltip.background.stroke = am4core.color("#FFFFFF")
  series.tooltip.background.strokeWidth = 2
  series.tooltip.label.fill = am4core.color("#FFFFFF")

  polygonTemplate.tooltipHTML = `
    <div style="font-family: sans-serif; text-align: left; min-width: 150px; padding: 5px;">
      <div style="font-weight: bold; font-size: 14px; text-transform: uppercase; border-bottom: 1px solid rgba(255,255,255,0.4); margin-bottom: 4px;">
        {nombre_visual}
      </div>
      <div style="font-size: 12px; line-height: 1.4;">{tooltipPersonalizado}</div>
    </div>
  `

  polygonTemplate.adapter.add("tooltipHTML", (text, target) => {
    if (!target.dataItem.dataContext.ganador && !target.dataItem.dataContext.tooltipPersonalizado) {
      return `<div style="text-align:center"><strong>{nombre_visual}</strong></div>`
    }
    return text
  })

  // Hover state
  let hs = polygonTemplate.states.create("hover")
  hs.properties.stroke = am4core.color("#333")
  hs.properties.strokeWidth = 2

  polygonTemplate.events.on("hit", handleRegionClick)

  polygonSeries.value = series
  chartInstance.value = chart
  centerMapOnData()
}

/**
 * Centra el mapa en los datos
 */
const centerMapOnData = () => {
  if(!polygonSeries.value) return
  polygonSeries.value.events.once("datavalidated", () => {
    chartInstance.value.zoomToRectangle(
      polygonSeries.value.north,
      polygonSeries.value.east,
      polygonSeries.value.south,
      polygonSeries.value.west,
      1.1,
      true
    )
  })
}

/**
 * Procesa GeoJSON y asigna nombres priorizando lo específico sobre lo general
 * CORRECCIÓN APLICADA AQUÍ
 */
const processCompleteData = (geojsonOriginal, campoID) => {
  if (!geojsonOriginal || !geojsonOriginal.features) return []
  const features = JSON.parse(JSON.stringify(geojsonOriginal.features))

  return features.map((f) => {
    if (f.properties && f.properties[campoID]) f.id = f.properties[campoID]
    
    // --- CORRECCIÓN: PRIORIDAD INVERTIDA ---
    // Buscamos primero PARROQUIA, luego CANTON, luego PROVINCIA.
    // Así evitamos que un cantón muestre el nombre de su provincia.
    f.properties.nombre_visual = 
      f.properties.PARROQUIA || 
      f.properties.CANTON || 
      f.properties.PROVINCIA || 
      f.properties.DPA_DESPRO ||
      "Desconocido"

    // Ajuste Galápagos
    if (f.geometry) {
      const esGalapagos = f.properties.CODPRO === "20" || f.properties.id === "20"
      const shiftX = esGalapagos ? 7 : 0
      const shiftY = esGalapagos ? -0.5 : 0
      const procesarAnillo = (ring) => ring.reverse().map((coord) => [coord[0] + shiftX, coord[1] + shiftY])

      if (f.geometry.type === "Polygon") {
        f.geometry.coordinates = f.geometry.coordinates.map(procesarAnillo)
      } else if (f.geometry.type === "MultiPolygon") {
        f.geometry.coordinates = f.geometry.coordinates.map((poly) => poly.map(procesarAnillo))
      }
    }

    // Cruce de datos
    const datosVoto = props.datos.find((d) => d.id === f.id)
    if (datosVoto) {
      f.colorHover = datosVoto.colorHover
      f.ganador = datosVoto.ganador
      f.votos = datosVoto.votos
      f.tooltipPersonalizado = datosVoto.tooltipPersonalizado
    } else {
      f.ganador = null
      f.votos = ""
      f.tooltipPersonalizado = "Sin datos"
    }
    return f
  })
}

/**
 * Maneja el click para drill-down
 */
const handleRegionClick = (ev) => {
  const data = ev.target.dataItem.dataContext
  const properties = data.properties

  if (currentLevel.value === "provincias") {
    const codPro = properties.CODPRO
    // Usamos nombre_visual o PROVINCIA explícito para asegurar el título correcto
    const nombre = properties.PROVINCIA || properties.nombre_visual
    const cantonesDelSector = props.geoJsonCantones.features.filter((f) => f.properties.CODPRO === codPro)
    const featuresListos = processCompleteData({ features: cantonesDelSector }, "CODCAN")
    updateMapData(featuresListos, "cantones", `CANTONES DE ${nombre}`)
  } else if (currentLevel.value === "cantones") {
    const codCan = properties.CODCAN
    const nombre = properties.CANTON || properties.nombre_visual
    const parrDelSector = props.geoJsonParroquias.features.filter((f) => f.properties.CODCAN === codCan)
    const featuresListos = processCompleteData({ features: parrDelSector }, "CODPAR")
    updateMapData(featuresListos, "parroquias", `PARROQUIAS DE ${nombre}`)
  }
}

/**
 * Actualiza la data del mapa
 */
const updateMapData = (features, nivel, titulo) => {
  if (features.length === 0) return
  navigationHistory.value.push({
    geodata: chartInstance.value.geodata,
    data: polygonSeries.value.data,
    nivel: currentLevel.value
  })
  const nuevoGeoJSON = { type: "FeatureCollection", features: features }
  chartInstance.value.geodata = nuevoGeoJSON
  polygonSeries.value.data = features
  currentLevel.value = nivel
  centerMapOnData()
}

/**
 * Regresar nivel
 */
const handleGoBack = () => {
  if (navigationHistory.value.length > 0) {
    const estadoAnterior = navigationHistory.value.pop()
    chartInstance.value.geodata = estadoAnterior.geodata
    polygonSeries.value.data = estadoAnterior.data
    currentLevel.value = estadoAnterior.nivel
    centerMapOnData()
  }
}

/**
 * Reset total
 */
const handleResetMap = () => {
  if (currentLevel.value === "provincias") {
    centerMapOnData()
  } else {
    while (navigationHistory.value.length > 0) {
       const estadoAnterior = navigationHistory.value.pop()
       chartInstance.value.geodata = estadoAnterior.geodata
       polygonSeries.value.data = estadoAnterior.data
       currentLevel.value = estadoAnterior.nivel
    }
    centerMapOnData()
  }
}

/**
 * Navegación externa
 */
const navigateExternally = (nivelDestino, codigo, nombre, codigoPadre = null) => {
  if (nivelDestino === "provincias") {
    if (currentLevel.value !== "provincias") handleResetMap()
    setTimeout(() => {
      handleRegionClick({
        target: { dataItem: { dataContext: { properties: { CODPRO: codigo, PROVINCIA: nombre } } } },
      })
    }, 600)
  } else if (nivelDestino === "cantones" && codigoPadre) {
     if (currentLevel.value !== "provincias") handleResetMap()
     setTimeout(() => {
        handleRegionClick({
           target: { dataItem: { dataContext: { properties: { CODPRO: codigoPadre, PROVINCIA: "..." } } } },
        })
     }, 600)
  }
}

defineExpose({ navigateExternally })

// Lifecycle
onMounted(() => { initializeMap() })
onUnmounted(() => { if (chartInstance.value) chartInstance.value.dispose() })
</script>

<style scoped>
.wrapper-mapa { position: relative; width: 100%; height: 600px; background: transparent; }
.contenedor-mapa { width: 100%; height: 100%; background: transparent; }

.boton-regresar {
  position: absolute; 
  top: 0px; 
  right: 60px; 
  z-index: 10;
  background: white; 
  width: 36px;          
  height: 36px;         
  border-radius: 50%;   
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  display: flex; 
  align-items: center; 
  justify-content: center;
  transition: all 0.2s;
}
.boton-regresar:hover { transform: translateY(-2px); background: #f5f5f5; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.5s; }
.fade-enter, .fade-leave-to { opacity: 0; }
</style>