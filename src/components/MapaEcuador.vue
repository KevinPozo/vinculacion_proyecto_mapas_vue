<template>
  <div class="wrapper-mapa">
    <transition name="fade">
      <div
        v-if="nivelActual !== 'provincias'"
        class="boton-regresar"
        @click="subirNivel"
      >
        <v-icon left small>mdi-arrow-left</v-icon>
        Regresar a {{ nombreNivelSuperior }}
      </div>
    </transition>

    <div class="titulo-area">{{ tituloActual }}</div>

    <!-- Panel de Debug -->
    <div v-if="mostrarDebug" class="panel-debug">
      <div class="debug-item">
        <strong>Nivel:</strong> {{ nivelActual }}
      </div>
      <div class="debug-item">
        <strong>Features:</strong> {{ cantidadFeatures }}
      </div>
      <div class="debug-item">
        <strong>Último click:</strong> {{ ultimoClick }}
      </div>
      <div class="debug-item">
        <strong>Geometrías válidas:</strong> {{ geometriasValidas }}
      </div>
    </div>

    <div class="contenedor-mapa" ref="chartdiv"></div>
  </div>
</template>

<script>
import * as am4core from "@amcharts/amcharts4/core";
import * as am4maps from "@amcharts/amcharts4/maps";
import am4themes_animated from "@amcharts/amcharts4/themes/animated";

am4core.useTheme(am4themes_animated);

export default {
  name: "MapaEcuadorDrilldown",

  props: {
    geoJsonProvincias: { type: Object, required: true },
    geoJsonCantones: { type: Object, required: true },
    geoJsonParroquias: { type: Object, required: true },
    configuracion: {
      type: Object,
      default: () => ({
        colorBase: "#ECEFF1",
        colorHover: "#E91E63",
        colorBorde: "#607D8B",
      }),
    },
    debug: {
      type: Boolean,
      default: false
    }
  },

  data() {
    return {
      chart: null,
      polygonSeries: null,
      nivelActual: "provincias",
      historialNavegacion: [],
      tituloActual: "Ecuador",
      mostrarDebug: this.debug,
      cantidadFeatures: 0,
      ultimoClick: "Ninguno",
      geometriasValidas: 0
    };
  },

  computed: {
    nombreNivelSuperior() {
      return this.nivelActual === "parroquias" ? "Cantón" : "Ecuador";
    },
  },

  mounted() {
    this.validarDatos();
    this.crearMapa();
  },

  beforeDestroy() {
    if (this.chart) {
      this.chart.dispose();
    }
  },

  methods: {
    validarDatos() {
      console.log("=== VALIDACIÓN DE DATOS ===");
      
      // Validar provincias
      if (this.geoJsonProvincias?.features) {
        console.log(`✓ Provincias: ${this.geoJsonProvincias.features.length} features`);
        const primeraProvi = this.geoJsonProvincias.features[0];
        console.log("Primera provincia:", primeraProvi.properties);
        console.log("Tipo de geometría:", primeraProvi.geometry?.type);
        console.log("Coordenadas (muestra):", JSON.stringify(primeraProvi.geometry?.coordinates?.[0]?.[0]?.slice(0, 2)));
      }

      // Validar cantones
      if (this.geoJsonCantones?.features) {
        console.log(`✓ Cantones: ${this.geoJsonCantones.features.length} features`);
        const codigosProvinciaEnCantones = new Set(
          this.geoJsonCantones.features.map(f => f.properties.CODPRO)
        );
        console.log("Códigos de provincia en cantones:", Array.from(codigosProvinciaEnCantones));
      }

      // Validar parroquias
      if (this.geoJsonParroquias?.features) {
        console.log(`✓ Parroquias: ${this.geoJsonParroquias.features.length} features`);
      }

      console.log("=========================");
    },

    crearMapa() {
      // Crear el chart
      let chart = am4core.create(this.$refs.chartdiv, am4maps.MapChart);
      
      // CRÍTICO: Usar proyección correcta para coordenadas lat/long
      chart.projection = new am4maps.projections.Miller();
      
      // Desactivar zoom con rueda del mouse
      chart.chartContainer.wheelable = false;
      
      // Configuración de la serie de polígonos
      let polygonSeries = chart.series.push(new am4maps.MapPolygonSeries());
      polygonSeries.useGeodata = true;
      
      // IMPORTANTE: No usar exclude, esto puede causar problemas
      polygonSeries.exclude = [];

      // Validar y cargar datos de provincias
      const tieneProvincias =
        this.geoJsonProvincias &&
        Array.isArray(this.geoJsonProvincias.features) &&
        this.geoJsonProvincias.features.length > 0;

      if (tieneProvincias) {
        console.log("📍 Cargando geodata de provincias...");
        // CORRECCIÓN: Invertir winding order para evitar "cuadro rosa"
        const provinciasCorregidas = this.corregirGeoJSON(this.geoJsonProvincias);
        chart.geodata = provinciasCorregidas;
        this.cantidadFeatures = provinciasCorregidas.features.length;
      } else {
        console.error("❌ No hay datos de provincias válidos");
        chart.geodata = { type: "FeatureCollection", features: [] };
      }

      // Template de polígonos
      let polygonTemplate = polygonSeries.mapPolygons.template;

      // Tooltip que muestra todos los campos disponibles
      polygonTemplate.tooltipText = "[bold]{PROVINCIA}[/]\n{CANTON}\n{PARROQUIA}";
      
      // ESTILOS CRÍTICOS - Asegurar visibilidad
      polygonTemplate.fill = am4core.color(this.configuracion.colorBase);
      polygonTemplate.fillOpacity = 1; // DEBE SER 1
      polygonTemplate.stroke = am4core.color(this.configuracion.colorBorde);
      polygonTemplate.strokeOpacity = 1;
      polygonTemplate.strokeWidth = 1;
      
      // NO USAR nonScalingStroke en mapas (causa problemas de rendering)
      polygonTemplate.nonScalingStroke = false;

      // Estado hover
      let hs = polygonTemplate.states.create("hover");
      hs.properties.fill = am4core.color(this.configuracion.colorHover);
      hs.properties.fillOpacity = 0.8;

      // Estado activo
      let as = polygonTemplate.states.create("active");
      as.properties.fill = am4core.color(this.configuracion.colorHover).brighten(-0.3);

      // Evento de click
      polygonTemplate.events.on("hit", this.manejarClickRegion);

      this.polygonSeries = polygonSeries;
      this.chart = chart;

      // Evento cuando el mapa está listo
      chart.events.on("ready", () => {
        console.log("✓ Mapa renderizado");
        
        // Contar geometrías válidas
        this.geometriasValidas = this.polygonSeries.mapPolygons.length;
        console.log(`✓ Polígonos dibujados: ${this.geometriasValidas}`);
        
        // Ajustar vista
        chart.homeZoomLevel = 1;
        chart.goHome();
        
        // Log de bounds
        console.log("Bounds del mapa:", {
          north: this.polygonSeries.north,
          south: this.polygonSeries.south,
          east: this.polygonSeries.east,
          west: this.polygonSeries.west
        });
      });

      // Agregar controles de zoom
      chart.zoomControl = new am4maps.ZoomControl();
      chart.zoomControl.align = "right";
      chart.zoomControl.valign = "bottom";
    },

    manejarClickRegion(ev) {
      const data = ev.target.dataItem.dataContext;
      
      console.log("=== CLICK EN REGIÓN ===");
      console.log("Nivel actual:", this.nivelActual);
      console.log("Propiedades:", data);

      if (this.nivelActual === "provincias") {
        const codProvincia = data.CODPRO;
        const nombreProvincia = data.PROVINCIA || "Provincia";
        
        this.ultimoClick = `${nombreProvincia} (${codProvincia})`;
        
        if (codProvincia) {
          console.log(`✓ Navegando a cantones de provincia: ${nombreProvincia} (${codProvincia})`);
          this.entrarEnProvincia(codProvincia, nombreProvincia);
        }
      } else if (this.nivelActual === "cantones") {
        const codCanton = data.CODCAN;
        const nombreCanton = data.CANTON || "Cantón";
        
        this.ultimoClick = `${nombreCanton} (${codCanton})`;
        
        if (codCanton) {
          console.log(`✓ Navegando a parroquias de cantón: ${nombreCanton} (${codCanton})`);
          this.entrarEnCanton(codCanton, nombreCanton);
        }
      }
    },

    entrarEnProvincia(idProvincia, nombreProvincia) {
      console.log(`Buscando cantones con CODPRO = "${idProvincia}"`);
      
      const featuresFiltrados = this.geoJsonCantones.features.filter(f => {
        return f.properties.CODPRO === idProvincia;
      });

      console.log(`Encontrados ${featuresFiltrados.length} cantones`);

      if (featuresFiltrados.length === 0) {
        alert(`No se encontraron cantones para ${nombreProvincia}`);
        return;
      }

      this.actualizarMapa(featuresFiltrados, "cantones", nombreProvincia);
    },

    entrarEnCanton(idCanton, nombreCanton) {
      console.log(`Buscando parroquias con CODCAN = "${idCanton}"`);
      
      const featuresFiltrados = this.geoJsonParroquias.features.filter(f => {
        return f.properties.CODCAN === idCanton;
      });

      console.log(`Encontradas ${featuresFiltrados.length} parroquias`);

      if (featuresFiltrados.length === 0) {
        alert(`No se encontraron parroquias para ${nombreCanton}`);
        return;
      }

      this.actualizarMapa(featuresFiltrados, "parroquias", nombreCanton);
    },

    actualizarMapa(nuevosFeatures, nuevoNivel, nuevoTitulo) {
      // Guardar estado actual en historial
      this.historialNavegacion.push({
        nivel: this.nivelActual,
        geodata: this.chart.geodata,
        titulo: this.tituloActual,
      });

      // Crear nuevo GeoJSON
      const nuevoGeoJSON = {
        type: "FeatureCollection",
        features: nuevosFeatures,
      };

      this.cantidadFeatures = nuevosFeatures.length;

      console.log(`🗺️ Actualizando mapa a nivel: ${nuevoNivel}`);
      console.log(`📊 Cargando ${nuevosFeatures.length} features`);

      // CORRECCIÓN: Invertir winding order también en drill-down
      const geojsonCorregido = this.corregirGeoJSON(nuevoGeoJSON);

      // Actualizar geodata directamente
      this.chart.geodata = geojsonCorregido;
      this.nivelActual = nuevoNivel;
      this.tituloActual = nuevoTitulo;

      // Esperar a que se renderice y hacer zoom
      setTimeout(() => {
        this.geometriasValidas = this.polygonSeries.mapPolygons.length;
        console.log(`✓ Polígonos renderizados: ${this.geometriasValidas}`);
        this.chart.goHome();
      }, 100);
    },

    subirNivel() {
      if (this.historialNavegacion.length > 0) {
        const estadoAnterior = this.historialNavegacion.pop();
        
        console.log(`⬆️ Regresando a nivel: ${estadoAnterior.nivel}`);
        
        this.chart.geodata = estadoAnterior.geodata;
        this.nivelActual = estadoAnterior.nivel;
        this.tituloActual = estadoAnterior.titulo;
        this.cantidadFeatures = estadoAnterior.geodata.features.length;
        
        setTimeout(() => {
          this.geometriasValidas = this.polygonSeries.mapPolygons.length;
          this.chart.goHome();
        }, 100);
      }
    },

    /**
     * Corrige el winding order de los polígonos GeoJSON.
     * amCharts 4 espera que el anillo exterior sea counter-clockwise.
     * Muchos GIS exportan en clockwise. Esto causa que el polígono
     * se renderice como "todo el mundo menos el polígono".
     */
    corregirGeoJSON(geojsonOriginal) {
      // Crear copia profunda para no mutar prop original
      const geojson = JSON.parse(JSON.stringify(geojsonOriginal));

      if (!geojson.features) return geojson;

      geojson.features.forEach(feature => {
        const geometry = feature.geometry;
        if (!geometry) return;

        if (geometry.type === "Polygon") {
          // geometry.coordinates es Array<Array<[lon, lat]>>
          // Anillo 0 es exterior, otros son agujeros
          geometry.coordinates.forEach(ring => {
            ring.reverse();
          });
        } else if (geometry.type === "MultiPolygon") {
          // geometry.coordinates es Array<Array<Array<[lon, lat]>>>
          geometry.coordinates.forEach(polygon => {
            polygon.forEach(ring => {
              ring.reverse();
            });
          });
        }
      });

      return geojson;
    },
  },
};
</script>

<style scoped>
.wrapper-mapa {
  position: relative;
  width: 100%;
  height: 600px;
  background: #f5f5f5; /* Fondo para ver si el contenedor está visible */
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
  padding: 10px 20px;
  border-radius: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  font-family: "Roboto", sans-serif;
  font-weight: 500;
  color: #555;
  display: flex;
  align-items: center;
  transition: all 0.2s;
}
.boton-regresar:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  color: #000;
}
.titulo-area {
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 10;
  font-family: "Oswald", sans-serif;
  font-size: 1.8rem;
  font-weight: 600;
  color: #2c3e50;
  background: rgba(255, 255, 255, 0.95);
  padding: 10px 20px;
  border-radius: 8px;
  pointer-events: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
.panel-debug {
  position: absolute;
  bottom: 20px;
  left: 20px;
  z-index: 10;
  background: rgba(0, 0, 0, 0.85);
  color: #00ff00;
  padding: 12px 16px;
  border-radius: 8px;
  font-family: "Courier New", monospace;
  font-size: 0.75rem;
  max-width: 320px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}
.debug-item {
  margin-bottom: 4px;
  line-height: 1.4;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter,
.fade-leave-to {
  opacity: 0;
}
</style>